Instruções para rodar o backend localmente em container Docker (desenvolvimento/testes)

Pré-requisitos:
- Docker 24+ e Docker Compose v2 (comando `docker compose` disponível)
- O diretório `deploy-files` contém `schema.sql` usado como fallback

Passos:
1) Construir e subir os containers (reconstrói imagens):

```powershell
cd <repo-root>
docker compose -f .\docker-compose.yml up --build
```

2) Logs:
- O `backend` executa `/usr/local/bin/docker-entrypoint.sh`, que espera o Postgres, tenta criar o banco se necessário, importa `deploy-files/schema.sql` como fallback e então executa `diesel migration run`.

3) Se precisar abrir um shell no container backend para depurar:

```powershell
docker compose exec backend /bin/bash
```

4) Problemas comuns:
- `psql: command not found` -> certifiquei que `postgresql-client` é instalado no Dockerfile; se persistir, rebuild com `--no-cache`.
- Falha nas migrations -> veja os logs do backend para a saída do `diesel`.

Observações:
- O serviço `frontend` depende do backend. Para apenas testar o backend, faça `docker compose up --build backend postgres`.
