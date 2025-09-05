Plano de implementação do componente Broadcast e da entidade Ticket

Visão geral

Objetivo: permitir que administradores criem e enviem mensagens (broadcasts) para todos ou grupos de usuários, suportar mensagens do tipo conteúdo (HTML/MD/text), enquetes (is_query) com alternativas, e permitir que usuários respondam e marquem mensagens como lidas. Adicionalmente, permitir que usuários abram tickets para administradores.

Principais entidades

- broadcast
  - id (PK)
  - created_at, updated_at
   - title (string) — título curto para exibição em componentes de notificação
  - content (texto longo — HTML, Markdown ou plain text)
  - content_type (enum: html, markdown, text)
  - is_query (boolean)
  - alternatives (JSONB: array de objetos {description, value})

- broadcast_user (tabela intermediária muitos-para-muitos com dados do recebimento)
  - id (PK)
  - broadcast_id (FK -> broadcast.id)
  - user_id (FK -> users.id)
  - read (boolean, default false)
  - answered (boolean, default false)
  - answer_value (integer, nullable) — opcional para enquetes
  - answer_text (text, nullable) — opcional para respostas abertas
  - created_at (timestamp)

- ticket
  - id (PK)
   - user_id (FK -> users.id) (recomendado)
   - question (text)
   - response (text, nullable)
   - created_at
   - responded_at (timestamp, nullable)
   - assignee_user_id (FK -> users.id, nullable) — permitir direcionar/atribuir ticket a um admin ou outro usuário

Considerações e decisões a tomar

- É recomendado armazenar o user_id em `ticket` para auditoria e filtragem por usuário. Confirme se quer isso.
- Para enquetes (`is_query = true`), recomendo armazenar na `broadcast_user` tanto `answer_value` (quando for alternativa selecionada) quanto `answer_text` (quando a pergunta aceitar texto). Confirme se precisa dos dois.
- Em instalações com muitos usuários, a distribuição síncrona (inserir uma linha por usuário no mesmo request) pode ser lenta; para produção é recomendado um job em background/queue para inserir em lote ou usar COPY/bulk insert.
- `alternatives` deve ser `JSONB` no Postgres e o backend deve validar o formato antes de inserir.
- Permissões: apenas administradores podem criar/edit/dispatch broadcasts e responder tickets; usuários autenticados podem listar suas mensagens, marcar `read` e `answer` quando aplicável.

Adicional: adicionar um campo no usuário `blocked_for_tickets` (boolean, default false) que impede o envio de novos tickets quando true (controle para abuso).

- broadcast_blob
   - id (PK)
   - broadcast_id (FK -> broadcast.id) ON DELETE CASCADE
   - filename (text)
   - mime_type (text)
   - size_bytes (bigint)
   - storage_key (text) -- caminho relativo no servidor (ex: broadcasts/{broadcast_id}/{uuid}.jpg)
   - uploaded_by (FK -> users.id, nullable)
   - created_at (timestamp)
   - expires_at (timestamp, nullable)
   - deleted (boolean default false)

Observação: por sua escolha, os blobs serão armazenados no próprio servidor (filesystem) em um diretório montado como volume Docker. A tabela guarda apenas metadata e o `storage_key` apontando para o arquivo no FS.

Passos de implementação (sem código)

1) Modelagem de dados e migrações
   - Criar migrações para as três tabelas (`broadcast`, `broadcast_user`, `ticket`).
   - Definir tipos e constraints (PKs, FKs, índices em `broadcast_user(broadcast_id)` e `broadcast_user(user_id)` e possivelmente compound indexes para consultas eficientes).
   - Garantir que `alternatives` seja JSONB.
   - Criar migração para `broadcast_blob` (metadata) e para tabela de fila `broadcast_blob_delete_queue` (ver abaixo).

2) Atualizar esquema/ORM
   - Adicionar novas structs/models no backend (compatíveis com Diesel/Schema atual).
   - Gerar/atualizar `schema.rs` conforme as migrações.

3) Regras de negócios no backend
   - Endpoints para administradores:
     - Criar broadcast (fornece content, content_type, is_query, alternatives opcional).
     - Enviar broadcast para todos os usuários (dispatch) — implementado como endpoint que insere linhas em `broadcast_user` para cada usuário.
     - Listar broadcasts (com filtros: recentes, is_query, etc.).
     - Responder/editar ou excluir broadcast (opcional).
     - Listar tickets e responder tickets (preencher `response` e `responded_at`).
   - Endpoints para usuários:
     - Listar suas mensagens (broadcast_user joined com broadcast), com paginação.
     - Marcar mensagem como `read`.
     - Responder a uma `is_query` (grava `answer_value` e/ou `answer_text`, marca `answered`).
     - Criar ticket (question).
     - Listar seus tickets e ver respostas.

4) Autenticação e autorização
   - Garantir que apenas admins possam acessar endpoints administrativos (utilizar claims do JWT/roles existentes).
   - Validar que ações de usuário sejam feitas apenas sobre seu próprio `broadcast_user`/`ticket`.

5) Performance e distribuição
   - Implementar distribuição em lote (bulk insert). Para escala maior, planejar um worker/queue (RabbitMQ, Redis queue, ou job scheduling) para evitar timeouts.
    - Considerar a adição de um campo `created_at` em `broadcast_user` para ordenação por tempo de entrega.
         - Adicionar `expires_at` em `broadcast` e/ou em `broadcast_blob` para controlar validade e expiração automática.

    - Sinalização barata usando tabela `configuracoes`
         - Para reduzir leituras caras e evitar varreduras frequentes, usar a tabela `configuracoes` como sinalização leve:
            - Chave global `broadcast:latest_ulid` (registro com `id_usuario = NULL`) contendo a ULID da última broadcast criada.
            - Chave por usuário `ticket:last_ulid` (registro com `id_usuario = <user_ulid>`) contendo a ULID/ID do último ticket visto/registrado para aquele usuário.
         - Fluxo proposto:
            1. Ao criar uma broadcast, o processo de dispatch atualiza também `configuracoes` (upsert) em `broadcast:latest_ulid` com a nova ULID.
            2. No frontend (login / dashboard / rota de transações) o cliente lê um endpoint leve que retorna `latest_ulid` (ou reaproveita `/api/validate_token` estendido). Se `latest_ulid` for maior que o `last_ulid` guardado no contexto do cliente, o frontend decide buscar os novos itens (incremental) ou mostrar CTA para o usuário.
            3. Para tickets, cada usuário pode ter uma configuração `ticket:last_ulid` que o frontend atualiza quando o usuário visualizar/confirmar tickets; o backend pode usar esse valor para entregar apenas tickets novos ao usuário.
         - Exemplo SQL de leitura/upsert:

         ```sql
         -- ler última broadcast global
         SELECT valor AS latest_ulid
         FROM configuracoes
         WHERE chave = 'broadcast:latest_ulid' AND id_usuario IS NULL
         LIMIT 1;

         -- upsert ao criar broadcast (Postgres)
         INSERT INTO configuracoes (id, id_usuario, chave, valor, criado_em, atualizado_em)
         VALUES (gen_random_uuid()::text, NULL, 'broadcast:latest_ulid', '01F8MECH...ulid', now(), now())
         ON CONFLICT (chave, id_usuario)
         DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = EXCLUDED.atualizado_em;

         -- definir last_seen para user (ticket)
         INSERT INTO configuracoes (id, id_usuario, chave, valor, criado_em, atualizado_em)
         VALUES (gen_random_uuid()::text, 'user-ulid', 'ticket:last_ulid', '01F8MECH...ulid', now(), now())
         ON CONFLICT (chave, id_usuario)
         DO UPDATE SET valor = EXCLUDED.valor, atualizado_em = EXCLUDED.atualizado_em;
         ```

         - Vantagens:
            - Muito barato ler um único registro para detectar novidades.
            - Evita disparar queries range/scan para todos os usuários quando não há novidades.
         - Limitações:
            - Não substitui o tracking por usuário para `unread_count` (a não ser que você também guarde `ticket:last_ulid` por usuário e compute unread por diferença, o que pode ser custoso se feito frequentemente sem cache).
            - Clientes offline que voltam podem precisar baixar muitas rows se houver grande diferença entre ULIDs; mitigar com previews/limites e UX de confirmação.

         - Recomendações finais:
            - Use `configuracoes` como sinal barato + Redis para unread_count por usuário (INCR/DECR) quando precisar de badge/contadores rápidos.
            - Para persistência/histórico, materialize `broadcast_user`/`ticket` rows via worker/batch quando necessário; use a configuração por usuário (`ticket:last_ulid`) para evitar criação imediata de N rows quando não for necessário.

            - Uso de Redis para controle de mensagens (broadcasts e tickets)
               - Decidimos usar Redis como camada de performance para controlar sinais e contadores relacionados a broadcasts e tickets. Redis é usado para:
                  1. Contador de unread por usuário: chave `notifications:unread:{user_id}` (INCR no dispatch, DECR no mark_read).
                  2. Versão/sinal por usuário: chave `notifications:version:{user_id}` (INCR quando houver novas notificações) — o frontend compara a versão local com a versão no backend para saber se precisa fetch incremental.
                  3. Fila/pipeline de dispatch: usar listas/streams em Redis (`dispatch:queue`) para enfileirar jobs de criação/bulk-insert em `broadcast_user` e atualização de contadores em lote.
                  4. Pub/Sub (opcional): publicar eventos de invalidação para serviços que mantenham cache local ou para workers que atualizam dashboards/estatísticas.

               - Fluxo resumido:
                  - Admin cria broadcast -> API enfileira job em Redis `dispatch:queue` com payload (broadcast_id, segment)
                  - Worker consome em lotes, faz bulk insert em `broadcast_user` (ou materialização lazy) e na mesma transação/pipeline faz INCR `notifications:unread:{user}` e INCR `notifications:version:{user}` para cada usuário afetado (usar pipelines para eficiência)
                  - Frontend polling adaptativo pede `/api/notifications/unread_count` (lê Redis) e `/api/broadcasts/last` (pode ler `configuracoes`); se `notifications:version` mudou, faz fetch incremental de previews/novidades.

               - Consistência e reconciliação:
                  - Redis é cache/performance layer — a fonte da verdade continua sendo Postgres. Fazer job periódico de reconciliação (DB vs Redis) para corrigir divergências: sumarize `broadcast_user` para calcular unread_count por usuário e comparar com Redis.
                  - Usar transações e pipelines (Redis MULTI/EXEC ou Lua scripts) para reduzir janela de inconsistência no momento do dispatch.

               - Chaves sugeridas e TTLs:
                  - `notifications:unread:{user_id}` -> integer (persistente, opcional TTL)
                  - `notifications:version:{user_id}` -> integer (persistente)
                  - `dispatch:queue` -> list/stream
                  - `dashboard:stats:{user_id}:{params_hash}` -> JSON serialized (TTL 60-300s)

               - Observabilidade:
                  - Medir pipeline length (llen/stream length), avg processing time, misses on Redis reconciliation job.
                  - Alerta se número de mensagens em dispatch queue cresce acima do baseline.

   Deleção/expiração de blobs (fila + cronjob)

   - Tabela de fila `broadcast_blob_delete_queue` (migração):
      - id PK
      - broadcast_blob_id FK -> broadcast_blob(id)
      - enqueued_at timestamptz default now()
      - processed boolean default false
      - processed_at timestamptz nullable

   Fluxo recomendado para expiração e remoção segura:
   - Quando `expires_at <= now()` - uma rotina agendada (cron/worker) seleciona blobs expirados e insere linhas em `broadcast_blob_delete_queue` (ou marca `deleted=true` e enfileira).
   - Um worker/processo em background consome `broadcast_blob_delete_queue`, para cada entrada:
      1. tenta remover o arquivo no filesystem (path obtido via `storage_key`).
      2. ao sucesso, remove/atualiza o registro `broadcast_blob` (ou marca `deleted=true`) e marca a fila `processed=true, processed_at=now()`.
      3. em falha, registra erro e re-tenta conforme política (ex.: exponential backoff) — não deixar objetos órfãos sem tentar.

   Como agendar a rotina (opções):
   - host cron (simples) ou container cron job (ex.: uma imagem leve que roda um script a cada X minutos).
   - agendador interno no backend (ex.: job scheduler que roda periodicamente).
   - usar `pg_cron` se disponível mas, para manipular arquivos locais, é melhor um worker em aplicação/container.

   Exemplo de SQL para criação das tabelas (orientativo):

   ```sql
   CREATE TABLE broadcast_blob (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      broadcast_id uuid NOT NULL REFERENCES broadcast(id) ON DELETE CASCADE,
      filename text NOT NULL,
      mime_type text NOT NULL,
      size_bytes bigint NOT NULL,
      storage_key text NOT NULL,
      uploaded_by uuid REFERENCES users(id),
      created_at timestamptz NOT NULL DEFAULT now(),
      expires_at timestamptz NULL,
      deleted boolean NOT NULL DEFAULT false
   );
   CREATE INDEX idx_broadcast_blob_broadcast_id ON broadcast_blob(broadcast_id);
   CREATE INDEX idx_broadcast_blob_expires_at ON broadcast_blob(expires_at);

   CREATE TABLE broadcast_blob_delete_queue (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      broadcast_blob_id uuid NOT NULL REFERENCES broadcast_blob(id) ON DELETE CASCADE,
      enqueued_at timestamptz NOT NULL DEFAULT now(),
      processed boolean NOT NULL DEFAULT false,
      processed_at timestamptz NULL
   );
   CREATE INDEX idx_blob_delete_queue_processed ON broadcast_blob_delete_queue(processed);
   ```

   Servir arquivos no servidor com segurança

   - Estrutura no filesystem: montar um volume persistente em `/var/www/broadcast_blobs` (ou caminho similar) no container Nginx/backend; cada broadcast tem pasta `broadcasts/{broadcast_id}/`.
   - Para não expor o diretório publicamente, usar Nginx com `X-Accel-Redirect` (internal location) ou gerar URLs protegidos que passam pelo backend para autorização antes de servir.

   Exemplo Nginx (trecho):

   ```
   location /protected/broadcasts/ {
      internal;
      alias /var/www/broadcast_blobs/;
   }

   # Backend depois de validar permissões retorna header:
   # X-Accel-Redirect: /protected/broadcasts/{broadcast_id}/{file}
   ```

   Notas Docker Compose

   - Monte volume: `./data/broadcast_blobs:/var/www/broadcast_blobs:rw` e certifique-se de backup/rotina de limpeza do volume.
   - Se optar por container cron, adicione serviço pequeno que executa o script de enfileiramento a cada X minutos, ou utilize o próprio backend em modo scheduler.

   Políticas operacionais

   - Limite sugerido: até 100 blobs no total (conforme seu comentário). A aplicação deve validar e rejeitar upload acima do limite por broadcast/global.
   - Validar MIME (ex.: image/jpeg, image/png, webp) e tamanho máximo por arquivo (ex.: 5MB) no backend antes de gravar.


6) Validação e segurança
   - Validar `alternatives` no backend (array de objetos com description:string e value:int).
   - Sanitize do `content` se `content_type` = html — ou só permitir html confiável; preferir Markdown renderizado para segurança.

7) Frontend - Admin
   - Interface para criar uma broadcast:
     - Editor de conteúdo (HTML/MD/Text) ou selector de content_type.
     - Toggle `is_query` que mostra/oculta UI para adicionar alternativas (lista editável de {description, value}).
     - Botão `Enviar para todos` (dispatch) com confirmação.
      - Tela administrativa de Broadcasts/Tickets:
         - Área para criar/editar broadcasts (título + conteúdo + tipo + alternativas + is_query).
         - Botão para dispatch (enviar para todos) e opção de enviar para segmentos/usuários específicos.
         - Lista de tickets com filtros (abertos/respondidos/assignee). Permitir atribuir ticket a um admin (`assignee_user_id`) e responder.
   - Visualização de broadcasts enviadas e estatísticas simples (quantos leram, quantas respostas por alternativa).
   - Página de tickets: listar e responder.

8) Frontend - Usuário
   - Componente global de notificações (sino) no header, próximo ao usuário/sair:
      - Mostra um badge com número de notificações não lidas (inclui broadcasts não lidos e tickets respondidos não vistos).
      - Ao clicar, exibe um dropdown com notificações; ordenação: não lidas primeiro (mais recentes primeiro), depois lidas (mais recentes primeiro).
      - No dropdown mostrar até 5 notificações; link "Ver todas" direciona para uma página dedicada de notificações onde o usuário pode ver todo o histórico e filtrar por tipo (broadcast / ticket).
      - Cada notificação no dropdown mostra `title` (se broadcast) ou resumo do ticket e created_at; actions rápidas: marcar como lido, abrir detalhe.
   - Página dedicada de Notificações (opcional): lista completa com paginação, filtros e busca.
   - Lista de mensagens (com filtro unread/all) e badge de notificações.
   - Visualização detalhada da mensagem com renderizador por `content_type`.
   - Marcar como lido.
   - Se `is_query`, UI para responder (selecionar alternativa ou responder texto) — desabilitar depois de responder.
         - Formulário de ticket (abrir ticket) e lista de tickets com respostas.
         - Formulário de ticket (abrir ticket) e lista de tickets com respostas. Se `user.blocked_for_tickets = true`, bloquear envio e mostrar instrução/contato.

    - Frontend — MUI Badge, UX e Comportamento em Tempo-Real
         - Biblioteca UI: usar MUI (Material UI) `Badge` para o contador no header.
            - Badge envolto em `IconButton` com ícone de sino (`Notifications`).
            - Configurações sugeridas:
               - `anchorOrigin`: { vertical: 'top', horizontal: 'right' }
               - `color`: 'error' (ou 'primary' conforme identidade)
               - `badgeContent`: `unread_count` (mostrar "99+" via max)
               - `sx`: responsivo para mobile (tamanho menor, touch target >= 40px)
               - `aria`: `aria-label` e `aria-haspopup` para acessibilidade
         - Componentes a criar:
            1. `NotificationBadge` (ligado ao store/context)
                - Props/internal: `unreadCount`, `onClick` (abre dropdown), `loading` state
                - Faz fetch inicial de `/api/notifications/unread_count` e subscreve updates via WebSocket/SSE
            2. `NotificationsDropdown`
                - Recebe lista (max 5) ordenada: unread first (desc `created_at`), then read (desc)
                - Render item: thumbnail (se blob image exists), title, snippet (first 120 chars), timestamp, actions (mark read, open)
                - CTA "Ver todas" navega para `/notifications`
            3. `NotificationsPage`
                - Paginação/infinite scroll, filtros (broadcast/ticket/unread), buscar, bulk actions (marcar todos lidos)
         - Real-time updates
            - Preferência: WebSocket (WS) ou Server-Sent Events (SSE) para empurrar mudanças:
               - Eventos: `notification:create`, `notification:update` (read/answered), `notification:delete`
               - Payload mínimo: `{ id, type, title, snippet, created_at, unread }`
            - Fallback: polling curto (ex.: every 15s) se WS/SSE indisponível.
            - Backend: emitir evento ao criar `broadcast_user` rows (ou ao responder ticket) para atualizar `unread_count` dos usuarios afetados.
         - API endpoints sugeridos (backend)
            - `GET /api/notifications/unread_count` -> `{ unread_count: int }`
            - `GET /api/notifications?limit=5&only_preview=true` -> list preview
            - `POST /api/notifications/mark_read` (body: `{ ids: [uuid] }`) -> bulk mark read
            - `GET /api/notifications?page=1&limit=20` -> full list
            - WebSocket topic: `/ws/notifications` (auth via cookie/JWT)
         - UX & Performance
            - Mostrar skeletons enquanto carrega.
            - Otimizar payload das notificações (não incluir full content no preview).
            - Use indexes no DB para queries por `user_id` + `read` + `created_at`.
            - Implementar debounce/optimistic UI nas ações de marcar como lido.
         - Acessibilidade / Mobile
            - Dropdown acessível por teclado, `Esc` para fechar, item focável.
            - No mobile, abrir modal em vez de dropdown para melhor usabilidade.
         - Segurança
            - Autorizar cada request (somente retornar notificações do usuário).
            - Sanitizar snippet/preview (XSS) antes de renderizar (render markdown/HTML com sanitizer).

9) Testes
   - Unit tests para validação de payloads e comportamento das APIs.
   - Integração test para endpoint de dispatch (verifica inserts em `broadcast_user`).
   - Testes frontend para fluxo de usuário: ver mensagem, responder, marcar read.

10) Deploy e rollout
   - Aplicar migrações no ambiente de staging.
   - Testar distribuição em staging com número representativo de usuários.
   - Monitorar performance e otimizar (bulk insert/worker) antes do rollout em produção.

11) Observabilidade
   - Adicionar logs para operações de dispatch e erros.
   - Expor métricas (número de broadcasts, entregas, respostas) se necessário.




## Decisões aplicadas

As decisões abaixo foram aplicadas e incorporadas ao plano e ao modelo de dados:

- Tickets: a tabela `ticket` inclui `user_id` (remetente) e `assignee_user_id` (nullable) para permitir atribuição a administradores; a atribuição é feita via interface/admin e não é obrigatória para que o ticket exista.
- Enquetes: apenas `answer_value` (inteiro) será armazenado em `broadcast_user` para respostas de enquetes; respostas abertas em texto não serão salvas inicialmente.
- Bloqueio de tickets: `user.blocked_for_tickets` (boolean) foi adicionada ao modelo de usuário para impedir o envio de novos tickets quando true.
- Distribuição: arquitetura preparada para grande escala (>10k) — usar background job/queue para dispatch de broadcasts.
- Formato do conteúdo: suportaremos HTML (com sanitização no backend) e Markdown (armazenado e renderizado no frontend).
- `title` do broadcast é obrigatório e será usado nas notificações e listagens.
- Preview de notificações: mostrar 5 itens no dropdown.
- Expiração de blobs: política de HARD DELETE automático — arquivos e metadata removidos quando expirarem.
- Armazenamento de blobs: armazenar no filesystem do servidor; limite global de armazenamento definido em 1GB; `size_bytes` é registrado no upload para controle de quota.

- Infra de performance: Redis será usado para controle de broadcasts e tickets (contadores de unread, versão/sinal por usuário, fila de dispatch e pub/sub para invalidações entre instâncias).

Próximos passos sugeridos

- Vou criar as migrations SQL (incluindo `broadcast_blob`, `broadcast_blob_delete_queue`, e atualizações em `ticket`/`broadcast_user`), atualizar `schema.rs` e os models em `backend/src/models/`, e adicionar endpoints no backend (upload/confirm/delete/list + presigned-like flow via backend), além de esboçar o worker/cron para expiração.
- Se confirmar, procedo com as migrações em formato Diesel e os esboços de código.



