require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');
const TOKEN_CHAT_BOT = process.env.TOKEN_CHATBOT;
const IDCHAT = process.env.ID_CHATBOT;

const bot = new TelegramBot(TOKEN_CHAT_BOT, { polling: true });
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(IDCHAT, 'Chào mừng bạn đến với bot của chúng tôi!');
});

module.exports = bot;
