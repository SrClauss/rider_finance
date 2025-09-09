# Implementação de Suporte a Múltiplos Fusos Horários - Rider Finance

## Introdução - Plano Geral

O plano de implementação de suporte a múltiplos fusos horários no projeto Rider Finance é essencial para permitir que usuários de diferentes regiões utilizem o sistema com suas configurações locais de tempo, melhorar a confiabilidade dos dados temporais e simplificar o desenvolvimento internacional. O objetivo é armazenar todas as datas com informação de timezone (TIMESTAMPTZ) e permitir que cada usuário configure seu fuso horário preferido, mantendo America/Sao_Paulo como padrão para novos usuários.

## Dúvidas e Pontos de Atenção

1. **Como lidar com possíveis falhas na migração de dados para TIMESTAMPTZ?**
   - Resposta: A migração será feita diretamente no SQL da migração usando `AT TIME ZONE 'America/Sao_Paulo'` para converter os dados existentes, assumindo que estão no fuso horário local brasileiro.

2. **Qual a melhor abordagem para garantir compatibilidade com dados legados durante a migração?**
   - Resposta: Usar uma migração Diesel que edite os dados legados diretamente no banco, convertendo TIMESTAMP para TIMESTAMPTZ com o timezone apropriado.

3. **A execução de scripts diretamente no `main.rs` é a melhor prática ou seria mais adequado separá-los em migrações específicas?**
   - **Decisão**: Usar migrações específicas para alterações de dados (como conversão de TIMESTAMP para TIMESTAMPTZ) e scripts temporários no main.rs para configurações iniciais de usuários. As migrações garantem versionamento e rollback, enquanto scripts temporários são adequados para operações únicas como configuração de fuso horário padrão para usuários existentes.

4. **Como garantir que os logs existentes sejam consistentes com o novo padrão?**
   - **Decisão**: Manter logs históricos como estão para preservar integridade da auditoria. Criar documentação clara sobre o padrão novo (UTC para novos logs) e adicionar uma nota nos logs históricos indicando que foram gerados antes da padronização. Novos logs usarão UTC exclusivamente.



## Checklist de Mudanças Necessárias

### Análise e Planejamento
- [x] Identificar todos os pontos no código onde datas são manipuladas ou armazenadas.
- [x] Mapear todos os campos de data no banco de dados.
- [x] Planejar migração de dados para TIMESTAMPTZ com timezone apropriado.

### Migração de Dados
- [x] Criar migração Diesel para converter campos TIMESTAMP para TIMESTAMPTZ.
- [x] Usar `AT TIME ZONE 'America/Sao_Paulo'` para converter dados existentes.
- [x] Validar a consistência dos dados após a migração.

### Atualização do Backend
- [x] Atualizar todas as funções que manipulam datas para trabalhar com TIMESTAMPTZ.
- [x] Garantir que todas as APIs enviem e recebam datas em formato ISO 8601 com timezone explícito.
- [ ] Criar rota para buscar configurações de fuso horário do usuário.
- [ ] Implementar migração específica para adicionar configuração de fuso horário padrão aos usuários existentes.
- [ ] Usar script temporário no main.rs apenas para configurações iniciais, removendo-o após execução.

### Atualização do Frontend
- [ ] Renomear CategoriaContext para UsuarioContext.
- [ ] Adicionar suporte para carregar configurações de fuso horário do usuário.
- [ ] Implementar conversão de datas para o fuso horário configurado pelo usuário na exibição.

### Configurações de Usuário
- [ ] Criar sistema de configurações por usuário para fuso horário.
- [ ] Definir America/Sao_Paulo como fuso horário padrão para novos usuários.
- [ ] Aplicar fuso horário padrão para usuários existentes via migração.

### Atualização de Logs
- [ ] Configurar o logger para usar timestamps em UTC.
- [ ] Garantir consistência nos logs existentes.

### Testes
- [ ] Escrever testes para validar a consistência das datas em todo o sistema.
- [ ] Testar a migração de dados em um ambiente de staging.
- [ ] Garantir que os testes cubram cenários de falha na migração.

### Documentação
- [ ] Atualizar a documentação do projeto para refletir o padrão de uso de UTC.
- [ ] Comunicar a mudança para toda a equipe.

### Métricas de Sucesso
- [ ] Definir indicadores específicos, como tempo médio de execução da migração e impacto na performance.
- [ ] Monitorar erros relacionados a fusos horários em produção.
- [ ] Avaliar acurácia na conversão de timezones por usuário.
- [ ] Medir satisfação do usuário com as configurações de fuso horário.
- [ ] Tempo médio de conversão de timezone por usuário.
- [ ] Taxa de erros de conversão de datas.
- [ ] Número de usuários que configuraram fuso horário personalizado.
- [ ] Performance de queries com TIMESTAMPTZ vs TIMESTAMP.
- [ ] Tempo de resposta das APIs com conversões de timezone.

## Análise do Projeto Atual

### Estrutura Identificada
- **Backend**: Rust (Axum) com Diesel ORM e PostgreSQL
- **Frontend**: Next.js com TypeScript
- **Datas**: Uso inconsistente de fusos horários (local, UTC, ou não especificado)
- **Banco de Dados**: Campos de data armazenados como `TIMESTAMP` sem timezone

### Problemas Identificados
1. **Inconsistência**: Algumas datas são armazenadas em UTC, outras no horário local.
2. **Conversões**: Erros ao converter entre fusos horários no frontend e backend.
3. **Relatórios**: Dados de diferentes fusos horários geram inconsistências.
4. **Debugging**: Dificuldade em rastrear eventos devido a fusos horários mistos.

## Objetivos da Padronização

### Fluxo de Uso Definido
1. **Armazenamento**: Todas as datas no banco de dados devem ser armazenadas com timezone (TIMESTAMPTZ).
2. **Backend**: Todas as operações de manipulação de datas devem preservar a informação de timezone.
3. **Frontend**: Todas as datas recebidas do backend devem ser convertidas para o fuso horário configurado pelo usuário na exibição.
4. **APIs**: Todas as APIs devem enviar e receber datas em formato ISO 8601 com timezone explícito (ex.: `2025-09-07T12:00:00-03:00`).
5. **Logs**: Todas as entradas de log devem usar UTC para timestamps, mas permitir conversão para visualização.

### Requisitos Funcionais
- ✅ Armazenar todas as datas no banco de dados em UTC.
- ✅ Garantir que todas as APIs enviem e recebam datas em formato ISO 8601 com timezone explícito.
- ✅ Atualizar todas as manipulações de data no backend para usar UTC como padrão.
- ✅ Converter datas para o fuso horário local do usuário apenas no frontend.
- ✅ Atualizar logs para usar timestamps em UTC.

### Requisitos Não-Funcionais
- ✅ Garantir compatibilidade com dados legados (migração de dados existentes para UTC).
- ✅ Documentar claramente o padrão de uso de UTC para toda a equipe.
- ✅ Garantir que a padronização não introduza regressões ou quebras no sistema.

### Plano de Implementação
1. **Análise de Impacto**:
   - Identificar todos os pontos no código onde datas são manipuladas ou armazenadas.
   - Mapear todos os campos de data no banco de dados.
2. **Migração de Dados**:
   - Escrever scripts para converter campos de data existentes para UTC.
   - Validar a consistência dos dados após a migração.
3. **Atualização do Backend**:
   - Atualizar todas as funções que manipulam datas para usar UTC.
   - Garantir que todas as APIs enviem e recebam datas em formato ISO 8601 com timezone explícito.
4. **Atualização do Frontend**:
   - Garantir que todas as datas recebidas do backend sejam tratadas como UTC.
   - Implementar conversão para o fuso horário local do usuário na exibição.
5. **Atualização de Logs**:
   - Configurar o logger para usar timestamps em UTC.
6. **Testes**:
   - Escrever testes para validar a consistência das datas em todo o sistema.
   - Testar a migração de dados em um ambiente de staging.
7. **Documentação**:
   - Atualizar a documentação do projeto para refletir o padrão de uso de UTC.
   - Comunicar a mudança para toda a equipe.

### Atualização do Frontend

#### Renomear e Expandir o Contexto de Categoria
- O contexto atual de categorias será renomeado para `UsuarioContext`.
- Este contexto será responsável por armazenar não apenas as categorias, mas também outras informações do usuário, como configurações.

#### Adicionar Suporte para Configurações no Contexto
1. **Nova Rota no Backend**:
   - Criar uma rota no backend para buscar configurações específicas do usuário pela chave.
   - Exemplo de rota: `/api/configuracoes/:chave`.

2. **Carregar Configurações no Frontend**:
   - Durante a inicialização do `UsuarioContext`, buscar a configuração `time_zone` usando a nova rota.
   - Armazenar o valor no estado do contexto para uso em todo o frontend.

#### Passos para Implementação
1. **Renomear o Contexto**:
   - Renomear `CategoriaContext` para `UsuarioContext`.
   - Atualizar todas as referências no código para refletir o novo nome.

2. **Adicionar Estado para Configurações**:
   - Adicionar um estado no `UsuarioContext` para armazenar configurações do usuário.
   - Exemplo:
     ```tsx
     const [configuracoes, setConfiguracoes] = useState<Record<string, string>>({});
     ```

3. **Buscar Configuração de Fuso Horário**:
   - No `useEffect` do `UsuarioContext`, buscar a configuração `time_zone` ao carregar o contexto.
   - Exemplo:
     ```tsx
     useEffect(() => {
       async function carregarConfiguracoes() {
         const res = await axios.get('/api/configuracoes/time_zone');
         setConfiguracoes((prev) => ({ ...prev, time_zone: res.data.valor }));
       }
       carregarConfiguracoes();
     }, []);
     ```

4. **Atualizar o Layout**:
   - Substituir o `CategoriaProvider` pelo `UsuarioProvider` no layout principal.

#### Benefícios da Alteração
- Centraliza todas as informações do usuário em um único contexto.
- Facilita a expansão futura para incluir novas configurações ou dados do usuário.
- Reduz a necessidade de múltiplas chamadas ao backend, melhorando a performance.

### Migração de Campos de Data para UTC

#### Passo 2: Alteração de Campos de Data

Para garantir que todas as datas sejam armazenadas em UTC, será necessário alterar os tipos de todos os campos de data no banco de dados para `TIMESTAMP WITH TIME ZONE` (`timestamptz`).

#### Tabelas e Campos a Serem Alterados

1. **Tabela `assinaturas`**:
   - `periodo_inicio`
   - `periodo_fim`
   - `criado_em`
   - `atualizado_em`

2. **Tabela `categorias`**:
   - `criado_em`
   - `atualizado_em`

3. **Tabela `configuracoes`**:
   - `criado_em`
   - `atualizado_em`

4. **Tabela `metas`**:
   - `data_inicio`
   - `data_fim`
   - `concluida_em`
   - `criado_em`
   - `atualizado_em`

5. **Tabela `sessoes_trabalho`**:
   - `inicio`
   - `fim`
   - `criado_em`
   - `atualizado_em`

6. **Tabela `transacoes`**:
   - `data`
   - `criado_em`
   - `atualizado_em`

7. **Tabela `usuarios`**:
   - `blocked_date`
   - `criado_em`
   - `atualizado_em`
   - `ultima_tentativa_redefinicao`

8. **Tabela `admins`**:
   - `criado_em`
   - `atualizado_em`

#### Passo 3: Criação de Migração

Será criada uma migração no Diesel para alterar os tipos dos campos listados acima. O script SQL gerado será semelhante ao exemplo abaixo:

```sql
-- Exemplo para a tabela `assinaturas`
ALTER TABLE assinaturas ALTER COLUMN periodo_inicio TYPE TIMESTAMPTZ USING periodo_inicio AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE assinaturas ALTER COLUMN periodo_fim TYPE TIMESTAMPTZ USING periodo_fim AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE assinaturas ALTER COLUMN criado_em TYPE TIMESTAMPTZ USING criado_em AT TIME ZONE 'America/Sao_Paulo';
ALTER TABLE assinaturas ALTER COLUMN atualizado_em TYPE TIMESTAMPTZ USING atualizado_em AT TIME ZONE 'America/Sao_Paulo';

-- Repita para as demais tabelas e campos
```

#### Passo 4: Execução da Migração

A migração será executada automaticamente ao iniciar o backend. O script será chamado no `main.rs` para garantir que todas as alterações sejam aplicadas antes do sistema entrar em produção.

### Configuração Global de Fuso Horário

#### Definição do Fuso Horário Padrão
- Será criada uma configuração global no sistema com o fuso horário padrão definido como `America/Sao_Paulo`.
- Durante o registro de novos usuários, essa configuração será automaticamente atribuída ao cliente.

#### Script Temporário para Usuários Existentes
- Um script será adicionado ao `main.rs` para varrer todos os usuários existentes no banco de dados e criar uma configuração de fuso horário para cada um deles com o valor `America/Sao_Paulo`.
- Este script será executado apenas uma vez e poderá ser removido após garantir que todos os usuários tenham a configuração aplicada.

#### Passos para Implementação
1. **Criar Configuração Global**:
   - Adicionar uma entrada na tabela `configuracoes` com o fuso horário padrão `America/Sao_Paulo`.
2. **Atualizar Registro de Usuários**:
   - Modificar o fluxo de registro para incluir a configuração de fuso horário padrão para novos usuários.
3. **Script Temporário**:
   - Implementar um script no `main.rs` para aplicar a configuração de fuso horário a todos os usuários existentes.

#### Exemplo de Script Temporário
```rust
use crate::db::establish_connection;
use crate::schema::configuracoes::dsl::*;
use crate::schema::usuarios::dsl as usuarios_dsl;
use diesel::prelude::*;
use chrono::Utc;
use ulid::Ulid;

pub fn aplicar_fuso_horario_padrao() {
    let conn = &mut establish_connection();
    let usuarios: Vec<String> = usuarios_dsl::usuarios
        .select(usuarios_dsl::id)
        .load(conn)
        .expect("Erro ao carregar usuários");

    for user_id in usuarios {
        let existe = configuracoes
            .filter(id_usuario.eq(Some(user_id.clone())))
            .filter(chave.eq("fuso_horario"))
            .first::<crate::models::configuracao::Configuracao>(conn)
            .is_ok();

        if !existe {
            let nova_config = crate::models::configuracao::NewConfiguracao {
                id: Ulid::new().to_string(),
                id_usuario: Some(user_id.clone()),
                chave: "fuso_horario".to_string(),
                valor: "America/Sao_Paulo".to_string(),
                categoria: Some("preferencias".to_string()),
                descricao: Some("Fuso horário padrão do usuário".to_string()),
                tipo_dado: Some("string".to_string()),
                eh_publica: false,
                criado_em: Utc::now(),
                atualizado_em: Utc::now(),
            };

            diesel::insert_into(configuracoes)
                .values(&nova_config)
                .execute(conn)
                .expect("Erro ao inserir configuração de fuso horário");
        }
    }
}
```

### Suporte a Múltiplos Fusos Horários na Página de Perfil

#### Funcionalidade
- Adicionar um acordeão na página de perfil para gerenciar o fuso horário do usuário.
- Incluir um combo box dentro do acordeão para selecionar e editar o fuso horário.
- Ao selecionar um fuso horário, a configuração `time_zone` será atualizada no perfil do usuário.

#### Passos para Implementação
1. **Adicionar Acordeão**:
   - Criar um acordeão na página de perfil com o título "Fuso Horário".
   - O acordeão deve expandir para exibir o combo box de seleção de fuso horário.

2. **Criar Combo Box**:
   - O combo box deve listar todos os fusos horários disponíveis (ex.: `America/Sao_Paulo`, `UTC`, `Europe/London`, etc.).
   - Permitir que o usuário selecione um fuso horário da lista.

3. **Atualizar Configuração**:
   - Ao selecionar um fuso horário, enviar uma requisição para a API `/api/configuracoes/time_zone` para atualizar a configuração `time_zone` do usuário.
   - Exibir uma mensagem de sucesso ao salvar a configuração.

4. **Persistência no Frontend**:
   - Atualizar o estado local do contexto `UsuarioContext` para refletir o novo fuso horário selecionado.

#### Exemplo de Código para o Combo Box
```tsx
<Select
  value={cfgForm.timeZone}
  onChange={(e) => setCfgField('timeZone', e.target.value)}
>
  {timeZones.map((tz) => (
    <MenuItem key={tz} value={tz}>
      {tz}
    </MenuItem>
  ))}
</Select>
```

#### Detalhes da Implementação do Suporte a Múltiplos Fusos Horários

1. **Localização da Configuração**:
   - A configuração `time_zone` será armazenada no backend na tabela `configuracoes`.
   - A chave para identificar essa configuração será `time_zone`.

2. **Atualização da Configuração**:
   - Ao selecionar um fuso horário no combo box da página de perfil, uma requisição será enviada para a API `/api/configuracoes/time_zone`.
   - O backend atualizará o valor correspondente na tabela `configuracoes` para o usuário logado.

3. **Persistência no Frontend**:
   - O estado local do contexto `UsuarioContext` será atualizado para refletir o novo valor de `time_zone`.
   - Isso garantirá que o fuso horário selecionado seja utilizado em todas as operações futuras no frontend.

4. **Exibição no Combo Box**:
   - O combo box será preenchido com uma lista de fusos horários disponíveis.
   - O valor atual de `time_zone` será pré-selecionado ao carregar a página de perfil.

5. **Exemplo de Requisição para Atualizar o Fuso Horário**:
```tsx
async function atualizarFusoHorario(novoFuso: string) {
  try {
    await axios.post('/api/configuracoes/time_zone', { valor: novoFuso }, { withCredentials: true });
    setCfgField('timeZone', novoFuso);
    setSnackMessage('Fuso horário atualizado com sucesso!');
    setSnackOpen(true);
  } catch (err) {
    console.error('Erro ao atualizar fuso horário:', err);
    setSnackMessage('Erro ao atualizar fuso horário.');
    setSnackOpen(true);
  }
}
```

#### Benefícios
- Permite que o usuário personalize o fuso horário de acordo com sua localização.
- Melhora a experiência do usuário ao exibir datas e horários no fuso horário preferido.
- Garante que a configuração seja persistida no backend e refletida em todas as operações futuras.

### Métricas de Sucesso
- ✅ 100% das datas armazenadas no banco de dados em UTC.
- ✅ 100% das APIs enviando e recebendo datas em formato ISO 8601 com timezone explícito.
- ✅ Nenhuma inconsistência de fuso horário detectada nos testes.
- ✅ Redução de erros relacionados a fusos horários em produção.

