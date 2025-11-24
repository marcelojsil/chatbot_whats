// -------------------------------------------
// IMPORTS E CONFIGURAÇÕES INICIAIS
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


// -------------------------------------------
// FUNÇÃO PARA CRIAR NOVA INSTÂNCIA DO CLIENT
// -------------------------------------------
let client;

function iniciarWhatsapp() {

    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    // QR Code
    client.on("qr", qr => {
        console.log("\n🔵 QR Code gerado!");
        io.emit("whatsapp_qr", qr);
        qrcode.generate(qr, { small: true });
    });

    // Ready
    client.on("ready", () => {
        console.log("\n🟢 WhatsApp conectado!");
        io.emit("whatsapp_ready");
    });

    // Mensagens automáticas
    configurarFunil(client);

    client.initialize();
}


// -------------------------------------------
// FUNIL / MENSAGENS AUTOMATIZADAS
// -------------------------------------------
function configurarFunil(client) {

    const delay = ms => new Promise(res => setTimeout(res, ms));

    client.on('message', async msg => {

        // 1 — Saudação / Menu
        if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && msg.from.endsWith('@c.us')) {

            const chat = await msg.getChat();
            const contact = await msg.getContact();
            const name = contact.pushname.split(" ")[0];

            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);

            await client.sendMessage(msg.from,
                `Olá! ${name}. Sou o assistente virtual da Marthec.\n\nEscolha uma opção:\n\n1 - Como funciona?\n2 - Valores dos planos\n3 - Quero um orçamento\n4 - Como aderir?\n5 - Falar com atendente`
            );
        }

        // Resposta 1
        if (msg.body === '1') {

            const chat = await msg.getChat();

            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);

            await client.sendMessage(msg.from,
                'Nosso serviço oferece consultas médicas 24h por dia...'
            );

            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);

            await client.sendMessage(msg.from,
                'COMO FUNCIONA?\n1º Passo...\n2º Passo...'
            );

            await delay(3000);
            await client.sendMessage(msg.from,
                'Link para cadastro: https://www.marthec.com.br'
            );
        }

        // Resposta 2
        if (msg.body === '2') {

            const chat = await msg.getChat();

            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);

            await client.sendMessage(msg.from,
                '*Plano Individual:* R$22,50...'
            );

            await delay(3000);
            await client.sendMessage(msg.from, 'https://www.marthec.com.br');
        }

        // Resposta 3
        if (msg.body === '3') {
            const chat = await msg.getChat();
            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(msg.from, 'Sorteio de prêmios...');
            await delay(3000);
            await client.sendMessage(msg.from, 'https://www.marthec.com.br');
        }

        // Resposta 4
        if (msg.body === '4') {
            const chat = await msg.getChat();
            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(msg.from, 'Você pode aderir...');
            await delay(3000);
            await client.sendMessage(msg.from, 'https://www.marthec.com.br');
        }

        // Resposta 5
        if (msg.body === '5') {
            const chat = await msg.getChat();
            await delay(3000);
            await chat.sendStateTyping();
            await delay(3000);
            await client.sendMessage(msg.from, 'Fale com atendente...');
        }
    });
}


// -------------------------------------------
// INICIA O CLIENTE UMA VEZ AO SUBIR O SERVIDOR
// -------------------------------------------
iniciarWhatsapp();


// -------------------------------------------
// SOCKET.IO – BOTÃO "GERAR NOVO QR"
// -------------------------------------------
io.on("connection", (socket) => {
    console.log("🖥️ Painel administrativo conectado!");

    socket.on("gerar_qr", async () => {
        console.log("🔄 Painel pediu novo QR Code...");

        try {
            await client.destroy();   // encerra sessão atual
        } catch (e) {}

        iniciarWhatsapp(); // cria um novo client e gera novo QR
    });
});


// -------------------------------------------
// SERVIDOR HTTP DO RENDER
// -------------------------------------------
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log("🚀 Servidor rodando na porta " + PORT);
});

