const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const pastaRelatorios = path.join(__dirname, "relatorios");
const analisadosPath = path.join(__dirname, "relatorios_analisados.json");

let analisados = fs.existsSync(analisadosPath)
  ? JSON.parse(fs.readFileSync(analisadosPath, "utf8"))
  : [];

// 🔁 Função para monitorar a pasta a cada 1 minuto
setInterval(() => {
  const arquivos = fs.readdirSync(pastaRelatorios).filter(f => f.endsWith(".pdf"));

  arquivos.forEach(arquivo => {
    if (!analisados.includes(arquivo)) {
      console.log(`📥 Novo relatório detectado: ${arquivo}`);

      // Executa o script de conversão de PDF para JSON
      exec(`python extrair_para_json.py`, (err, stdout, stderr) => {
        if (err) {
          console.error("Erro ao converter para JSON:", err);
          return;
        }

        // Executa o script de análise
        exec(`python analisa_json.py`, (err2, stdout2, stderr2) => {
          if (err2) {
            console.error("Erro ao gerar análise:", err2);
            return;
          }

          console.log(`✅ Análise gerada para: ${arquivo}`);
          analisados.push(arquivo);
          fs.writeFileSync(analisadosPath, JSON.stringify(analisados, null, 2));
        });
      });
    }
  });
}, 60 * 1000); // Executa a cada 60 segundos