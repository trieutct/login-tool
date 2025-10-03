const { default: axios } = require('axios');
const {
    getProxies,
    getRandomNumber,
    sendNewData,
    getProcessedAccounts,
    appendToFile,
    sleep,
} = require('../common/helper');
const { HttpsProxyAgent } = require('https-proxy-agent');
const getbank = require('../model/getbank');

const proxies = getProxies();

async function getTypeBanks(access_token) {
    try {
        const apiUrl = 'https://portal.bet357.xyz/api/Momo/GetListBankTransfer';
        const { data: response } = await axios.get(
            `${apiUrl}?access_token=${access_token}`,
            {
                httpsAgent: new HttpsProxyAgent(
                    proxies[Math.floor(Math.random() * proxies.length)],
                ),
            },
        );

        const data = response.Data || [];
        if (data?.length > 0) {
            return data.map((item) => item.code);
        }

        return [];
    } catch (error) {
        console.error('Error fetching banks:', error);
        return [];
    }
}

async function getBankBet39(access_token, datatest) {
    const processedAccounts = getProcessedAccounts('bet39.txt');
    try {
        const codes = await getTypeBanks(access_token);
        if (codes.length > 0) {
            for (const code of codes) {
                const apiUrl =
                    'https://portal.bet357.xyz/api/Momo/GetInfor?type=bank&amount=50000';

                const { data: response } = await axios.get(
                    `${apiUrl}&subType=${code}&access_token=${access_token}`,
                    {
                        httpsAgent: new HttpsProxyAgent(
                            proxies[Math.floor(Math.random() * proxies.length)],
                        ),
                    },
                );

                const { Orders = null } = response;
                if (Orders) {
                    const {
                        WalletAccountName: accountName,
                        WalletAccount: accountNumber,
                        bank_provider: bankName,
                    } = Orders;
                    console.log(`Có bankItem bet39 ${accountNumber}`);
                    const key = `${accountNumber}-${accountName}`;
                    if (!processedAccounts.includes(key)) {
                        const dataCurrent = datatest.find(
                            (item) =>
                                item.account_no === accountNumber &&
                                item.account_name === accountName,
                        );
                        if (!dataCurrent) {
                            var messageNew = 'Bet39';
                            console.log('Bet39 có data mới');

                            await getbank({
                                code_bank: bankName,
                                account_name: accountName,
                                account_no: accountNumber,
                                branch_name: '',
                                type: 'bet39',
                            }).save();

                            //lưu lại key đã xử lý
                            processedAccounts.push(key);
                            appendToFile(key, 'bet39.txt');

                            //gửi data vào tele khi có data mới
                            await sendNewData(
                                messageNew,
                                accountName,
                                bankName,
                                accountNumber,
                                '',
                            );
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error fetching banks:', error);
    }
}

async function getBankBet39Function() {
    const datatest = await getbank.find({ type: 'bet39' });
    let index = 0;
    while (true) {
        index++;
        const accessToken =
            '05%2F7JlwSPGxLb%2BBlmgV0JYi6TSlMZdDQB3UwDAmuWFJhdjIPWfbgQ6KsXNdse2FJdVcf3kve0DxwS1cMcek0LFGTfZNZHV0QOC%2FlIZzsUcUf9tZ1%2FnUTejQqbYrQ3YwMLz8JiPbIaUvcfLeuJVL%2FQRn1eYKpZQdXh7Pn6PftoSQ%2FJ9exLGSrp6fZVZj3uIroQEkPpUTK1EKYMegal4BfRQ6xZtWJEAiZxWU6E0h00X85uw0u7koRVl1zrkYBJ%2FDbRveNWzGTrGcJGz4aj%2BsUH6TbwcgxcPljUrrUGNMTOC0E%2BuOQIrcmKg%3D%3D.fe72984c35fcfa625b90889adf41ceecfd608f7c11e05af81d74106c24736da2';
        if (accessToken) {
            await getBankBet39(accessToken, datatest);
        }
        console.log(`Lần thứ ${index} bet39`);
        await sleep(getRandomNumber(1000, 2000));
    }
}

module.exports = {
    getBankBet39Function,
};
