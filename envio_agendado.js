const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const P = require('pino');

const pasta = path.join(__dirname, 'mensagens_analise');
const numeroDestino = '5516991645537@s.whatsapp.net';

async function enviarRelatoriosAgendado() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: 'silent' })
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async ({ connection }) => {
    if (connection === 'open') {
      console.log('🤖 Conectado para envio agendado!');
      const arquivos = fs.readdirSync(pasta);

      for (const nome of arquivos) {
        if (nome.endsWith('.pdf')) {
          const caminhoPdf = path.join(pasta, nome);
          const nomeTxt = nome.replace('.pdf', '.txt');
          const caminhoTxt = path.join(pasta, nomeTxt);

          // Enviar texto de análise
          if (fs.existsSync(caminhoTxt)) {
            const texto = fs.readFileSync(caminhoTxt, 'utf8');
            await sock.sendMessage(numeroDestino, { text: `🧠 *Análise do Relatório:*\n\n${texto}` });
          }

          // Enviar PDF
          await sock.sendMessage(numeroDestino, {
            document: fs.readFileSync(caminhoPdf),
            fileName: nome,
            mimetype: 'application/pdf',
            caption: '📊 Aqui está o relatório agendado!'
          });

          console.log(`✅ Enviado: ${nome}`);
        }
      }

      process.exit(0);
    }
  });
}

enviarRelatoriosAgendado();