require('dotenv').config();
require('./node-cron/index.js');
const IDCHAT = process.env.ID_CHATBOT;
const bot = require('./botTele/bot');
const connectDB = require('./config/connectMongoDB');
const {
    sleep,
    sendMessageRunDone,
    clearFile,
    getProxies,
    clearAccountProcessed,
    sendMessageTele,
    getDateTimeCurrent,
} = require('./common/helper');
const { sunWinFunction } = require('./function/sunwin.function');
const { gemWinFunction } = require('./function/gemwin.function');
const { getBankBet39Function } = require('./function/bet39.function');
const { b52FuctionLogin } = require('./function/b52.function');
const { rikFuctionLogin } = require('./function/rik.function.js');
const { iwinFuctionLogin } = require('./function/iwin.function.js');
const { nohuFuctionLogin } = require('./function/nohu.function.js');
const getbank = require('./model/getbank.js');
const { hitFunctionLogin } = require('./function/hit.function.js');

async function connectWithRetry(maxRetries = 5, delay = 3000) {
    let connected = false;
    let retryCount = 0;

    while (!connected && retryCount < maxRetries) {
        try {
            await connectDB();
            connected = true;
            await sendMessageTele('✅ Đã kết nối DB thành công', 1);
        } catch (err) {
            retryCount++;
            await sendMessageTele(
                `❌ Lỗi kết nối DB (lần ${retryCount}): ${err?.message || 'Lỗi kết nối DB'}`,
                1,
            );
            if (retryCount < maxRetries) {
                await sendMessageTele(
                    `🔄 Thử kết nối lại sau ${delay / 1000} giây...`,
                    1,
                );
                await new Promise((res) => setTimeout(res, delay));
            } else {
                await sendMessageTele(
                    '⛔ Không thể kết nối DB sau nhiều lần thử, dừng chương trình.',
                    1,
                );

                process.exit(1);
            }
        }
    }
}

async function runTask() {
    await connectWithRetry(5, 3000);

    const [proxyTinh, proxyXoay, banks] = await Promise.all([
        getProxies('proxy.txt', false),
        getProxies('proxy-rotating.txt', false),
        getbank.find(),
        clearAccountProcessed(),
    ]);
    console.log('Có dữ liệu trong cơ sở dữ liệu: ', banks.length);

    while (true) {
        try {
            await sendMessageTele('🟢 Start chạy app: ' + getDateTimeCurrent(), 1);

            await Promise.allSettled([
                b52FuctionLogin(banks, proxyXoay),
                rikFuctionLogin(banks, proxyXoay),
                nohuFuctionLogin(banks, proxyXoay),
                iwinFuctionLogin(banks, proxyXoay),
                hitFunctionLogin(banks, proxyXoay),
            ]);

            console.log('✅ Hoàn tất 1 vòng, nghỉ 1 phút trước khi chạy lại...');
            await sleep(60 * 1000); 

        } catch (error) {
            console.log(`❌ Error runTask: ${error?.message || 'runTask'}`);
            await sleep(5000); 
            continue;
        }
    }
}

async function bet39() {
    try {
        while (true) {
            clearFile('bet39.txt');
            await Promise.all([getBankBet39Function()]);
            console.log('------------------------------------------------------\n');
            await sendMessageRunDone('Bet39');
            await sleep(0.5 * 60 * 1000);
        }
    } catch (error) {
        console.log(`Error bet39: ${error?.message || 'bet39'}`);
    }
}
async function gemwin() {
    try {
        while (true) {
            clearFile('gemwin.txt');
            await Promise.all([gemWinFunction()]);
            console.log('------------------------------------------------------\n');
            await sendMessageRunDone('GemWin');
            await sleep(0.5 * 60 * 1000);
        }
    } catch (error) {
        console.log(`Error gemwin: ${error?.message || 'gemwin'}`);
    }
}

async function sunwin() {
    try {
        while (true) {
            clearFile('sunwin.txt');
            await Promise.all([sunWinFunction()]);
            console.log('------------------------------------------------------\n');
            await sendMessageRunDone('SunWin');
            await sleep(0.5 * 60 * 1000);
        }
    } catch (error) {
        console.log(`Error sunwin: ${error?.message || 'sunwin'}`);
    }
}

if (require.main === module) {
    try {
        setTimeout(() => {
            try {
                clearFile();
                runTask();
            } catch (taskError) {
                console.error('Lỗi khi chạy các công việc:', taskError);
                bot.sendMessage(IDCHAT, 'Tool runTask lỗi');
            }
        }, 5000);
    } catch (dbError) {
        console.error('Lỗi khi kết nối cơ sở dữ liệu:', dbError);
        bot.sendMessage(IDCHAT, 'Tool require.main === module lỗi');
    }
}
