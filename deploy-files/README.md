# Deploy do Backend

## Construir e Executar o Contêiner

1. Certifique-se de que o Docker está instalado.
2. Navegue para o diretório raiz do projeto (`d:\rider_finance2\`).
3. Construa a imagem:
   ```
   docker build -t rider-backend .
   ```
4. Execute o contêiner:
   ```
   docker run -p 3000:3000 -p 5432:5432 rider-backend
   ```

O backend estará disponível em `http://localhost:3000` e o PostgreSQL em `localhost:5432` (usuário: postgres, senha: vazia por padrão; configure conforme necessário no script).

## Rodar a Aplicação Completa com Docker Compose

1. Navegue para `d:\rider_finance2\deploy-files\`.
2. Execute:
   ```
   docker-compose up --build
   ```
3. A aplicação estará disponível em `http://localhost:3000` e o banco em `localhost:5432` (usuário: postgres, senha: password).

## Executar Apenas a Imagem do Backend (Sem Compose)

1. Navegue para `d:\rider_finance2\`.
2. Construa a imagem:
   ```
   docker build -t rider-backend-standalone .
   ```
3. Execute:
   ```
   docker run -p 3000:3000 -p 5432:5432 rider-backend-standalone
   ```
4. O backend e o banco estarão rodando no mesmo contêiner, com o certificado SSL em `/app/cert.pem`.

## Construir Imagem Rust no Backend

1. Navegue para `d:\rider_finance2\backend\`.
2. Construa a imagem:
   ```
   docker build -t rider-backend-rust .
   ```
3. Execute:
   ```
   docker run -p 3000:3000 rider-backend-rust
   ```
4. O backend estará disponível em `http://localhost:3000`.

## Executar com Script

1. Navegue para `d:\rider_finance2\backend\`.
2. Torne o script executável:
   ```
   chmod +x run.sh
   ```
3. Execute o script:
   ```
   ./run.sh
   ```
4. A imagem será construída e o contêiner executado automaticamente.
