const {
    getAccountsWeb,
    getProxies,
    shuffleArray,
    tachChuoi,
    getRandomNumber,
    sendNewData,
    headersCommon,
    getProcessedAccounts,
    sleep,
} = require('../common/helper');
const b52Controller = require('../controller/b52.controller');
const axios = require('axios');
require('colors');
const { HttpsProxyAgent } = require('https-proxy-agent');

const OFFICIAL_BANKS = ['VPbank', 'VCB', 'Techcombank', 'BIDV', 'VietinBank', 'Vietbank'];

const OTHER_BANKS = ['MBbank', 'NamABank', 'ACB', 'DongA', 'Eximbank', 'NCB'];

async function b52FuctionLogin(datatest = [], proxies = []) {
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
            const token = await b52Controller.login(username, password, proxyString);
            if (token) {
                while (true) {
                    const res = await getBankB52(token, proxyString, datatest, index);
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
            const accounts = getAccountsWeb('b52.txt');
            const accountsProcessed = getProcessedAccounts('b52.txt');
            // const proxies = await getProxies();
            if (!proxies?.length) {
                continue;
            }

            const accountsChunks = chunkArray(accounts, 8000);
            const runPromises = accountsChunks.map((accountsChunk, index) =>
                runGetBank(
                    getAccountsProcessed(accountsChunk, accountsProcessed),
                    proxies,
                    index + 1,
                ),
            );

            await Promise.all(runPromises);
        } catch (error) {
            console.log(
                `Lỗi b52FuctionLogin: ${error?.message || error?.response?.data?.message || error}`,
            );
            continue;
        }
        await sleep(1000);
    }
}

async function getBankB52(tokentx, proxyString, datatest = [], index = 0) {
    let listStatus = [];
    try {
        const { data: status } = await axios.get(
            'https://bfivegwpeymint.gwtenkges.com/payment/np/status?xtoken=' + tokentx,
            {
                headers: {
                    ...headersCommon,
                },
                httpsAgent: new HttpsProxyAgent(proxyString),
            },
        );
        if (status?.code === 200) {
            // Tối ưu hóa: sử dụng Set để tăng tốc độ kiểm tra includes
            const isOfficialBank = index % 2 === 0;
            const targetBanks = isOfficialBank
                ? new Set(OFFICIAL_BANKS)
                : new Set(OTHER_BANKS);

            // Tối ưu hóa: kết hợp filter và map trong một lần duyệt
            const validRows = status.rows.filter(
                (item) =>
                    item.nicepay_code !== undefined &&
                    (isOfficialBank
                        ? targetBanks.has(item.bankcode)
                        : !targetBanks.has(item.bankcode)),
            );

            listStatus = shuffleArray(validRows.map((item) => item.nicepay_code));
        }
        if (listStatus?.length > 0) {
            for (let i = 0; i < listStatus?.length; i++) {
                await sleep(getRandomNumber(2000, 3000));
                const { data } = await axios.post(
                    `https://bfivegwpeymint.gwtenkges.com/payment/np?xtoken=${tokentx}`,
                    {
                        amount: 100000 * getRandomNumber(1, 1000),
                        bank_code: listStatus[i],
                    },
                    {
                        headers: {
                            ...headersCommon,
                        },
                        httpsAgent: new HttpsProxyAgent(proxyString),
                    },
                );
                if (data?.success === false && data?.code === 801001 && data?.msg) {
                    console.log('0000000000: ', data?.msg);
                    return false;
                }
                const bankItem = data.rows;
                if (bankItem) {
                    console.log(
                        `Có bakItem B52- index${index}: ${bankItem.bank_code}-${bankItem.bank_account_no}`
                            .green,
                    );
                    const dataCurrent = datatest.find(
                        (item) =>
                            item.account_no === bankItem.bank_account_no &&
                            item.account_name === bankItem.bank_account_name,
                    );
                    if (!dataCurrent) {
                        var messageNew = `B52-LG`;
                        console.log(`B52-index${index} có data mới`);
                        //gửi data vào tele khi có data mới
                        await sendNewData(
                            messageNew,
                            bankItem.bank_account_name,
                            bankItem.bank_code,
                            bankItem.bank_account_no,
                            bankItem.bank_name,
                            proxyString,
                            'b52',
                        );
                        // await getbank({
                        //     code_bank: bankItem.bank_code,
                        //     account_name: bankItem.bank_account_name,
                        //     account_no: bankItem.bank_account_no,
                        //     branch_name: bankItem.bank_name,
                        //     type: 'b52',
                        // }).save();
                    }
                } else {
                    console.log('Không có bakItem B52');
                    return false;
                }
            }
            return true;
        } else {
            console.log('listStatus length b52 0 co');
            return false;
        }
    } catch (error) {
        console.log(
            `B52-index${index} lỗi getBankB52 ${error?.message || error?.response?.data?.message || error}`,
        );
        return false;
    }
}

module.exports = { getBankB52, b52FuctionLogin };
