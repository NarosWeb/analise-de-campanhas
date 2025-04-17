from crontab import CronTab

# Cria um novo cron para o usuário atual
cron = CronTab(user=True)

# Comando que será executado: ajuste o caminho conforme necessário!
comando = 'python C:/BotWhatsappAI/enviar_mensagens.py'

# Verifica se já existe o job
for job in cron:
    if job.comment == 'envio_mensagens_auto':
        cron.remove(job)
        break

# Cria o job
job = cron.new(command=comando, comment='envio_mensagens_auto')
job.every(4).days()

# Salva o cron
cron.write()
print('✅ Agendamento criado com sucesso! A cada 4 dias o script será executado.')