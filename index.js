const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

// Caminho da pasta de relatórios
const pastaRelatorios = path.join(__dirname, 'relatorios');

async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log('✅ Bot conectado com sucesso!');
            enviarTodosRelatorios();
        } else if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('❌ Conexão encerrada. Reconectar?', shouldReconnect);
            if (shouldReconnect) iniciarBot();
        }
    });

    sock.ev.on('creds.update', saveCreds);

    async function enviarTodosRelatorios() {
        const arquivos = fs.readdirSync(pastaRelatorios).filter(file => file.endsWith('.pdf'));

        for (const arquivo of arquivos) {
            const caminhoCompleto = path.join(pastaRelatorios, arquivo);
            const nomeCliente = arquivo.replace('relatório_de_', '').replace('.pdf', '').replace(/_/g, ' ');

            const legenda = `📊 Relatório disponível!\n\nCliente: *${nomeCliente}*`;

            const buffer = fs.readFileSync(caminhoCompleto);

            await sock.sendMessage('5516991645537@s.whatsapp.net', {
                document: buffer,
                fileName: arquivo,
                mimetype: 'application/pdf',
                caption: legenda
            });

            console.log(`📨 Relatório de ${nomeCliente} enviado!`);
        }
    }
}

iniciarBot();