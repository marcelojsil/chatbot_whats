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

// -------------------------------------------
// WHATSAPP CLIENT
// -------------------------------------------
const client = new Client({
    authStrategy: new LocalAuth()
});

// QR → envia para React
client.on("qr", qr => {
    console.log("QR Code gerado!");
    io.emit("whatsapp_qr", qr);
    qrcode.generate(qr, { small: true });
});

// READY → envia confirmação para React
client.on("ready", () => {
    console.log("Tudo certo! WhatsApp conectado.");
    io.emit("whatsapp_ready");
});

// Inicia WhatsApp
client.initialize();

// -------------------------------------------
// SOCKET.IO
// -------------------------------------------
io.on("connection", (socket) => {
    console.log("Painel conectado!");

    socket.on("gerar_qr", () => {
        console.log("Painel pediu novo QR...");
        client.initialize(); // força gerar novamente
    });
});

// -------------------------------------------
// SERVIDOR HTTP (OBRIGATÓRIO)
// -------------------------------------------
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});
