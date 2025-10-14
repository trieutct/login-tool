const {
    getRandomNumber,
    sendNewData,
    headersCommon,
    shuffleArray,
    getAccountsWeb,
    getProcessedAccounts,
    tachChuoi,
    sleep,
} = require('../common/helper');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const axios = require('axios');
const iwinController = require('../controller/iwin.controller');

async function iwinFuctionLogin(datatest = [], proxies = []) {
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
            const token = await iwinController.login(
                username,
                password,
                proxyString
            );
            if (token) {
                while (true) {
                    const res = await getBankPlayIwin(token, proxyString, datatest, index);
                    if (!res) {
                        break;
                    }
                }
            }
        }
    }

    const getAccountsProcessed = (accounts = [], accountsProcessed = []) => {
        const data = !accountsProcessed?.length
            ? shuffleArray(accounts)
            : shuffleArray(accounts.filter((item) => !accountsProcessed.includes(item)));
        return data;
    };

    while (true) {
        try {
            const accounts = getAccountsWeb('iwin.txt');
            const accountsProcessed = getProcessedAccounts('iwin.txt');
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
            console.log(`PlayIwin lỗi iwinFuctionLogin: ${error?.message || error?.response?.data?.message || error}`);
            continue;
        }
        await sleep(1000);
    }
}

const OFFICIAL_BANKS = ['BIDV', 'VPbank', 'Vietbank', 'VietinBank', 'VCB', 'Techcombank'];
const OTHER_BANKS = ['Eximbank', 'ACB', 'NamABank', 'MBbank', 'DongA', 'NCB'];

async function getBankPlayIwin(tokentx, proxyString, datatest, index = 0) {
    let listStatus = [];
    try {
        const { data: status } = await axios.post(
            `https://baymentgwapy.gwyqinbg.com/payment/bnp?xtoken=${tokentx}`,
            {
                httpsAgent: new HttpsProxyAgent(proxyString),
                headers: {
                    'Content-Type': 'text/plain;charset=UTF-8',
                    Accept: '*/*',
                    'Accept-Encoding': 'gzip, deflate, br, zstd',
                    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
                    Origin: 'https://play.iwin.net',
                    Referer: 'https://play.iwin.net/',
                    'User-Agent':
                        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                },
            },
        );
        if (status?.code === 200) {
            listStatus = shuffleArray(
                status.rows
                    .filter((item) => (index % 2 === 0 ? OFFICIAL_BANKS?.includes(item.bankcode) : !OTHER_BANKS?.includes(item.bankcode)))
                    .map((item) => item.bankcode),
            );
        }
        if (listStatus?.length > 0) {
            for (let i = 0; i < listStatus?.length; i++) {
                const { data } = await axios.post(
                    `https://baymentgwapy.gwyqinbg.com/payment/np?xtoken=${tokentx}`,
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
                if (data?.code === 200) {
                    const bankItem = data.rows;
                    if (bankItem) {
                        console.log(
                            `Co bankItem PlayIwin-index${index}: ${bankItem.bank_name} ${bankItem.account_no}`,
                        );
                        const dataCurrent = datatest.find(
                            (item) =>
                                item.account_no === bankItem.account_no &&
                                item.account_name === bankItem.account_name,
                        );
                        if (!dataCurrent) {
                            var messageNew = `PlayIwin-LG`;
                            console.log(`PlayIwin-index:${index} có data mới`);
                            await sendNewData(
                                messageNew,
                                bankItem.account_name,
                                bankItem.bank_code,
                                bankItem.account_no,
                                bankItem.bank_name,
                                proxyString,
                                'play-iwin',
                            );
                        }
                    } else {
                        console.log('Không có bankItem getBankPlayIwin');
                    }
                } else {
                    console.log('Play Iwin data.code !== 200');
                    if (
                        data?.code === 400 &&
                        data.success === false &&
                        data?.msg ===
                            'Không thể tạo mã lúc này, liên hệ LiveChat để được hỗ trợ'
                    ) {
                        console.log(
                            'Play Iwin data?.code === 400 && data.success === false && data?.msg === Không thể tạo mã lúc này, liên hệ LiveChat để được hỗ trợ',
                        );
                        return false;
                    }
                    return false;
                }
            }
            return true;
        } else {
            console.log('listStatus length playIWin 0');
            return false;
        }
    } catch (error) {
        if (
            error?.response?.data?.code === 400 &&
            error?.response?.data?.msg ===
                'Bạn đang có nhiều phiếu nạp chưa hoàn thành, vui lòng chuyển tiền hoặc thao tác lại sau.'
        ) {
            console.log(
                "getBankPlayIwin: error.response.data.code === 400 && error.response.data.msg === 'Bạn đang có nhiều phiếu nạp chưa hoàn thành, vui lòng chuyển tiền hoặc thao tác lại sau.'",
            );
            return false;
        } else if (!error?.response?.data?.msg) {
            return false;
        }
        return true;
    }
}

module.exports = { getBankPlayIwin, iwinFuctionLogin };
