const {
    getRandomNumber,
    sendNewData,
    headersCommon,
    getAccountsWeb,
    getProcessedAccounts,
    tachChuoi,
    shuffleArray,
    sleep,
} = require('../common/helper');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const axios = require('axios');
const nohuController = require('../controller/nohu.controller');

async function nohuFuctionLogin(datatest = [], proxies = []) {

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
            const token = await nohuController.login(
                username,
                password,
                proxyString,
            );
            if (token) {
                while (true) {
                    const res = await getBankNohu(token, proxyString, datatest, index);
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
            const accounts = getAccountsWeb('nohu.txt');
            const accountsProcessed = getProcessedAccounts('nohu.txt');
            if (!proxies?.length) {
                continue;
            }
            
            const accountsChunks = chunkArray(accounts, accounts?.length / 30);
            const runPromises = accountsChunks.map((accountsChunk, index) =>
                runGetBank(
                    getAccountsProcessed(accountsChunk, accountsProcessed),
                    proxies,
                    index + 1,
                ),
            );
            await Promise.allSettled(runPromises);
        } catch (error) {
            console.log(`Nohu lỗi nohuFuctionLogin: ${error?.message || error?.response?.data?.message || error}`);
            continue;
        }
        await sleep(1000);
    }
}

async function getBankNohu(tokentx, proxyString, datatest, index) {
    try {
        const { data } = await axios.post(
            `https://getquaizpmint.jeckatis.com/payment/np?xtoken=${tokentx}`,
            {
                amount: 100000 * getRandomNumber(1, 1000),
            },
            {
                headers: {
                    ...headersCommon,
                    'X-Token': `${tokentx}`,
                },
                httpsAgent: new HttpsProxyAgent(proxyString),
            },
        );
        if (data?.success === true && data?.code === 200) {
            const { rows: bankItem } = data;
            if (bankItem) {
                console.log(`Có bakItem Nohu-index${index}: ${bankItem.bank_name} ${bankItem.bank_account_no}`);
                const dataCurrent = datatest.find(
                    (item) =>
                        item.account_no === bankItem.bank_account_no &&
                        item.account_name === bankItem.bank_account_name,
                );
                if (!dataCurrent) {
                    var messageNew = `Nohu-LG`;
                    console.log(`Nohu-index${index} có data mới`);
                    await sendNewData(
                        messageNew,
                        bankItem.bank_account_name,
                        bankItem.bank_code,
                        bankItem.bank_account_no,
                        bankItem.bank_name,
                        proxyString,
                        'nohu',
                    );
                }
            } else {
                console.log('Nohu không có bankItem');
                return false;
            }
        } else {
            return false;
        }
        return true;
    } catch (error) {
        console.log(`Nohu-index${index} lỗi getBankNohu`);
        return false;
    }
}

module.exports = { getBankNohu, nohuFuctionLogin };
