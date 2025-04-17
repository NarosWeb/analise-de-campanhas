import os
import json

CAMINHO_JSONS = "./json_convertidos"
CAMINHO_SAIDA = "./mensagens_analise"

def analisar_dados(dados):
    nome = dados.get("account_name")
    gasto = dados.get("spend", 0)
    roas = dados.get("roas", 0)
    cpc = dados.get("cpc", 0)
    ctr = dados.get("ctr", 0)
    saldo = dados.get("saldo_restante", 0)
    anuncio = dados.get("melhor_anuncio")
    plataforma = dados.get("plataforma_destaque")
    genero = dados.get("genero")
    cidades = ", ".join(dados.get("cidades_top", []))
    idades = dados.get("idade_compradores", [])
    media_idade = int(sum(idades) / len(idades)) if idades else "desconhecida"

    texto = f"📈 *Análise da conta {nome}*\n"
    texto += f"💰 Gasto total: R${gasto:.2f}\n"
    texto += f"🎯 ROAS: {roas}\n"
    texto += f"📊 CPC: R${cpc:.2f} | CTR: {ctr:.2f}%\n"
    texto += f"⚡ Plataforma com melhor resultado: {plataforma}\n"
    texto += f"🔥 Anúncio com mais vendas: {anuncio}\n"
    texto += f"👥 Público predominante: Gênero {genero}, média de idade {media_idade}\n"
    texto += f"📍 Cidades com mais compradores: {cidades}\n"

    if saldo < 100:
        texto += f"⚠️ Seu saldo está baixo: R${saldo:.2f}. Considere adicionar créditos.\n"
    if roas >= 2:
        texto += "✅ A campanha está indo bem! Deseja aumentar 20% do orçamento?\n"
    elif roas < 1:
        texto += "🚨 O ROAS está abaixo do ideal. Avalie os anúncios e público-alvo.\n"

    return texto

def salvar_mensagens():
    if not os.path.exists(CAMINHO_SAIDA):
        os.makedirs(CAMINHO_SAIDA)

    for arquivo in os.listdir(CAMINHO_JSONS):
        if arquivo.endswith(".json"):
            caminho_arquivo = os.path.join(CAMINHO_JSONS, arquivo)
            with open(caminho_arquivo, "r", encoding="utf-8") as f:
                try:
                    dados = json.load(f)
                    mensagem = analisar_dados(dados)
                    nome_saida = os.path.splitext(arquivo)[0] + ".txt"
                    with open(os.path.join(CAMINHO_SAIDA, nome_saida), "w", encoding="utf-8") as saida:
                        saida.write(mensagem)
                    print(f"✅ Mensagem criada: {nome_saida}")
                except Exception as e:
                    print(f"Erro ao analisar {arquivo}: {e}")

salvar_mensagens()