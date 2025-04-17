const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { readFileSync, readdirSync } = require('fs');
const path = require('path');

const pastaMensagens = './mensagens_analise';

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', ({ connection }) => {
        if (connection === 'open') {
            console.log('🤖 Bot IA conectado ao WhatsApp e aguardando mensagens...');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const texto = msg.message.conversation?.toLowerCase();
        if (!texto) return;

        const arquivos = readdirSync(pastaMensagens);
        const encontrado = arquivos.find(arq => texto.includes(arq.toLowerCase().replace('.txt', '').replace(/_/g, ' ')));

        if (encontrado) {
            const caminhoMensagem = path.join(pastaMensagens, encontrado);
            const conteudo = readFileSync(caminhoMensagem, 'utf-8');

            await sock.sendMessage(msg.key.remoteJid, { text: conteudo });
            console.log(`✅ Mensagem da IA enviada para: ${encontrado}`);
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: "❌ Desculpe, não encontrei essa conta. Tente com outro nome ou aguarde o próximo relatório." });
        }
    });
}

iniciarBot();