@echo off
cd /d C:\BotWhatsappAI
echo Executando script... >> logs\debug_bat.log
pwsh -Command "python enviar_mensagens_whatsapp.py *> logs\logs_envio.log" >> logs\debug_bat.log 2>&1
echo Fim da execução. >> logs\debug_bat.log
pause