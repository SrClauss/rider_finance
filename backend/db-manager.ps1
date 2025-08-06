# Script para configurar PostgreSQL e executar migrações
# rider_finance2 - Setup Database

param(
    [switch]$Setup,
    [switch]$Migrate,
    [switch]$Reset,
    [switch]$Snapshot,
    [switch]$Rest🌍 Ambientes disponíveis:
  -Environment dev     # Desenvolvimento (padrão)
  -Environment test    # Testes
  -Environment all     # Todos os ambientes

📊 Bancos de dados:
  dev  → rider_finance
  test → rider_finance_test

📝 Exemplos:
  .\db-manager.ps1 -Setup -Environment all
  .\db-manager.ps1 -MigrationName "create_users_table"
  .\db-manager.ps1 -Migrate -Environment test
  .\db-manager.ps1 -Reset -Environment dev  [string]$MigrationName,
    [string]$SnapshotName,
    [ValidateSet("dev", "test", "all")]
    [string]$Environment = "dev"
)

# Configurações
$DB_USER = "usuario"
$DB_PASSWORD = "dy213y1984"
$DB_HOST = "localhost"
$DB_PORT = "5432"

# Configurações por ambiente
$DB_CONFIGS = @{
    "dev"  = @{
        "name" = "rider_finance"
        "url"  = "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/rider_finance"
    }
    "test" = @{
        "name" = "rider_finance_test"
        "url"  = "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/rider_finance_test"
    }
}

# Definir variável de ambiente para PostgreSQL
$env:PGPASSWORD = $DB_PASSWORD

# Criar diretório de snapshots se não existir
$SNAPSHOT_DIR = "snapshots"
if (-not (Test-Path $SNAPSHOT_DIR)) {
    New-Item -ItemType Directory -Path $SNAPSHOT_DIR -Force | Out-Null
}

# Função para executar comando em um ambiente específico
function Invoke-DatabaseCommand {
    param(
        [string]$EnvName,
        [scriptblock]$Command
    )
    
    $config = $DB_CONFIGS[$EnvName]
    $env:DATABASE_URL = $config.url
    
    Write-Host "🎯 Ambiente: $EnvName ($($config.name))" -ForegroundColor Magenta
    & $Command
}

# Função para executar em múltiplos ambientes
function Invoke-MultiEnvironment {
    param(
        [string[]]$Environments,
        [scriptblock]$Command
    )
    
    foreach ($env_name in $Environments) {
        Write-Host "`n" -NoNewline
        Invoke-DatabaseCommand -EnvName $env_name -Command $Command
    }
}

Write-Host "🐘 PostgreSQL Database Manager - rider_finance2" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

if ($Setup) {
    Write-Host "🔧 Configurando banco de dados..." -ForegroundColor Yellow
    
    # Verificar se PostgreSQL está rodando
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if (-not $pgService -or $pgService.Status -ne "Running") {
        Write-Host "❌ PostgreSQL não está rodando. Iniciando serviço..." -ForegroundColor Red
        Start-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    }
    
    # Definir ambientes a configurar
    $environments = if ($Environment -eq "all") { @("dev", "test") } else { @($Environment) }
    
    foreach ($env_name in $environments) {
        $config = $DB_CONFIGS[$env_name]
        Write-Host "`n📦 Criando banco '$($config.name)' [$env_name]..." -ForegroundColor Green
        
        # Criar banco se não existir
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $($config.name);" 2>$null
        
        # Conceder privilégios
        psql -h $DB_HOST -p $DB_PORT -U postgres -d $($config.name) -c "GRANT ALL PRIVILEGES ON SCHEMA public TO $DB_USER;" 2>$null
        
        # Configurar Diesel para este ambiente
        $env:DATABASE_URL = $config.url
        Write-Host "⚙️ Configurando Diesel para [$env_name]..." -ForegroundColor Green
        diesel setup
    }
    
    Write-Host "`n✅ Setup concluído para todos os ambientes!" -ForegroundColor Green
}

if ($Migrate) {
    Write-Host "🚀 Executando migrações..." -ForegroundColor Yellow
    
    $environments = if ($Environment -eq "all") { @("dev", "test") } else { @($Environment) }
    
    Invoke-MultiEnvironment -Environments $environments -Command {
        diesel migration run
    }
    
    Write-Host "`n✅ Migrações executadas!" -ForegroundColor Green
}

if ($Reset) {
    Write-Host "⚠️ Resetando banco de dados..." -ForegroundColor Red
    
    $environments = if ($Environment -eq "all") { @("dev", "test") } else { @($Environment) }
    
    Invoke-MultiEnvironment -Environments $environments -Command {
        diesel database reset
    }
    
    Write-Host "`n✅ Banco resetado!" -ForegroundColor Green
}

if ($MigrationName) {
    Write-Host "📝 Criando nova migração: $MigrationName" -ForegroundColor Yellow
    
    # Usar ambiente dev para criar migrações (elas são compartilhadas)
    $config = $DB_CONFIGS["dev"]
    $env:DATABASE_URL = $config.url
    diesel migration generate $MigrationName
    
    Write-Host "✅ Migração criada! (será aplicada em todos os ambientes)" -ForegroundColor Green
}

if ($Snapshot) {
    Write-Host "📸 Criando snapshots do banco de dados..." -ForegroundColor Yellow
    
    $environments = if ($Environment -eq "all") { @("dev", "test") } else { @($Environment) }
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    foreach ($env_name in $environments) {
        $config = $DB_CONFIGS[$env_name]
        $snapshot_name = if ($SnapshotName) { "${SnapshotName}_${env_name}_${timestamp}" } else { "${env_name}_${timestamp}" }
        $snapshot_file = "$SNAPSHOT_DIR\${snapshot_name}.sql"
        
        Write-Host "🎯 Criando snapshot: $env_name → $snapshot_file" -ForegroundColor Magenta
        
        # Criar dump completo do banco
        pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $($config.name) --clean --create --if-exists -f $snapshot_file
        
        # Criar dump apenas da estrutura (para containers)
        $schema_file = "$SNAPSHOT_DIR\${snapshot_name}_schema.sql"
        pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $($config.name) --schema-only --clean --create --if-exists -f $schema_file
        
        # Criar dump apenas dos dados (para containers)
        $data_file = "$SNAPSHOT_DIR\${snapshot_name}_data.sql"
        pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $($config.name) --data-only --inserts -f $data_file
        
        Write-Host "  ✓ Snapshot completo: $snapshot_file" -ForegroundColor Green
        Write-Host "  ✓ Schema: $schema_file" -ForegroundColor Green  
        Write-Host "  ✓ Dados: $data_file" -ForegroundColor Green
    }
    
    Write-Host "`n✅ Snapshots criados! Arquivos prontos para uso em containers." -ForegroundColor Green
}

if ($RestoreSnapshot) {
    Write-Host "📥 Restaurando snapshot do banco de dados..." -ForegroundColor Yellow
    
    if (-not $SnapshotName) {
        Write-Host "❌ Erro: -SnapshotName é obrigatório para restaurar snapshot" -ForegroundColor Red
        exit 1
    }
    
    $environments = if ($Environment -eq "all") { @("dev", "test") } else { @($Environment) }
    
    foreach ($env_name in $environments) {
        $config = $DB_CONFIGS[$env_name]
        $snapshot_file = "$SNAPSHOT_DIR\${SnapshotName}_${env_name}_*.sql"
        $found_files = Get-ChildItem -Path $snapshot_file -ErrorAction SilentlyContinue
        
        if ($found_files) {
            $latest_file = $found_files | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            Write-Host "🎯 Restaurando: $env_name ← $($latest_file.Name)" -ForegroundColor Magenta
            
            # Restaurar banco
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f $latest_file.FullName
            
            Write-Host "  ✅ Restaurado com sucesso!" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Snapshot não encontrado para $env_name" -ForegroundColor Red
        }
    }
}

if (-not ($Setup -or $Migrate -or $Reset -or $MigrationName)) {
    Write-Host @"
📋 Uso do script:

  .\db-manager.ps1 -Setup [-Environment <env>]           # Configurar banco inicial
  .\db-manager.ps1 -Migrate [-Environment <env>]         # Executar migrações
  .\db-manager.ps1 -Reset [-Environment <env>]           # Resetar banco
  .\db-manager.ps1 -MigrationName "nome_da_migracao"     # Criar nova migração

🌍 Ambientes disponíveis:
  -Environment dev     # Desenvolvimento (padrão)
  -Environment test    # Testes
  -Environment prod    # Produção
  -Environment all     # Todos os ambientes

� Bancos de dados:
  dev  → rider_finance
  test → rider_finance_test
  prod → rider_finance_prod

�📝 Exemplos:
  .\db-manager.ps1 -Setup -Environment all
  .\db-manager.ps1 -MigrationName "create_users_table"
  .\db-manager.ps1 -Migrate -Environment test
  .\db-manager.ps1 -Reset -Environment dev
"@ -ForegroundColor White
}
