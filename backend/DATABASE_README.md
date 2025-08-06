# Database Manager - rider_finance2

Script PowerShell para gerenciar bancos de dados PostgreSQL com suporte a múltiplos ambientes e snapshots.

## 🚀 Funcionalidades

### Ambientes Suportados
- **dev**: Desenvolvimento (`rider_finance`)
- **test**: Testes (`rider_finance_test`)

### Comandos Disponíveis

#### Setup Inicial
```powershell
# Configurar um ambiente específico
.\db-manager.ps1 -Setup -Environment dev

# Configurar todos os ambientes
.\db-manager.ps1 -Setup -Environment all
```

#### Migrações
```powershell
# Criar nova migração
.\db-manager.ps1 -MigrationName "create_users_table"

# Executar migrações em um ambiente
.\db-manager.ps1 -Migrate -Environment test

# Executar migrações em todos os ambientes
.\db-manager.ps1 -Migrate -Environment all
```

#### Snapshots 📸
```powershell
# Criar snapshot de um ambiente
.\db-manager.ps1 -Snapshot -Environment dev

# Criar snapshot nomeado de todos os ambientes
.\db-manager.ps1 -Snapshot -Environment all -SnapshotName "v1_0_0"

# Restaurar snapshot
.\db-manager.ps1 -RestoreSnapshot -SnapshotName "v1_0_0" -Environment dev
```

#### Reset
```powershell
# Resetar banco de desenvolvimento
.\db-manager.ps1 -Reset -Environment dev

# Resetar todos os bancos
.\db-manager.ps1 -Reset -Environment all
```

## 📁 Estrutura de Snapshots

Os snapshots são salvos em `./snapshots/` com três tipos de arquivos:

- **`nome_env_timestamp.sql`**: Dump completo (estrutura + dados)
- **`nome_env_timestamp_schema.sql`**: Apenas estrutura das tabelas
- **`nome_env_timestamp_data.sql`**: Apenas dados (formato INSERT)

### Exemplo de uso com containers:
```bash
# Para containers, você pode usar os arquivos de schema e data separadamente
docker exec postgres psql -U user -d database -f schema.sql
docker exec postgres psql -U user -d database -f data.sql
```

## 🔧 Configuração

### Arquivos de Ambiente
- `.env` - Configurações de desenvolvimento (padrão)
- `.env.test` - Configurações de teste

### Credenciais
- Usuário: `usuario`
- Senha: Armazenada no arquivo `.pgpass` (ignorado pelo git)

## 🔒 Segurança

- ✅ Senha armazenada em `.pgpass` (não versionado)
- ✅ Arquivos `.env.*` ignorados pelo git
- ✅ Snapshots e migrações ignorados pelo git
- ✅ Suporte a múltiplos ambientes isolados

## 📦 Dependências

- PostgreSQL instalado e rodando
- Diesel CLI instalado (`cargo install diesel_cli --features postgres`)
- PowerShell 5.1+ (Windows)

## 🎯 Próximos Passos

1. Executar setup inicial: `.\db-manager.ps1 -Setup -Environment all`
2. Criar primeira migração: `.\db-manager.ps1 -MigrationName "initial_schema"`
3. Executar migrações: `.\db-manager.ps1 -Migrate -Environment all`
4. Criar snapshot inicial: `.\db-manager.ps1 -Snapshot -Environment all -SnapshotName "initial"`
