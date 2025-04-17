import fitz  # PyMuPDF
import json
import os

# Caminhos das pastas
pasta_pdf = "relatorios"
pasta_json = "json_convertidos"

# Cria a pasta de saída se não existir
os.makedirs(pasta_json, exist_ok=True)

def extrair_texto(pdf_path):
    texto_completo = ""
    with fitz.open(pdf_path) as doc:
        for pagina in doc:
            texto_completo += pagina.get_text()
    return texto_completo

def salvar_json(nome_arquivo, conteudo):
    nome_json = os.path.splitext(nome_arquivo)[0] + ".json"
    caminho_json = os.path.join(pasta_json, nome_json)
    with open(caminho_json, "w", encoding="utf-8") as f:
        json.dump({"conteudo": conteudo}, f, ensure_ascii=False, indent=2)

# Percorre todos os arquivos PDF da pasta
for arquivo in os.listdir(pasta_pdf):
    if arquivo.lower().endswith(".pdf"):
        caminho_pdf = os.path.join(pasta_pdf, arquivo)
        texto = extrair_texto(caminho_pdf)
        salvar_json(arquivo, texto)
        print(f"✅ Convertido: {arquivo}")