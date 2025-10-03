const { HttpsProxyAgent } = require('https-proxy-agent');
const {
    sendNewData,
    sleep,
    getProxies,
    headersCommon,
    getRandomNumber,
} = require('../common/helper');
const getbank = require('../model/getbank');
const tokenSunWin = require('../model/tokenSunWin');
const axios = require('axios');
const proxies = getProxies();

const refreshToken = async (refreshTokenString) => {
    const url =
        'https://api.azhkthg1.net/id?command=refreshToken&refreshToken=' +
        refreshTokenString;
    const headers = {
        accept: '*/*',
        'accept-language': 'vi,vi-VN;q=0.9,en-US;q=0.8,en;q=0.7',
        authorization: '5ca1ba18763e46a1a2c1e6e4f8fbb446',
        origin: 'https://play.sun.win',
        priority: 'u=1, i',
        referer: 'https://play.sun.win/',
        'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    };

    try {
        const response = await axios.get(url, {
            headers,
            httpsAgent: new HttpsProxyAgent(
                proxies[Math.floor(Math.random() * proxies.length)],
            ),
        });

        const accessToken = response.data.data.accessToken;

        if (accessToken) {
            return accessToken;
        } else {
            console.error('AccessToken not found in response ');
            return '';
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || error;
        console.log('Error sunwin refreshToken', errorMessage);
        return null;
    }
};

const sunWinFunction = async () => {
    const datatest = await getbank.find();
    const tokenSunWins = await tokenSunWin.find({ type: 'sun-win' });
    let index = 0;
    while (true) {
        index++;
        for (let i = 0; i < tokenSunWins.length; i++) {
            const { token: refreshTokenString } = tokenSunWins[i];
            const accessToken = await refreshToken(refreshTokenString);
            if (accessToken) {
                await getBankSunWin(accessToken, datatest);
            }
        }
    }
};
const getBankSunWin = async (tokentx, datatest) => {
    try {
        const apiUrl = 'https://api.azhkthg1.net/paygate?command=fetchBankAccounts';

        const { data = null } = await axios.get(apiUrl, {
            headers: {
                ...headersCommon,
                Authorization: tokentx,
            },
            httpsAgent: new HttpsProxyAgent(
                proxies[Math.floor(Math.random() * proxies.length)],
            ),
        });
        if (!data) {
            console.log('SunWin không có data');
        } else {
            const { items = [] } = data.data;
            if (items.length > 0) {
                console.log('Sunwin');
                for (let i = 0; i < items.length; i++) {
                    const { accounts = [] } = items[i];
                    if (accounts.length > 0) {
                        const bankItem = accounts[0];
                        if (bankItem) {
                            const { accountName, accountNumber, bankBranch } = bankItem;

                            const key = `${accountNumber}-${accountName}`;
                            const dataCurrent = datatest.find(
                                (item) =>
                                    item.account_no === accountNumber &&
                                    item.account_name === accountName,
                            );
                            if (!dataCurrent) {
                                var messageNew = 'SunWin';
                                console.log('SunWin có data mới');

                                //gửi data vào tele khi có data mới
                                await sendNewData(
                                    messageNew,
                                    accountName,
                                    items[i].fullName || '',
                                    accountNumber,
                                    bankBranch,
                                    'sun-win',
                                );

                                // getbank({
                                //     code_bank: items[i].fullName || 'null',
                                //     account_name: accountName,
                                //     account_no: accountNumber,
                                //     branch_name: bankBranch,
                                //     type: 'sun-win',
                                // }).save();
                            }
                        }
                    }
                }
            } else {
                console.log('items sunwin===0');
            }
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || error;
        console.log('Error sunwinFunction', errorMessage);
    }
};

module.exports = {
    sunWinFunction,
};
