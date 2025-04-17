import requests, json, os
from datetime import datetime, timedelta
from fpdf import FPDF

# 📌 Configurações
TOKEN = 'EAAZAi7WXzPw4BO5mbURxJfvRNZCYuQmNzJ3ykjU7dKQMvl5tcFBrfHp8sMCmCIg7hh3jiifdplBDVx0PY0NyYh6aEhCpqp0z6ZBwrEFpZC8s2R7L1G6bFZBPuBSqu2Qoe6c4kNr9DNblXOLfLcK6mlO6BqDPIUTthp9x8jO7RfKsWGjnho9N3LgRUs787D3zoxdcVZCaSu'
USER_ID = '633698696323806'
PASTA_SAIDA = 'mensagens_analise'
TEMPLATE_ARQUIVO = 'relatorio_template.txt'

# 🗓️ Intervalo de datas
hoje = datetime.now()
inicio = (hoje - timedelta(days=7)).strftime('%Y-%m-%d')
fim = hoje.strftime('%Y-%m-%d')
inicio_nome = (hoje - timedelta(days=7)).strftime('%d-%m-%Y')
fim_nome = hoje.strftime('%d-%m-%Y')

def listar_contas_gerenciadas():
    url = f"https://graph.facebook.com/v19.0/{USER_ID}/adaccounts?access_token={TOKEN}"
    resposta = requests.get(url).json()
    print("🔍 Resposta da API ao listar contas:", resposta)
    return [conta['id'] for conta in resposta.get('data', [])]

def buscar_dados_conta(account_id):
    url = f"https://graph.facebook.com/v19.0/act_{account_id}/insights"
    params = {
        'access_token': TOKEN,
        'level': 'account',
        'time_range': json.dumps({'since': inicio, 'until': fim}),
        'fields': 'account_name,spend,impressions,clicks,cpc,ctr,actions,website_purchase_roas'
    }
    return requests.get(url, params=params).json()

def gerar_arquivos(nome_conta, dados):
    nome_slug = nome_conta.lower().replace(" ", "_").replace("-", "_")
    nome_arquivo = f"relatório_de_{nome_slug}_{inicio_nome}_a_{fim_nome}"

    texto = open(TEMPLATE_ARQUIVO, encoding='utf8').read()
    texto = texto.replace("{{nome_conta}}", nome_conta)
    texto = texto.replace("{{inicio}}", inicio_nome)
    texto = texto.replace("{{fim}}", fim_nome)
    texto = texto.replace("{{spend}}", dados.get("spend", "0"))
    texto = texto.replace("{{impressions}}", dados.get("impressions", "0"))
    texto = texto.replace("{{clicks}}", dados.get("clicks", "0"))
    texto = texto.replace("{{cpc}}", dados.get("cpc", "0"))
    texto = texto.replace("{{ctr}}", dados.get("ctr", "0"))

    acoes = "\n".join([f"- {a['action_type']}: {a['value']}" for a in dados.get("actions", [])])
    texto = texto.replace("{{acoes}}", acoes or "Nenhuma")

    roas = dados.get("website_purchase_roas", [{}])[0].get("value", "0")
    texto = texto.replace("{{roas}}", roas)

    # Criar .txt
    with open(os.path.join(PASTA_SAIDA, nome_arquivo + ".txt"), "w", encoding='utf8') as f:
        f.write(texto)

    # Criar PDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    for linha in texto.splitlines():
        pdf.cell(200, 10, txt=linha, ln=True)
    pdf.output(os.path.join(PASTA_SAIDA, nome_arquivo + ".pdf"))

# 🔁 Processo principal
contas = listar_contas_gerenciadas()
print(f"🎯 {len(contas)} contas encontradas!")

for conta in contas:
    resposta = buscar_dados_conta(conta)
    if resposta.get("data"):
        dados = resposta["data"][0]
        nome = dados["account_name"]
        gerar_arquivos(nome, dados)
        print(f"✅ Relatório gerado: {nome}")
    else:
        print(f"⚠️ Nenhum dado para conta {conta}")