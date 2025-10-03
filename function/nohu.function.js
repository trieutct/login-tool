const {
    getRandomNumber,
    sendNewData,
    headersCommon,
    getAccountsWeb,
    getProcessedAccounts,
    getProxies,
    tachChuoi,
    shuffleArray,
} = require('../common/helper');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const axios = require('axios');
const nohuController = require('../controller/nohu.controller');

async function nohuFuctionLogin(tool = 1, datatest = []) {
    try {
        const accounts = getAccountsWeb('nohu.txt', tool);
        const accountsProcessed = getProcessedAccounts('nohu.txt', tool);
        // Kiểm tra nếu accountsProcessed là mảng rỗng
        const accountsFiltered =
            accountsProcessed.length === 0
                ? shuffleArray(accounts) // Lấy toàn bộ dữ liệu accounts
                : shuffleArray(
                      accounts.filter((item) => !accountsProcessed.includes(item)),
                  );

        const proxies = getProxies();
        if (!accountsFiltered?.length || !proxies?.length) {
            return;
        }

        for (let i = 0; i < accountsFiltered.length; i++) {
            const account = accountsFiltered[i];
            const proxyString = proxies[Math.floor(Math.random() * proxies.length)];
            const { username, password } = tachChuoi(account);
            const token = await nohuController.login(
                username,
                password,
                proxyString,
                tool,
            );
            if (token) {
                while (true) {
                    const res = await getBankNohu(token, proxyString, datatest, tool);
                    if (!res) {
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.log(`Nohu-tool${tool} lỗi nohuFuctionLogin`);
    }
}

async function getBankNohu(tokentx, proxyString, datatest, tool = 1) {
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
                console.log(`Có bakItem Nohu-tool${tool} ${bankItem.bank_account_no}`);
                const dataCurrent = datatest.find(
                    (item) =>
                        item.account_no === bankItem.bank_account_no &&
                        item.account_name === bankItem.bank_account_name,
                );
                if (!dataCurrent) {
                    var messageNew = `Nohu-lg${tool}`;
                    console.log(`Nohu-tool${tool} có data mới`);
                    //gửi data vào tele khi có data mới
                    await sendNewData(
                        messageNew,
                        bankItem.bank_account_name,
                        bankItem.bank_code,
                        bankItem.bank_account_no,
                        bankItem.bank_name,
                        proxyString,
                        'nohu',
                    );
                    // await getbank({
                    //     code_bank: bankItem.bank_code,
                    //     account_name: bankItem.bank_account_name,
                    //     account_no: bankItem.bank_account_no,
                    //     branch_name: bankItem.bank_name,
                    //     type: 'nohu',
                    // }).save();
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
        console.log(`Nohu-tool${tool} lỗi getBankNohu`);
        return false;
    }
}

module.exports = { getBankNohu, nohuFuctionLogin };
