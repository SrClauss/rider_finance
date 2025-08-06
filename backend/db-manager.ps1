Write-Host "🐘 Diesel DB Manager - rider_finance2" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Função para ler variável DATABASE_URL de um arquivo .env
function Get-DatabaseUrlFromEnv {
    param([string]$envFile)
    if (Test-Path $envFile) {
        $lines = Get-Content $envFile | Where-Object { $_ -match '^DATABASE_URL=' }
        if ($lines) {
            return $lines[0].Substring(13)
        }
    }
    return $null
}

$envs = @(
    @{ name = "dev"; file = ".env" },
    @{ name = "test"; file = ".env.test" }
)

foreach ($env in $envs) {
    $db_url = Get-DatabaseUrlFromEnv $env.file
    if ($db_url) {
        Write-Host "\nAplicando migrações em '$($env.name)' ($db_url)..." -ForegroundColor Yellow
        $env:DATABASE_URL = $db_url
        diesel migration run
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migrações aplicadas com sucesso em '$($env.name)'!" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao aplicar migrações em '$($env.name)'!" -ForegroundColor Red
        }
    } else {
        Write-Host "⚠️  Arquivo $($env.file) não encontrado ou DATABASE_URL ausente." -ForegroundColor Red
    }
}
