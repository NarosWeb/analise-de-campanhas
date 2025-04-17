const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const P = require('pino');
const fs = require("fs");
const path = require("path");
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// IA Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function gerarRespostaGemini(pergunta) {
    try {
        const model = genAI.getGenerativeModel({ model: "models/gemini-pro" });
        const result = await model.generateContent(pergunta);
        const response = result.response;
        return response.text();
    } catch (err) {
        console.error("❌ Erro ao gerar resposta com Gemini:", err.message);
        return "Desculpe, estou com dificuldades para responder no momento.";
    }
}

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
            await sock.sendMessage('5516991645537@s.whatsapp.net', { text: '🤖 Bot conectado com sucesso!' });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error instanceof Boom
                ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                : true;

            console.log('❌ Conexão encerrada. Reconectar?', shouldReconnect);
            if (shouldReconnect) iniciarBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || !msg.message.conversation) return;

        const textoRecebido = msg.message.conversation;
        const contato = msg.key.remoteJid;

        const relatorio = buscarRelatorio(textoRecebido);

        if (relatorio) {
            const caminhoTxt = buscarAnalise(relatorio);
            if (caminhoTxt) {
                const textoAnalise = fs.readFileSync(caminhoTxt, "utf8");
                await sock.sendMessage(contato, {
                    text: `🧠 *Análise do Relatório:*\n\n${textoAnalise}`
                });
            }

            await sock.sendMessage(contato, {
                document: fs.readFileSync(relatorio),
                fileName: path.basename(relatorio),
                mimetype: 'application/pdf',
                caption: "📊 Aqui está o relatório solicitado!"
            });
        } else {
            // Resposta da IA
            const respostaIA = await gerarRespostaGemini(textoRecebido);
            await sock.sendMessage(contato, { text: respostaIA });
        }
    });
}

iniciarBot();