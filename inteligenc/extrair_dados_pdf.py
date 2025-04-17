import fitz  # PyMuPDF
import re
import os

def extrair_dados_pdf(caminho_pdf):
    try:
        doc = fitz.open(caminho_pdf)
        texto = ""
        for pagina in doc:
            texto += pagina.get_text()
        doc.close()

        # Extrair os dados com regex simples
        dados = {}
        dados["account_name"] = re.search(r"Conta:\s*(.*)", texto)
        dados["spend"] = re.search(r"Gasto total:\s*R\$\s*([\d,.]+)", texto)
        dados["impressions"] = re.search(r"Impressoes:\s*([\d,.]+)", texto)
        dados["clicks"] = re.search(r"Cliques:\s*([\d,.]+)", texto)
        dados["cpc"] = re.search(r"CPC:\s*R\$\s*([\d,.]+)", texto)
        dados["ctr"] = re.search(r"CTR:\s*([\d,.]+)%", texto)
        dados["roas"] = re.search(r"ROAS:\s*([\d,.]+)", texto)
        dados["saldo_restante"] = re.search(r"Saldo restante:\s*R\$\s*([\d,.]+)", texto)
        dados["melhor_anuncio"] = re.search(r"Melhor an[uá]ncio:\s*(.*)\n", texto)
        dados["plataforma_destaque"] = re.search(r"Plataforma destaque:\s*(.*)\n", texto)
        dados["genero"] = re.search(r"G[eê]nero dos compradores:\s*(.*)\n", texto)

        # Idades como lista de inteiros
        idades = re.findall(r"Idade: (\d+)", texto)
        dados["idade_compradores"] = [int(i) for i in idades]

        # Cidades como lista de strings
        cidades = re.findall(r"Cidade: ([\w\s]+)", texto)
        dados["cidades_top"] = cidades

        # Limpar resultados
        resultado = {}
        for chave, match in dados.items():
            if match:
                resultado[chave] = match.group(1).replace(".", "").replace(",", ".") if chave not in ["idade_compradores", "cidades_top"] else match
            elif chave in ["idade_compradores", "cidades_top"]:
                resultado[chave] = dados[chave]  # já está processado
        return resultado

    except Exception as e:
        print(f"Erro ao extrair dados do PDF: {e}")
        return {}


# Teste
if __name__ == "__main__":
    pdf_teste = "relatorios/relatorio_de_mood_store_marco.pdf"
    dados_extraidos = extrair_dados_pdf(pdf_teste)
    print(dados_extraidos)