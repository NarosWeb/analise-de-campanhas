const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Função para gerar resumo com base no conteúdo do PDF
async function gerarResumoPDF(nomeArquivo) {
  const caminho = path.join(__dirname, 'mensagens_analise', nomeArquivo);

  if (!fs.existsSync(caminho)) {
    return "❌ Arquivo não encontrado para análise.";
  }

  const buffer = fs.readFileSync(caminho);
  const data = await pdfParse(buffer);
  const texto = data.text;

  // Aqui entra a lógica de inteligência (pode ser substituída por IA real depois)
  const insights = [];

  if (texto.includes("ROAS")) {
    const matchROAS = texto.match(/ROAS.*?(\d+(\.\d+)?)/);
    if (matchROAS) {
      insights.push(`📈 O ROAS foi de ${matchROAS[1]}, indicando boa rentabilidade.`);
    }
  }

  if (texto.includes("Valor investido")) {
    const matchInvestido = texto.match(/Valor investido\s+R\$([\d.,]+)/);
    if (matchInvestido) {
      insights.push(`💸 O investimento foi de R$${matchInvestido[1]}.`);
    }
  }

  if (texto.includes("Compras")) {
    const matchCompras = texto.match(/Compras\s+(\d+)/);
    if (matchCompras) {
      insights.push(`🛍️ Foram realizadas ${matchCompras[1]} compras.`);
    }
  }

  if (insights.length === 0) {
    return "📄 O relatório foi lido com sucesso, mas não foram encontrados dados para análise automática.";
  }

  return `🤖 Resumo do relatório:\n\n${insights.join('\n')}`;
}

module.exports = gerarResumoPDF;