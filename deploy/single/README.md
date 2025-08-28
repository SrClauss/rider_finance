Instruções para criar a imagem única que roda frontend + backend + nginx (apenas artefatos de produção, sem código fonte)

1) Pré-requisitos locais
- Docker instalado
- no host, os binários de backend e artefatos do frontend precisam estar presentes ou você deve executar a build localmente e copiar para o diretório raiz do repo antes de buildar a imagem.

2) Como produzir os artefatos (opcional local)
- Frontend (executar em uma máquina com Node/npm):
  - cd frontend && npm ci && npm run build
  - copie `frontend/.next`, `frontend/public` e `frontend/node_modules` para o repositório

- Backend (rodar em máquina com Rust toolchain):
  - cd backend && cargo build --release
  - copie `backend/target/release/backend` para o repositório

3) Gerar a imagem (local)
- Na raiz do repositório execute:

```bash
docker build -f deploy/single/Dockerfile -t rider_single:latest .
```

4) Rodar a imagem
- Exemplo para testar localmente (mapeia portas e define DOMAIN):

```bash
docker run --rm -e DOMAIN=local.example.com -p 80:80 -p 3000:3000 -p 8000:8000 rider_single:latest
```

- Trocar domínio sem rebuild: basta alterar a variável de ambiente `DOMAIN` no `docker run` ou no orquestrador.

Observações
- A imagem final não contém o código fonte. Ela espera que os artefatos de produção (binário do backend e build do frontend) já existam no contexto de build. Se quiser, posso adicionar um `Makefile`/script que cria esses artefatos antes do build da imagem.
- Para TLS automático em produção recomendo usar Traefik ou emitir certs via Let's Encrypt na máquina host.
