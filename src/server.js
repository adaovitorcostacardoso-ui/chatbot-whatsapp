const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// Teste do servidor
app.get("/", (req, res) => {
  res.send("Chatbot WhatsApp funcionando!");
});

// Webhook do WhatsApp
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// Recebe mensagens do WhatsApp
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    if (
      data.object === "whatsapp_business_account" &&
      data.entry &&
      data.entry[0]?.changes?.[0]?.value?.messages
    ) {
      const message =
        data.entry[0].changes[0].value.messages[0];

      const phoneNumberId =
        data.entry[0].changes[0].value.metadata.phone_number_id;

      const from = message.from;

      if (message.type === "text") {
        const text = message.text.body;

        let resposta;

        if (text.toLowerCase().includes("oi")) {
          resposta = "Olá! 👋 Como posso ajudar você?";
        } else if (text.toLowerCase().includes("menu")) {
          resposta =
            "📋 Menu\n\n1️⃣ Informações\n2️⃣ Suporte\n3️⃣ Falar com atendente";
        } else {
          resposta =
            "Recebi sua mensagem! 🤖 Em breve posso responder usando IA.";
        }

        await axios.post(
          `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
          {
            messaging_product: "whatsapp",
            to: from,
            type: "text",
            text: {
              body: resposta
            }
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
              "Content-Type": "application/json"
            }
          }
        );
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});