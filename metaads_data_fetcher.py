import requests
import json
from datetime import datetime, timedelta

# Token e conta principal
TOKEN = 'EAAZAi7WXzPw4BOZB2ZBR4Oxk2MZCJZBnKGguuXG5WzFAp0VyPyiAZA1LqAhjzUSipM3i2xZAo4lhpP6eNzRetqhETjNW4iToXsZC2zaBb5ApCEiJrv7J6BjVIv2VZBe7U9t86NZBxH6ZBYZBgcFBcfiaFAkzlIjcHYkYTAA7vZBXwN4UOpyfVkBOdiSRQOoFMcDyANpothvjW4J4XKKwZCPHOCZB1lvV8VjCeOZAjdasuvnedXmHwlgZD'
CONTA_GESTORA = '547447309933040'

# Datas do intervalo
hoje = datetime.now()
inicio = (hoje - timedelta(days=30)).strftime('%Y-%m-%d')
fim = hoje.strftime('%Y-%m-%d')

# Função para obter as subcontas
def listar_contas_gerenciadas():
    url = f"https://graph.facebook.com/v19.0/633698696323806/adaccounts?access_token={TOKEN}"
    resposta = requests.get(url)
    dados = resposta.json()
    return [conta['id'] for conta in dados.get('data', [])]

# Função para buscar os dados de uma conta
def buscar_dados_conta(account_id):
    url = f'https://graph.facebook.com/v19.0/{account_id}/insights'  # <-- aqui corrigido
    params = {
        'access_token': TOKEN,
        'level': 'account',
        'time_range': json.dumps({'since': inicio, 'until': fim}),
        'fields': 'account_name,spend,impressions,clicks,cpc,ctr,actions,website_purchase_roas'
    }
    resposta = requests.get(url, params=params)
    return resposta.json()

# Coletar e exibir os dados de todas as contas
contas = listar_contas_gerenciadas()
print(f'🎯 Contas gerenciadas encontradas: {contas}')

for conta_id in contas:
    dados = buscar_dados_conta(conta_id)
    print(f'\n📊 Dados da conta {conta_id}:')
    print(json.dumps(dados, indent=2))