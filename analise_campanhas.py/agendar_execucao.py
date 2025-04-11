from crontab import CronTab

# Cria o cron para o usuário atual
cron = CronTab(user=True)

# Remove tarefas anteriores com o mesmo comando, se existirem
for job in cron:
    if 'python3 C:/BotWhatsappAI/analise_campanhas/analisar_campanhas.py' in job.command:
        cron.remove(job)

# Cria uma nova tarefa que roda de 4 em 4 dias
job = cron.new(
    command='python3 C:/BotWhatsappAI/analise_campanhas/analisar_campanhas.py',
    comment='Executar analise de campanhas a cada 4 dias'
)

# Define o cron para rodar a cada 4 dias às 08h da manhã
job.setall('0 8 */4 * *')

# Salva a tarefa no agendador
cron.write()

print('⏰ Agendamento criado com sucesso! O script será executado a cada 4 dias às 08h.')