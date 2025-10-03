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
        'https://api.gmwin.io/id?command=refreshToken&refreshToken=' + refreshTokenString;

    const headers = {
        accept: '*/*',
        'accept-language': 'vi,vi-VN;q=0.9,en-US;q=0.8,en;q=0.7',
        authorization: '14cd03545d3d4033ba47baa8d8d00898',
        origin: 'https://play.gem.win',
        priority: 'u=1, i',
        referer: 'https://play.gem.win/',
        'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
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
            return accessToken.trim();
        } else {
            console.error('AccessToken not found in response ' + index);
            return '';
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || error;
        console.log('Error gemwin refreshToken', errorMessage);
        return null;
    }
};

const gemWinFunction = async () => {
    const datatest = await getbank.find({ type: 'gem-win' });
    const tokenGemWins = await tokenSunWin.find({ type: 'gem-win' });
    let index = 0;
    while (true) {
        index++;
        for (let i = 0; i < tokenGemWins.length; i++) {
            const { token: refreshTokenString } = tokenGemWins[i];
            const accessToken = await refreshToken(refreshTokenString);
            console.log('accessToken', accessToken);

            if (accessToken) {
                await getBankGemWin(accessToken, datatest);
            }
        }
    }
};
const getBankGemWin = async (tokentx, datatest) => {
    try {
        const apiUrl = 'https://api.gmwin.io/paygate?command=fetchBankAccounts';

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
            console.log('GemWin không có data');
        } else {
            const { items = [] } = data.data;
            if (items.length > 0) {
                console.log('Gemwin');
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
                                var messageNew = 'GemWin';
                                console.log('GemWin có data mới');

                                //gửi data vào tele khi có data mới
                                await sendNewData(
                                    messageNew,
                                    accountName,
                                    items[i].fullName || '',
                                    accountNumber,
                                    bankBranch,
                                    'gem-win',
                                );

                                // getbank({
                                //     code_bank: items[i].fullName || 'null',
                                //     account_name: accountName,
                                //     account_no: accountNumber,
                                //     branch_name: bankBranch,
                                //     type: 'gem-win',
                                // }).save();
                            }
                        }
                    }
                }
            } else {
                console.log('items gemwin===0');
            }
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message || error?.message || error;
        console.log('Error gemwinFunction', errorMessage);
    }
};

module.exports = {
    gemWinFunction,
};
