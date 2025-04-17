import json

def analisar_dados(dados):
    # Garante que estamos lidando com uma lista de contas
    if isinstance(dados, dict):
        dados = [dados]

    respostas = []

    for conta in dados:
        nome = conta.get("account_name")
        gasto = conta.get("spend", 0)
        roas = conta.get("roas", 0)
        saldo = conta.get("saldo_restante", 0)
        melhor_anuncio = conta.get("melhor_anuncio", "Desconhecido")
        idade = conta.get("idade_compradores", [])
        cidades = conta.get("cidades_top", [])
        plataforma = conta.get("plataforma_destaque", "Não informado")
        genero = conta.get("genero", "Não informado")

        media_idade = round(sum(idade) / len(idade), 1) if idade else "Indefinida"

        texto = f"📊 Relatório da conta *{nome}*:\n"
        texto += f"➡️ Gasto total: R${gasto:.2f}\n"
        texto += f"➡️ ROAS: {roas:.2f}\n"
        texto += f"➡️ Saldo restante: R${saldo:.2f}\n"

        if saldo < 50:
            texto += f"⚠️ *Atenção:* saldo abaixo de R$50,00!\n"

        if roas >= 3:
            texto += f"🚀 *Campanha está performando bem!* Deseja aumentar 20% do orçamento?\n"
        elif roas < 1.5:
            texto += f"🔻 *ROAS baixo*, considere revisar essa campanha.\n"

        texto += f"\n🔍 Melhor anúncio: {melhor_anuncio}\n"
        texto += f"👥 Média de idade dos compradores: {media_idade}\n"
        texto += f"📍 Cidades com melhor resultado: {', '.join(cidades)}\n"
        texto += f"📱 Plataforma com melhor desempenho: {plataforma}\n"
        texto += f"🚻 Gênero predominante: {genero}\n"

        respostas.append(texto)

    return respostas

# 👇 Caminho do arquivo de teste (mude se necessário)
with open("inteligenc/dados_teste.json", "r", encoding="utf-8") as f:
    dados = json.load(f)

respostas = analisar_dados(dados)

# Mostra o resultado
for r in respostas:
    print("\n" + r)