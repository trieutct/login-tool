require('dotenv').config();
const { default: axios } = require('axios');
const TOKEN_CHAT_BOT = process.env.TOKEN_CHATBOT;
const IDCHAT = process.env.ID_CHATBOT;

async function sendTelegramMessage(message, idChat = IDCHAT, parseMode = 'HTML') {
    const url = `https://api.telegram.org/bot${TOKEN_CHAT_BOT}/sendMessage`;
    try {
        await axios.post(url, {
            chat_id: idChat,
            text: message,
            parse_mode: parseMode,
        });
    } catch (error) {
        console.error(`Error sending message to chat ${idChat}:`, error.message);
        if (error.response) {
            console.error('Telegram API error response:', error.response.data);
        }
    }
}

async function sendTelegramDocument(filePath, fileName, message, idChat = IDCHAT) {
    const url = `https://api.telegram.org/bot${TOKEN_CHAT_BOT}/sendDocument`;

    try {
        const formData = new FormData();
        formData.append('chat_id', idChat);
        formData.append('document', fs.createReadStream(filePath), {
            filename: fileName,
        });
        formData.append('caption', message); // Caption cho file, có thể chỉnh sửa

        await axios.post(url, formData, {
            headers: formData.getHeaders(), // FormData cần header này
        });
        return true;
    } catch (error) {
        console.error(`Error sending document to chat ${idChat}:`, error.message);
        if (error.response) {
            console.error('Telegram API error response:', error.response.data);
        }
        return false;
    }
}

module.exports = {
    sendTelegramMessage,
    sendTelegramDocument,
};
