@echo off
cd /d d:\rider_finance2\tunel
cloudflared-windows-amd64.exe tunnel --config d:\rider_finance2\tunel\config.yml run meu-tunel-ngix
pause
