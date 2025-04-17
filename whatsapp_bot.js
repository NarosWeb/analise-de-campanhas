const makeWASocket = require('@whiskeysockets/baileys').default;
const {
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Inicializa a IA Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Função para gerar resposta da IA
async function gerarRespostaIA(mensagem) {
  try {
    const chat = model.startChat();
    const result = await chat.sendMessage(mensagem);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("❌ Erro ao gerar resposta com Gemini:", err.message);
    return "Desculpe, estou com dificuldades para responder no momento.";
  }
}

// Normaliza nomes para padronização de arquivos
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-]/g, "_");
}

// Inicia o bot
async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const motivo = lastDisconnect?.error?.output?.statusCode;
      console.log(`❌ Conexão encerrada. Reconectar?`, motivo !== DisconnectReason.loggedOut);
      if (motivo !== DisconnectReason.loggedOut) iniciarBot();
    } else if (connection === 'open') {
      console.log('✅ Bot do WhatsApp conectado com sucesso!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  // ✅ Número autorizado a receber relatórios
  const numeroAutorizado = "5516991645537@s.whatsapp.net";

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) return;

      const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const numero = msg.key.remoteJid;
      console.log(`📩 Mensagem recebida de ${numero}:`, texto);

      if (!texto) return;

      const nomeNormalizado = normalizarTexto(texto);
      const pasta = path.resolve(__dirname, "mensagens_analise");
      const caminhoPDF = path.join(pasta, `relatório_de_${nomeNormalizado}_marco.pdf`);
      const caminhoTXT = path.join(pasta, `relatório_de_${nomeNormalizado}_marco.txt`);

      const existePDF = fs.existsSync(caminhoPDF);
      const existeTXT = fs.existsSync(caminhoTXT);

      // Se for o número autorizado e houver relatório
      if (numero === numeroAutorizado && existePDF) {
        // Envia análise em texto, se existir
        if (existeTXT) {
          const textoAnalise = fs.readFileSync(caminhoTXT, "utf8");
          await sock.sendMessage(numero, {
            text: `🧠 *Análise do Relatório:*\n\n${textoAnalise}`,
          });
        }

        // Envia o PDF do relatório
        await sock.sendMessage(numero, {
          document: fs.readFileSync(caminhoPDF),
          fileName: path.basename(caminhoPDF),
          mimetype: "application/pdf",
          caption: "📊 Aqui está o relatório solicitado!",
        });

        console.log(`📤 Relatório e análise enviados para ${numero}`);
      } else {
        // Outros números recebem apenas a IA
        const resposta = await gerarRespostaIA(texto);
        await sock.sendMessage(numero, { text: resposta });
        console.log(`💬 Resposta da IA enviada para: ${texto}`);
      }
    }
  });
}

iniciarBot();