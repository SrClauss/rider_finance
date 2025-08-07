# Testes de Autenticação e Registro

## Testes Unitários (`src/services/auth/mod.rs`)
- Cadastro de usuário sem campos opcionais
- Cadastro com campos obrigatórios vazios (deve falhar)
- Cadastro duplicado (email ou nome de usuário já existente, deve falhar)
- Serialização/deserialização de usuário e strings longas
- Cadastro de usuário padrão
- Cadastro de usuário pendente
- Reset de senha
- Login correto e login errado (token JWT gerado)

## Testes de Integração (`tests/auth.rs`)
- Registro de usuário via endpoint `/register`
- Registro de usuário pendente via endpoint `/register-pending`
- Login correto via endpoint `/login` (retorna mensagem de sucesso e token JWT)
- Login errado via endpoint `/login` (retorna mensagem de erro e token nulo)
- Reset de senha via endpoint `/reset-password/{id}`

Todos os testes são executados automaticamente com `cargo test`.

---

### Usuário de Teste para Integração
- **nome_usuario:** Etelvaldo
- **senha:** et123456
- **email:** etelvaldo@example.com

Utilize este usuário para testes manuais e automáticos de autenticação e registro.

---

## Resultados dos Testes - 06/08/2025

**Testes Unitários:**
- Todos os testes passaram (8/8)

**Testes de Integração:**
- Todos os testes passaram (4/4)

**Comando executado:**
```
cargo test -- --nocapture
```

**Status:**
- Todos os testes passaram com sucesso!
- Última execução: 06/08/2025
