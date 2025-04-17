const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const pastaRelatorios = path.join(__dirname, "mensagens_analise");

function normalizarTexto(texto) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\-]/g, "_");
}

function buscarRelatorio(nomeCliente) {
  const nomeNormalizado = normalizarTexto(nomeCliente);
  const arquivos = fs.readdirSync(pastaRelatorios);
  for (const arquivo of arquivos) {
    const nomeArquivo = normalizarTexto(arquivo);
    if (nomeArquivo.includes(nomeNormalizado) && nomeArquivo.endsWith(".pdf")) {
      return path.join(pastaRelatorios, arquivo);
    }
  }
  return null;
}

function buscarAnalise(relatorioPath) {
  const nomeTxt = path.basename(relatorioPath).replace(/\.pdf$/, ".txt");
  const caminhoTxt = path.join(pastaRelatorios, nomeTxt);
  return fs.existsSync(caminhoTxt) ? caminhoTxt : null;
}

async function responderComIA(texto) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Você é um assistente inteligente que responde mensagens de WhatsApp de forma educada e útil." },
        { role: "user", content: texto }
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ Erro ao gerar resposta com IA:", err.message);
    return "⚠️ Desculpe, estou com dificuldades para responder no momento.";
  }
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('✅ Bot do WhatsApp conectado com sucesso!');
      await sock.sendMessage('5516991645537@s.whatsapp.net', { text: '🤖 Bot com IA ativado!' });
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error instanceof Boom
        ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
        : true;

      console.log('❌ Conexão encerrada. Reconectar?', shouldReconnect);
      if (shouldReconnect) {
        iniciarBot();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || !msg.message.conversation) return;

    const textoRecebido = msg.message.conversation;
    const contato = msg.key.remoteJid;

    const relatorioPdf = buscarRelatorio(textoRecebido);
    const relatorioTxt = relatorioPdf?.replace('.pdf', '.txt');

    if (relatorioPdf && fs.existsSync(relatorioTxt)) {
      const resumo = fs.readFileSync(relatorioTxt, 'utf-8');
      await sock.sendMessage(contato, {
        document: fs.readFileSync(relatorioPdf),
        fileName: path.basename(relatorioPdf),
        mimetype: 'application/pdf',
        caption: `📊 Aqui está o relatório solicitado!\n\n🧠 *Resumo da campanha:*\n${resumo}`
      });
      console.log(`✅ PDF e resumo enviados para ${textoRecebido}`);
    } else {
      const respostaIA = await responderComIA(textoRecebido);
      await sock.sendMessage(contato, { text: respostaIA });
      console.log(`💬 Resposta da IA enviada para: ${textoRecebido}`);
    }
  });
}

iniciarBot();