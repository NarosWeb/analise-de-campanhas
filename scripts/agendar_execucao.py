from crontab import CronTab

# Cria o agendador (usuário atual do Windows)
cron = CronTab(user=True)

# Remove tarefas duplicadas com esse comando
cron.remove_all(comment='executar_relatorio')

# Comando para rodar o script de análise a cada 4 dias às 8h da manhã
job = cron.new(command='python C:/BotWhatsappAI/analise_campanhas.py', comment='executar_relatorio')
job.day.every(4)
job.hour.on(8)

cron.write()
print("✅ Agendamento criado com sucesso!")