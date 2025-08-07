# Dev Helper VS Code Extension

Esta extensão abre automaticamente três terminais no VS Code e executa os comandos de desenvolvimento para backend, frontend e nginx, cada um no diretório correto e com máxima verbosidade.

## Como usar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Compile a extensão:
   ```bash
   npm run compile
   ```
3. No VS Code, pressione F5 para rodar em modo de desenvolvimento.
4. Execute o comando `Dev Helper: Start All Dev Services` pelo Command Palette.

## O que cada terminal faz
- **Backend (Rust):** `cargo run -vv` (diretório `backend`)
- **Frontend (Next.js):** `npm run dev -- --verbose` (diretório `frontend`)
- **Nginx (Proxy):** `nginx.exe -g "error_log logs/error.log debug;"` (diretório `nginx/nginx`)

---

Você pode modificar os comandos e diretórios conforme sua estrutura de projeto.
