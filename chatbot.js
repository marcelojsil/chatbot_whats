// -------------------------------------------
// IMPORTS
// -------------------------------------------
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
    cors: {
        origin: "https://marthec.com.br",
        methods: ["GET", "POST"]
    }
});

const qrcode = require("qrcode-terminal");
const { Client, Buttons, List, MessageMedia, LocalAuth } = require("whatsapp-web.js");

// Chromium path do Railway
const chromiumPath = process.env.CHROMIUM_PATH || null;

let client;


// -------------------------------------------
// KEEP ALIVE PARA RAILWAY
// -------------------------------------------
function ativarKeepAlive() {
    setInterval(() => {
        console.log("🔄 Heartbeat ativo — Railway ok");
    }, 30000);
}


// -------------------------------------------
// FUNÇÃO DE RECONEXÃO
// -------------------------------------------
async function reconectar(forceQR = false) {
    console.log("♻ Reiniciando sessão do WhatsApp...");

    try {
        if (client) await client.destroy();
    } catch {}

    iniciarWhatsapp();

    if (forceQR) console.log("📸 Aguardando novo QR Code...");
}


// -------------------------------------------
// INICIAR INSTÂNCIA DO CLIENT
// -------------------------------------------
function iniciarWhatsapp() {

    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: './.wpp-session'
        }),

        puppeteer: {
            executablePath: chromiumPath,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--single-process'
            ]
        },

        restartOnAuthFail: true
    });

    ativarKeepAlive();

    client.on("qr", qr => {
        console.log("\n🔵 QR Code gerado!");
        io.emit("whatsapp_qr", qr);
        qrcode.generate(qr, { small: true });
    });

    client.on("ready", () => {
        console.log("\n🟢 WhatsApp conectado!");
        io.emit("whatsapp_ready");
    });

    client.on("disconnected", reason => {
        console.log("🔴 WhatsApp desconectado:", reason);
        reconectar(true);
    });

    client.on("remote_session_invalidated", () => {
        console.log("❌ Sessão inválida, pedindo novo QR...");
        reconectar(true);
    });

    configurarFunil(client);

    client.initialize();
}


// -------------------------------------------
// FUNIL DE RESPOSTAS
// -------------------------------------------
function configurarFunil(client) {

    const delay = ms => new Promise(res => setTimeout(res, ms));

    client.on('message', async msg => {

        if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && msg.from.endsWith('@c.us')) {

            const chat = await msg.getChat();
            const contact = await msg.getContact();
            const name = contact.pushname?.split(" ")[0] || "";

            await delay(2000);
            await chat.sendStateTyping();
            await delay(2000);

            await client.sendMessage(msg.from,
                `Olá ${name}! Sou o assistente virtual da Marthec.\n\nEscolha uma opção:\n\n1 - Como funciona?\n2 - Valores\n3 - Orçamento\n4 - Como aderir?\n5 - Atendente`
            );
        }

        if (msg.body === '1') {
            const chat = await msg.getChat();
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(msg.from,
                'Nós desenvolvemos seu site e você só paga após aprovar ele.'
            );
        }

        if (msg.body === '2') {
            const chat = await msg.getChat();
            await chat.sendStateTyping();
            await delay(2000);
            await client.sendMessage(msg.from,
                '*Planos:* R$22,50 / R$39,50 / R$49,50'
            );
        }

        if (msg.body === '3') {
            await client.sendMessage(msg.from, 'Nosso orçamento: https://www.marthec.com.br');
        }

        if (msg.body === '4') {
            await client.sendMessage(msg.from, 'Para aderir acesse https://www.marthec.com.br');
        }

        if (msg.body === '5') {
            await client.sendMessage(msg.from, 'Encaminhando para atendente...');
        }

    });
}


// -------------------------------------------
// INICIA WHATSAPP NA SUBIDA
// -------------------------------------------
iniciarWhatsapp();


// -------------------------------------------
// SOCKET.IO PAINEL
// -------------------------------------------
io.on("connection", (socket) => {
    console.log("🖥️ Painel conectado!");

    socket.on("gerar_qr", async () => {
        console.log("🔄 Painel pediu novo QR");
        await resetarWhatsapp();
    });
});


// -------------------------------------------
// SERVIDOR HTTP
// -------------------------------------------
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log("🚀 Servidor rodando na porta " + PORT);
});


// -------------------------------------------
// RESETAR WHATSAPP
// -------------------------------------------
async function resetarWhatsapp() {

    console.log("♻ Reiniciando WhatsApp...");

    try {
        if (client) await client.destroy();
    } catch {}

    iniciarWhatsapp();
}
