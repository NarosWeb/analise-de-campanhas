from datetime import datetime

def analisar_metricas(dados):
    sugestoes = []
    alertas = []

    for conta in dados:
        nome = conta.get("account_name", "(sem nome)")
        roas = float(conta.get("roas", 0))
        saldo = float(conta.get("saldo_restante", 0))
        cpc = float(conta.get("cpc", 0))
        ctr = float(conta.get("ctr", 0))

        # Sugestão baseada em ROAS
        if roas >= 3:
            sugestoes.append({
                "conta": nome,
                "acao": "Campanha com ROAS alto. Sugerir aumento de 20% no orçamento.",
                "roas": roas
            })

        if roas < 1:
            alertas.append({
                "conta": nome,
                "alerta": "Campanha com ROAS abaixo de 1. Atenção!",
                "roas": roas
            })

        # Saldo baixo
        if saldo < 100:
            alertas.append({
                "conta": nome,
                "alerta": "Saldo da conta está abaixo de R$100. Recarregar!",
                "saldo": saldo
            })

        # CTR e CPC
        if ctr < 1:
            sugestoes.append({
                "conta": nome,
                "acao": "CTR baixo. Testar novos criativos ou públicos.",
                "ctr": ctr
            })

        if cpc > 2:
            sugestoes.append({
                "conta": nome,
                "acao": "CPC acima do ideal. Verificar segmentação e anúncios.",
                "cpc": cpc
            })

    return {
        "data_analise": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "sugestoes": sugestoes,
        "alertas": alertas
    }