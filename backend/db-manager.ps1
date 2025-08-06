Write-Host "🐘 Diesel DB Manager - rider_finance2" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Função para ler variável DATABASE_URL de um arquivo .env
function Get-DatabaseUrlFromEnv {
    param([string]$envFile)
    Write-Host "[DEBUG] Lendo arquivo: $envFile" -ForegroundColor Cyan
    if (Test-Path $envFile) {
        $allText = Get-Content $envFile -Raw -Encoding UTF8 -ErrorAction Stop
        Write-Host "[DEBUG] Conteúdo do arquivo:" -ForegroundColor Cyan
        $allText -split "`n" | ForEach-Object { Write-Host $_ -ForegroundColor DarkGray }
        $match = [regex]::Match($allText, "DATABASE_URL=([^\r\n]+)")
        if ($match.Success) {
            $url = $match.Groups[1].Value
            Write-Host "[DEBUG] DATABASE_URL extraído: '$url'" -ForegroundColor Cyan
            return $url
        } else {
            Write-Host "[DEBUG] Nenhuma linha DATABASE_URL encontrada." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[DEBUG] Arquivo não encontrado: $envFile" -ForegroundColor Yellow
    }
    return $null
}


$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$envs = @(
    @{ name = "dev"; file = Join-Path $scriptDir ".env" },
    @{ name = "test"; file = Join-Path $scriptDir ".env.test" }
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
