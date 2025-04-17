const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

const pastaMensagens = './mensagens_analise';
const numeroDestino = '5516991645537@s.whatsapp.net'; // Altere para o número desejado

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ Bot do WhatsApp conectado com sucesso!');
            enviarMensagens();
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Conexão encerrada. Reconectar?', shouldReconnect);
            if (shouldReconnect) {
                iniciarBot();
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    async function enviarMensagens() {
        fs.readdirSync(pastaMensagens).forEach(async (arquivo) => {
            if (arquivo.endsWith('.txt')) {
                const conteudo = fs.readFileSync(path.join(pastaMensagens, arquivo), 'utf-8');
                await sock.sendMessage(numeroDestino, { text: conteudo });
                console.log(`📨 Mensagem enviada: ${arquivo}`);
            }
        });
    }
}

iniciarBot();
