require('dotenv').config();
const { default: axios } = require('axios');
const { spawn } = require('child_process');
const cron = require('node-cron');

let child = null;
let restarting = false;

async function sendAlertTelegramMessage(message) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN_ALERT;
  const TELEGRAM_CHAT_ID = process.env.ID_CHATBOT_LEODEVTCT;

  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('⚠️ Thiếu TELEGRAM_TOKEN_ALERT hoặc ID_CHATBOT_LEODEVTCT trong .env');
    return;
  }

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    });
    console.log('✅ Gửi tin nhắn Telegram thành công!');
  } catch (error) {
    console.error('❌ Lỗi gửi tin:', error.response?.data || error.message);
  }
}

function startApp() {
  if (restarting) return;
  restarting = true;

  // Kill process cũ nếu còn
  if (child) {
    try {
      child.kill('SIGTERM');
    } catch (_) { }
    child = null;
  }

  console.log('🚀 Khởi động lại tool.js...');
  child = spawn('node', ['tool_hit.js'], { stdio: 'inherit' });
  sendAlertTelegramMessage('🚀 Khởi động lại Tool Login HIT...');

  child.on('exit', (code, signal) => {
    restarting = false;

    if (signal === 'SIGTERM') return;

    if (code === 0) {
      console.log('✅ tool.js thoát bình thường.');
    } else {
      console.error(`❌ tool.js lỗi code: ${code}, sẽ khởi động lại sau 5s...`);
      sendAlertTelegramMessage(`⚠️ tool.js bị dừng bất thường (exit code ${code}). Tự khởi động lại sau 5s.`);
      setTimeout(startApp, 5000);
    }
  });

  child.on('error', (err) => {
    restarting = false;
    console.error('❌ Lỗi tiến trình con:', err);
    sendAlertTelegramMessage(`❌ Tool.js lỗi: ${err?.message || JSON.stringify(err)}`);
    setTimeout(startApp, 5000);
  });
}

// Cron restart định kỳ mỗi 2 tiếng
cron.schedule('0 */2 * * *', () => {
  console.log('⏰ Cron: Restart tool.js sau 2h...');
  startApp();
});

// Khởi động ngay
startApp();

// ✅ Chặn crash của script chính
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception:', err);
  sendAlertTelegramMessage(`⚠️ Manager crash: ${err.message}`);
  setTimeout(startApp, 5000);
});

process.on('unhandledRejection', (reason) => {
  console.error('⚠️ Unhandled Rejection:', reason);
  sendAlertTelegramMessage(`⚠️ Manager rejection: ${reason}`);
  setTimeout(startApp, 5000);
});
