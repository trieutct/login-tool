require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const TOKEN_CHAT_BOT2 = process.env.TOKEN_CHATBOT2;
const IDCHAT = process.env.ID_CHATBOT2;

const bot2 = new TelegramBot(TOKEN_CHAT_BOT2, { polling: true });
bot2.onText(/\/start/, (msg) => {
    bot.sendMessage(IDCHAT, 'Chào mừng bạn đến với bot của chúng tôi!');
});

module.exports = bot2;
