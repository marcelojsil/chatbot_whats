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
// WHATSAPP CLIENT
// -------------------------------------------
const client = new Client({
    authStrategy: new LocalAuth()
});

// QR → Envia para painel + terminal
client.on("qr", qr => {
    console.log("\n🔵 QR Code gerado!");
    io.emit("whatsapp_qr", qr);
    qrcode.generate(qr, { small: true });
});

// READY → Notifica painel
client.on("ready", () => {
    console.log("\n🟢 WhatsApp conectado!");
    io.emit("whatsapp_ready");
});

// INICIA O WHATSAPP
client.initialize();


// -------------------------------------------
// DELAY PARA MENSAGENS AUTOMATIZADAS
// -------------------------------------------
const delay = ms => new Promise(res => setTimeout(res, ms));


// -------------------------------------------
// MENSAGENS AUTOMATIZADAS (SEU FUNIL)
// -------------------------------------------
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

    // 2 — Resposta 1
    if (msg.body === '1') {

        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);

        await client.sendMessage(msg.from,
            'Nosso serviço oferece consultas médicas 24h por dia, 7 dias por semana, pelo WhatsApp. Não há carência...'
        );

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);

        await client.sendMessage(msg.from,
            'COMO FUNCIONA?\n1º Passo: Faça seu cadastro...\n2º Passo: Após o pagamento, acesso imediato...'
        );

        await delay(3000);
        await client.sendMessage(msg.from,
            'Link para cadastro: https://www.marthec.com.br'
        );
    }

    // 3 — Resposta 2
    if (msg.body === '2') {

        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);

        await client.sendMessage(msg.from,
            '*Plano Individual:* R$22,50/mês\n*Plano Família:* R$39,90/mês\n*Plano TOP:* ...'
        );

        await delay(3000);
        await client.sendMessage(msg.from,
            'Link: https://www.marthec.com.br'
        );
    }

    // 4 — Resposta 3
    if (msg.body === '3') {

        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);

        await client.sendMessage(msg.from,
            'Sorteio de prêmios todo ano. Atendimento médico ilimitado 24h...'
        );

        await delay(3000);
        await client.sendMessage(msg.from,
            'https://www.marthec.com.br'
        );
    }

    // 5 — Resposta 4
    if (msg.body === '4') {

        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);

        await client.sendMessage(msg.from,
            'Você pode aderir aos nossos planos pelo site ou WhatsApp. Após a adesão...'
        );

        await delay(3000);
        await client.sendMessage(msg.from,
            'https://www.marthec.com.br'
        );
    }

    // 6 — Resposta 5
    if (msg.body === '5') {

        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);

        await client.sendMessage(msg.from,
            'Para falar com um atendente, responda aqui ou visite nosso site.'
        );
    }
});


// -------------------------------------------
// SOCKET.IO – BOTÃO DO PAINEL
// -------------------------------------------
io.on("connection", (socket) => {
    console.log("🖥️ Painel administrativo conectado!");

    socket.on("gerar_qr", () => {
        console.log("🔄 Painel pediu novo QR Code...");
        client.initialize();
    });
});


// -------------------------------------------
// SERVIDOR HTTP DO RENDER
// -------------------------------------------
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log("🚀 Servidor rodando na porta " + PORT);
});
