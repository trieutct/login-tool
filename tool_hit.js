require('dotenv').config();
require('./node-cron/index.js');
const connectDB = require('./config/connectMongoDB');
const {
    sleep,
    clearFile,
    getProxies,
    clearAccountProcessed,
    sendMessageTele,
    getDateTimeCurrent,
} = require('./common/helper');
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
            await sendMessageTele('🟢 Start chạy app HIT: ' + getDateTimeCurrent(), 1);
            await hitFunctionLogin(banks, proxyXoay);
            console.log('✅ Hoàn tất 1 vòng, nghỉ 1 phút trước khi chạy lại...');
            await sleep(5 * 1000);
        } catch (error) {
            console.log(`❌ Error runTask: ${error?.message || 'runTask'}`);
            await sleep(5000);
            continue;
        }
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
            }
        }, 5000);
    } catch (dbError) {
        console.error('Lỗi khi kết nối cơ sở dữ liệu:', dbError);
    }
}
