const {
    getRandomNumber,
    sendNewData,
    headersCommon,
    shuffleArray,
    getAccountsWeb,
    getProcessedAccounts,
    getProxies,
    tachChuoi,
} = require('../common/helper');
const { HttpsProxyAgent } = require('https-proxy-agent');
require('dotenv').config();
const getbank = require('../model/getbank');
const axios = require('axios');
const iwinController = require('../controller/iwin.controller');

async function iwinFuctionLogin(tool = 1, datatest = []) {
    try {
        const accounts = getAccountsWeb('iwin.txt', tool);
        const accountsProcessed = getProcessedAccounts('iwin.txt', tool);
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
            const token = await iwinController.login(
                username,
                password,
                proxyString,
                tool,
            );
            if (token) {
                while (true) {
                    const res = await getBankPlayIwin(token, proxyString, datatest, tool);
                    if (!res) {
                        break;
                    }
                }
            }
        }
    } catch (error) {
        console.log(`PlayIwin-tool${tool} lỗi iwinFuctionLogin`);
    }
}

async function getBankPlayIwin(tokentx, proxyString, datatest, tool = 1) {
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
            const banksOffical = [
                'BIDV',
                'VCB',
                'Techcombank',
                'PVcombank',
                'VietinBank',
                'Vietbank',
                'VPbank',
            ];
            listStatus = shuffleArray(
                status.rows
                    .filter((item) => banksOffical?.includes(item.bankcode))
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
                            `Co bankItem PlayIwin-tool${tool} ${bankItem.account_no}`,
                        );
                        const dataCurrent = datatest.find(
                            (item) =>
                                item.account_no === bankItem.account_no &&
                                item.account_name === bankItem.account_name,
                        );
                        if (!dataCurrent) {
                            var messageNew = `PlayIwin-lg${tool}`;
                            console.log(`PlayIwin-tool${tool} có data mới`);
                            await sendNewData(
                                messageNew,
                                bankItem.account_name,
                                bankItem.bank_code,
                                bankItem.account_no,
                                bankItem.bank_name,
                                proxyString,
                                'play-iwin',
                            );
                            // await getbank({
                            //     code_bank: bankItem.bank_code,
                            //     account_name: bankItem.account_name,
                            //     account_no: bankItem.account_no,
                            //     branch_name: bankItem.bank_name,
                            //     type: 'play-iwin',
                            // }).save();
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
