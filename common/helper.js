const fs = require('fs');
const fsAwait = require('fs').promises;
const accountSchema = require('../model/account');
const path = require('path');
require('dotenv').config();
const bot = require('../botTele/bot');
const bot2 = require('../botTele/bot2');
const dayjs = require('dayjs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const ID_CHATBOT_LEODEVTCT = process.env.ID_CHATBOT_LEODEVTCT;
const IDCHAT = process.env.ID_CHATBOT;
const IDCHAT2 = process.env.ID_CHATBOT2;
const getbankSchema = require('../model/getbank');
let banksOfKien = [...new Set(getBanksOfKien())];

function generateRandomStringLength(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz1234567890';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    if (/^\d+$/.test(result)) {
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const randomLetter = letters.charAt(Math.floor(Math.random() * letters.length));
        const randomIndex = Math.floor(Math.random() * length);
        result =
            result.substring(0, randomIndex) +
            randomLetter +
            result.substring(randomIndex + 1);
    }
    return result;
}
function getCurrentDateString() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
    const year = String(now.getFullYear()).slice(-2); // Chỉ lấy 2 chữ số cuối của năm
    return `${day}${month}${year}`;
}

function generateRandomStringWithDate() {
    const length = Math.floor(Math.random() * 8) + 1;
    const randomString = generateRandomStringLength(length);
    const dateString = getCurrentDateString();
    return `${randomString}${dateString}`;
}
function generateRandomString() {
    const str = generateRandomStringWithDate();
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
}

async function getProxies(fileName = 'proxy.txt', isSendMessageTele = false) {
    /** Kiểm tra 1 proxy có hoạt động không */
    async function checkProxyActive(proxyUrl) {
        try {
            const agent = new HttpsProxyAgent(proxyUrl);
            const res = await axios.get('https://api.ipify.org?format=json', {
                httpAgent: agent,
                httpsAgent: agent,
                timeout: 10000, // 5 giây
            });
            if (res?.data?.ip) return true;
            return false;
        } catch {
            return false;
        }
    }

    const proxyFile = path.join(__dirname, `../${fileName}`);
    const proxies = fs
        .readFileSync(proxyFile, 'utf8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean)
        .map((proxyString) => {
            return convertProxyString(proxyString);
        });

    const chunkSize = proxies.length > 20 ? 100 : proxies.length;
    const badProxies = [];
    const goodProxies = [];

    for (let i = 0; i < proxies.length; i += chunkSize) {
        const slice = proxies.slice(i, i + chunkSize);

        const results = await Promise.allSettled(
            slice.map(async (proxy) => {
                const ok = await checkProxyActive(proxy);
                return { proxy, ok };
            }),
        );

        results.forEach((r) => {
            if (r.status === 'fulfilled') {
                if (r.value.ok) {
                    goodProxies.push(r.value.proxy);
                } else {
                    badProxies.push(revertProxyString(r.value.proxy));
                }
            } else {
                const failed = slice[results.indexOf(r)];
                badProxies.push(revertProxyString(failed));
            }
        });
    }

    if (badProxies?.length && isSendMessageTele) {
        const outPath = path.join(__dirname, `../bad-${fileName}`);
        if (fs.existsSync(outPath)) {
            const message = `Proxy ${fileName === 'proxy-rotating.txt' ? 'Xoay' : 'Tĩnh'} không connect được`;
            // Xóa toàn bộ nội dung cũ trước
            fs.writeFileSync(outPath, '', 'utf8');

            fs.writeFileSync(outPath, badProxies.join('\n'), 'utf8');
            await sendFileTxtData(outPath, message);
        }
    }

    if (fileName === 'proxy.txt' && goodProxies?.length === 0 && isSendMessageTele) {
        await sendMessageTele(
            `Proxy ${fileName === 'proxy-rotating.txt' ? 'Xoay' : 'Tĩnh'} không có proxy hoạt động`,
        );
    }
    return fileName === 'proxy.txt' ? shuffleArray(goodProxies) : shuffleArray(proxies);
}

async function sendFileTxtData(filePath, message) {
    const chatId = process.env.ID_CHATBOT_LEODEVTCT;
    if (fs.existsSync(filePath)) {
        await bot.sendDocument(
            chatId,
            filePath,
            {},
            {
                filename: `${message}.txt`,
                contentType: 'text/plain',
            },
        );
    }
}

function getProxiesUs() {
    const proxyFile = path.join(__dirname, '../proxy-shop2.txt');
    return fs
        .readFileSync(proxyFile, 'utf8')
        .replace(/\r/g, '')
        .split('\n')
        .filter(Boolean)
        .map((proxyString) => {
            return convertProxyString(proxyString);
        });
}

function convertProxyString(proxyString) {
    const [ip, port, username, password] = proxyString.split(':');
    return `http://${username}:${password}@${ip}:${port}`;
}

function revertProxyString(proxyUrl) {
    const clean = proxyUrl.replace(/^https?:\/\//, '');
    const [auth, host] = clean.split('@');
    const [username, password] = auth.split(':');
    const [ip, port] = host.split(':');
    return `${ip}:${port}:${username}:${password}`;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChar() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    return characters.charAt(Math.floor(Math.random() * characters.length));
}

function getDateTimeCurrent() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    return now.toLocaleString('vi-VN', options);
}

async function sendQuantityRegisterSuccess(quantity = 0, typeWeb = 'Hit') {
    const datetime = getDateTimeCurrent();
    var message = `${datetime}\n${typeWeb}: ${quantity} tài khoản success`;

    message = getMessageByElementHtml(quantity, message);

    await Promise.all([
        bot.sendMessage(ID_CHATBOT_LEODEVTCT, message, {
            parse_mode: 'HTML',
        }),
    ]);
}

async function sendMessageDeleteAcounts(quantity = 0, typeWeb = 'Hit') {
    const datetime = getDateTimeCurrent();
    var message = `${datetime}\nĐã xóa ${quantity} tài khoản ${typeWeb} ${typeWeb}`;
    message = getMessageByElementHtml(-1, message);

    await Promise.all([
        bot.sendMessage(ID_CHATBOT_LEODEVTCT, message, {
            parse_mode: 'HTML',
        }),
    ]);
}

async function sendMessageRunDone(typeWeb = 'Hit') {
    const datetime = getDateTimeCurrent();
    var message = `${datetime}\n${typeWeb}: chạy xonggggggggg`;
    message = getMessageByElementHtml(-1, message);

    await Promise.all([
        bot.sendMessage(ID_CHATBOT_LEODEVTCT, message, {
            parse_mode: 'HTML',
        }),
    ]);
}

async function sendNewData(
    title = '',
    bankaccountname = '',
    bankcode = '',
    bankaccountno = 0,
    bankname = '',
    proxyString = '',
    typeWeb = 'b52',
) {
    // check xem nếu mà account no đó không có trong file banks_of_kien.txt thì gọi lại data ở file đó
    if (banksOfKien?.length && !banksOfKien?.includes(bankaccountno)) {
        banksOfKien = [...new Set(getBanksOfKien())];
    }

    // sau gọi gọi lại lấy data mới thì check xem số đó đã có trong file banks_of_kien.txt chưa
    if (banksOfKien?.length && banksOfKien?.includes(bankaccountno)) {
        // nếu có rồi thì dừng
        return;
    }

    // nếu không có thì ghi vào file banks_of_kien.txt
    writeDataToFileBanksOfKien(bankaccountno);

    var messageNew = `--------${title}---------\n`;

    bankaccountno = `${convertTypeCopyNumber(bankaccountno)}`;

    // const message = `Chủ TK: ${bankaccountname}\nNgân hàng: ${bankcode}\nSố tài khoản: ${bankaccountno}\nChi nhánh: ${bankname}\nProxy: ${proxyString}\n--------------------------------------\n`;
    const message = `Chủ TK: ${bankaccountname}\nNgân hàng: ${bankcode}\nSố tài khoản: ${bankaccountno}\nChi nhánh: ${bankname}\n--------------------------------------\n`;
    messageNew += message;

    const isWebHit = title.toLowerCase().includes('hit');
    var messageNew2 = messageNew;
    if (isWebHit) {
        const titles = ['Rik', 'Iwin', 'Nohu', 'Sunwin'];
        messageNew2 = `--------${
            titles[Math.floor(Math.random() * titles.length)]
        }---------\n`;
        messageNew2 += message;
    }

    await Promise.all([
        bot2.sendMessage(IDCHAT2, messageNew2, { parse_mode: 'HTML' }), // bot phụ
        bot.sendMessage(IDCHAT, messageNew, { parse_mode: 'HTML' }),
    ]);

    await saveNewDataToMongodb(
        bankcode,
        bankaccountname,
        bankaccountno,
        bankname,
        typeWeb,
    );

    banksOfKien.push(bankaccountno);
}

async function saveNewDataToMongodb(
    code_bank,
    account_name,
    account_no,
    branch_name,
    type = 'b52',
) {
    await getbankSchema({
        code_bank: code_bank,
        account_name: account_name,
        account_no: account_no,
        branch_name: branch_name,
        type: type,
    }).save();
}

function getMessageByElementHtml(quantity = 0, message = 'message') {
    switch (true) {
        case quantity === 0:
            return message;
        case quantity > 0:
            return `<b>${message}</b>`;
        default:
            return `<i>${message}</i>`;
    }
}

function convertTypeCopyNumber(number = 0) {
    return `<code>${number}</code>`;
}

async function deleteAccountsBeforeYesterday() {
    const yesterdayStart = dayjs().subtract(1, 'day').startOf('day').toDate();

    const result = await accountSchema.deleteMany({
        createdAt: {
            $lt: yesterdayStart,
        },
    });

    var messageNew = `Xóa thành công ${result.deletedCount} tài khoản trước ngày hôm qua`;

    await Promise.all([
        bot2.sendMessage(ID_CHATBOT_LEODEVTCT, getMessageByElementHtml(-1, messageNew), {
            parse_mode: 'HTML',
        }),
    ]);
}

async function sendMessageTele(message, option = -1) {
    const messageNew = getMessageByElementHtml(option, message);
    await Promise.all([
        bot.sendMessage(ID_CHATBOT_LEODEVTCT, messageNew, {
            parse_mode: 'HTML',
        }),
    ]);
}

const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
];

const headersCommon = {
    accept: 'application/json, text/plain, */*',
    'content-type': 'application/json',
    'user-agent': userAgents[Math.floor(Math.random() * userAgents.length)],
};

function shuffleArray(array) {
    if (!Array.isArray(array)) {
        return 'Vui lòng truyền vào một mảng';
    }

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}

const excludedBanks = ['MB', 'ACB', 'NAB', 'OCB'];

function appendToFile(data, fileName = 'processed-accounts.txt') {
    const processedAccountsFile = path.join(__dirname, `../data/${fileName}`);
    fs.appendFileSync(processedAccountsFile, data + '\n', 'utf8');
}

function clearFile(fileName = 'processed-accounts.txt') {
    const processedAccountsFile = path.join(__dirname, `../data/${fileName}`);
    fs.writeFileSync(processedAccountsFile, '', 'utf8');
}

function getAccountsWeb(fileName = 'b52.txt') {
    try {
        const accountsWebFile = path.join(__dirname, `../data/account/${fileName}`);
        return fs
            .readFileSync(accountsWebFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);
    } catch (error) {
        console.log(error);
        return [];
    }
}

// hàm này xử lý lấy data ở foler data-processed
function getProcessedAccounts(fileName = 'b52.txt') {
    try {
        const accountsWebFile = path.join(
            __dirname,
            `../data-processed/account/${fileName}`,
        );
        return fs
            .readFileSync(accountsWebFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);
    } catch (error) {
        console.log(error);
        return [];
    }
}

// hàm xử lý tài khoản đã login trong ngày
async function writeAccountProcessed(data, fileName = 'processed-accounts.txt') {
    const processedAccountsFile = path.join(
        __dirname,
        `../data-processed/account/${fileName}`,
    );
    await fsAwait.appendFile(processedAccountsFile, data + '\n', 'utf8');
}

// hàm clear tất cả data đã xử lý trong ngày. Dùng cron job clear data các web ở vào lúc 23h55 hàng ngày
async function clearAccountProcessed() {
    const accountsProcessed = getProcessedAccounts('b52.txt');
    const accountsProcessedHit = getProcessedAccounts('hit.txt');
    await sleep(5000);

    const web = ['b52.txt', 'hit.txt', 'iwin.txt', 'nohu.txt', 'rik.txt', 'tip.txt'];
    const urlWebs = web.map((item) =>
        path.join(__dirname, `../data-processed/account/${item}`),
    );

    await Promise.all(urlWebs.map((item) => fs.writeFileSync(item, '', 'utf8')));

    sendMessageTele(
        `Đã xóa tất cả data đã xử lý trong ngày: ${accountsProcessed?.length || 0} và hit: ${accountsProcessedHit?.length || 0}`,
    );
}

function tachChuoi(input, separator = '|') {
    if (!input.includes(separator)) {
        throw new Error(`Chuỗi không chứa ký tự phân tách "${separator}"`);
    }

    const [username, password] = input.split(separator);
    return { username, password };
}

function getBanksOfKien(url = 'C:/Users/Public/banks_of_kien.txt') {
    return fs.readFileSync(url, 'utf8').replace(/\r/g, '').split('\n').filter(Boolean);
}

async function writeDataToFileBanksOfKien(
    data,
    url = 'C:/Users/Public/banks_of_kien.txt',
) {
    await fsAwait.appendFile(url, data + '\n', 'utf8');
}

module.exports = {
    generateRandomString,
    getProxies,
    convertProxyString,
    sleep,
    getRandomNumber,
    getProxiesUs,
    randomChar,
    getDateTimeCurrent,
    sendQuantityRegisterSuccess,
    sendNewData,
    sendMessageDeleteAcounts,
    sendMessageRunDone,
    deleteAccountsBeforeYesterday,
    sendMessageTele,
    headersCommon,
    shuffleArray,
    excludedBanks,
    appendToFile,
    clearFile,
    getProcessedAccounts,
    userAgents,
    getAccountsWeb,
    tachChuoi,
    getBanksOfKien,
    writeDataToFileBanksOfKien,
    clearAccountProcessed,
    writeAccountProcessed,
};
