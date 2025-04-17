const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

const pastaRelatorios = path.join(__dirname, 'mensagens_analise');
const numeroAutorizado = process.env.NUMERO_AUTORIZADO;

// Configurar OpenAI
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

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

async function gerarRespostaIA(mensagem) {
  try {
    const resposta = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Você é a NAIA, assistente inteligente da agência Naros Web. Responda como se fosse uma pessoa, com simpatia e clareza.' },
        { role: 'user', content: mensagem }
      ]
    });
    return resposta.data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Erro ao gerar resposta com GPT:', error.message);
    return 'Desculpe, estou com dificuldades para responder no momento.';
  }
}

async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Conexão encerrada. Reconectar?', shouldReconnect);
      if (shouldReconnect) iniciarBot();
    } else if (connection === 'open') {
      console.log('✅ Bot do WhatsApp conectado com sucesso!');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) return;

      const texto = msg.message.conversation || msg.message.extendedTextMessage?.text;
      const contato = msg.key.remoteJid;
      const numero = contato.split('@')[0];

      console.log(`📩 Mensagem recebida de ${numero}:`, texto);

      if (numero === numeroAutorizado && texto) {
        const relatorio = buscarRelatorio(texto);

        if (relatorio) {
          const caminhoTxt = buscarAnalise(relatorio);
          if (caminhoTxt) {
            const textoAnalise = fs.readFileSync(caminhoTxt, 'utf8');
            await sock.sendMessage(contato, {
              text: `🧠 *Análise do Relatório:*

${textoAnalise}`
            });
          }
          await sock.sendMessage(contato, {
            document: fs.readFileSync(relatorio),
            fileName: path.basename(relatorio),
            mimetype: 'application/pdf',
            caption: '📊 Aqui está o relatório solicitado!'
          });
        } else {
          await sock.sendMessage(contato, {
            text: '❌ Desculpe, não encontrei essa conta. Tente com outro nome ou aguarde o próximo relatório.'
          });
        }
      } else {
        // IA responde normalmente a qualquer pessoa
        const resposta = await gerarRespostaIA(texto);
        await sock.sendMessage(contato, { text: resposta });
        console.log(`💬 Resposta da IA enviada para ${numero}`);
      }
    }
  });
}

iniciarBot();