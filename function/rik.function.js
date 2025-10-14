const {
    getProxies,
    getRandomNumber,
    sendNewData,
    headersCommon,
    shuffleArray,
    getAccountsWeb,
    getProcessedAccounts,
    tachChuoi,
} = require('../common/helper');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const axios = require('axios');
const { sleep } = require('../common/helper');
require('colors');
const rikController = require('../controller/rik.controller');

async function rikFuctionLogin(datatest = [], proxies = []) {
    const chunkArray = (array, chunkSize) => {
        const result = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
        }
        return result;
    };

    const runGetBank = async (accounts, proxies, index = 0) => {
        for (let i = 0; i < accounts.length; i++) {
            const account = accounts[i];
            const proxyString = proxies[Math.floor(Math.random() * proxies.length)];
            const { username, password } = tachChuoi(account);
            const token = await rikController.login(username, password, proxyString);
            if (token) {
                while (true) {
                    const res = await getBankRik(token, proxyString, datatest, index);
                    if (!res) {
                        break;
                    }
                }
            }
        }
    };

    const getAccountsProcessed = (accounts = [], accountsProcessed = []) => {
        const data = !accountsProcessed?.length
            ? shuffleArray(accounts)
            : shuffleArray(accounts.filter((item) => !accountsProcessed.includes(item)));
        return data;
    };

    while (true) {
        try {
            const accounts = getAccountsWeb('rik.txt');
            const accountsProcessed = getProcessedAccounts('rik.txt');
            // const proxies = await getProxies('proxy-rotating.txt');
            if (!proxies?.length) {
                continue;
            }

            const accountsChunks = chunkArray(accounts, 50000);
            const runPromises = accountsChunks.map((accountsChunk, index) =>
                runGetBank(
                    getAccountsProcessed(accountsChunk, accountsProcessed),
                    proxies,
                    index + 1,
                ),
            );

            await Promise.allSettled(runPromises);
        } catch (error) {
            console.log(
                `Lỗi rikFuctionLogin: ${error?.message || error?.response?.data?.message || error}`,
            );
            continue;
        }

        await sleep(1000);
    }
}

const OFFICIAL_BANKS = ['BIDV', 'VPbank', 'Vietbank', 'VietinBank', 'VCB', 'Techcombank'];
const OTHER_BANKS = ['Eximbank', 'ACB', 'NamABank', 'MBbank', 'DongA', 'NCB'];

async function getBankRik(tokentx, proxyString, datatest, index) {
    let listStatus = [];
    try {
        const { data: status } = await axios.post(
            'https://baymentes.gwrykgems.net/payment/bnp?xtoken=' + tokentx,
            {
                headers: {
                    ...headersCommon,
                    'Content-Type': 'application/json',
                },
                httpsAgent: new HttpsProxyAgent(proxyString),
            },
        );
        if (status.code === 200) {
            listStatus = shuffleArray(
                status.rows
                    .filter(
                        (item) =>
                            item.bankcode !== undefined &&
                            (index % 2 === 0
                                ? OFFICIAL_BANKS.includes(item.bankcode)
                                : !OTHER_BANKS.includes(item.bankcode)),
                    )
                    .map((item) => item.bankcode),
            );
        }
        if (listStatus?.length > 0) {
            for (let i = 0; i < listStatus?.length; i++) {
                const { data } = await axios.post(
                    `https://baymentes.gwrykgems.net/payment/np?xtoken=${tokentx}`,
                    {
                        amount: 100000 * getRandomNumber(1, 1000),
                        bank_code: listStatus[i],
                    },
                    {
                        headers: {
                            ...headersCommon,
                            'Content-Type': 'application/json',
                        },
                        httpsAgent: new HttpsProxyAgent(proxyString),
                    },
                );
                if (
                    data.success === false &&
                    data.code === 400 &&
                    data.msg ===
                        'Không thể tạo mã lúc này, liên hệ LiveChat để được hỗ trợ'
                ) {
                    console.log('0000000000: ', data?.msg);
                    await sleep(300);
                    return false;
                }
                const bankItem = data.rows;
                if (bankItem) {
                    console.log(
                        `Có bakItem Rik-index${index}: ${bankItem.bank_code}-${bankItem.account_no}`
                            .blue,
                    );
                    // Kiểm tra nếu tài khoản đã xử lý
                    const dataCurrent = datatest.find(
                        (item) =>
                            item.account_no === bankItem.account_no &&
                            item.account_name === bankItem.account_name,
                    );
                    if (!dataCurrent) {
                        var messageNew = `Rik-LG`;
                        console.log(
                            `Rik-index${index} có data mới ${bankItem.account_no}`,
                        );
                        //gửi data vào tele khi có data mới
                        await sendNewData(
                            messageNew,
                            bankItem.account_name,
                            bankItem.bank_code,
                            bankItem.account_no,
                            bankItem.bank_name,
                            proxyString,
                            'rik',
                        );
                        // await getbank({
                        //     code_bank: bankItem.bank_code,
                        //     account_name: bankItem.account_name,
                        //     account_no: bankItem.account_no,
                        //     branch_name: bankItem.bank_name,
                        //     type: 'rik',
                        // }).save();
                    }
                } else {
                    await sleep(300);
                    console.log('Không có bakItem rik');
                    return false;
                }
                await sleep(100);
            }
            return true;
        } else {
            console.log('listStatus length Rik 0 co');
            return true;
        }
    } catch (error) {
        console.log(
            `Rik-index${index} lỗi getBankRik ${error?.message || error?.response?.data?.message || error}`,
        );
        return false;
    }
}

module.exports = { rikFuctionLogin, getBankRik };
