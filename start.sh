#!/bin/bash
while true
do
  python gerar_relatorios_automaticos.py
  echo "Script finalizado. Aguardando 10 minutos para executar novamente..."
  sleep 600  # Aguarda 10 minutos antes de rodar de novo
done