# Testes de Autenticação e Registro

## Testes Unitários (`src/services/auth/mod.rs`)
- Cadastro de usuário sem campos opcionais
- Cadastro com campos obrigatórios vazios (deve falhar)
- Cadastro duplicado (email ou nome de usuário já existente, deve falhar)
- Serialização/deserialização de usuário e strings longas
- Cadastro de usuário padrão
- Cadastro de usuário pendente
- Reset de senha
- Login correto e login errado

## Testes de Integração (`tests/auth.rs`)
- Registro de usuário via endpoint `/register`
- Registro de usuário pendente via endpoint `/register-pending`
- Login correto via endpoint `/login` (retorna mensagem de sucesso)
- Login errado via endpoint `/login` (retorna mensagem de erro)
- Reset de senha via endpoint `/reset-password/{id}`

Todos os testes são executados automaticamente com `cargo test`.
