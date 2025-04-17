from fpdf import FPDF
import os

caminho_txt = "mensagens_analise"
caminho_pdfs = "pdfs_gerados"

os.makedirs(caminho_pdfs, exist_ok=True)

for arquivo in os.listdir(caminho_txt):
    if arquivo.endswith(".txt"):
        nome_pdf = arquivo.replace(".txt", ".pdf")
        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)
        pdf.set_font("Arial", size=12)

        with open(os.path.join(caminho_txt, arquivo), "r", encoding="utf-8") as f:
            for linha in f:
                pdf.multi_cell(0, 10, linha)

        pdf.output(os.path.join(caminho_pdfs, nome_pdf))
        print(f"✅ PDF gerado: {nome_pdf}")