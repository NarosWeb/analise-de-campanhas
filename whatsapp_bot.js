const makeWASocket = require('@whiskeysockets/baileys').default;
const {
  useMultiFileAuthState,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

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

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\-]/g, "_");
}

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
      if (motivo !== DisconnectReason.loggedOut) {
        iniciarBot();
      }
    } else if (connection === 'open') {
      console.log('✅ Bot do WhatsApp conectado com sucesso!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  const numeroAutorizado = "5516991645537@s.whatsapp.net";

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) return;

      const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const numero = msg.key.remoteJid;
      console.log(`📩 Mensagem recebida de ${numero}:`, texto);

      if (!texto) return;

      const nomeRelatorio = normalizarTexto(texto);
      const caminho = path.resolve(__dirname, "mensagens_analise", `relatório_de_${nomeRelatorio}_marco.pdf`);
      const existeRelatorio = fs.existsSync(caminho);

      if (numero === numeroAutorizado && existeRelatorio) {
        await sock.sendMessage(numero, {
          document: fs.readFileSync(caminho),
          fileName: `relatório_de_${nomeRelatorio}_marco.pdf`,
          mimetype: 'application/pdf'
        });
        console.log(`📤 Relatório enviado para ${numero}`);
      } else {
        const resposta = await gerarRespostaIA(texto);
        await sock.sendMessage(numero, { text: resposta });
        console.log(`💬 Resposta da IA enviada para: ${texto}`);
      }
    }
  });
}

// ✅ Chamada no final do script
iniciarBot();