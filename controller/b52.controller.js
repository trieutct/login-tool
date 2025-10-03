const axios = require('axios');
const crypto = require('crypto');
const { HttpsProxyAgent } = require('https-proxy-agent');
const {
    generateRandomString,
    randomChar,
    headersCommon,
    userAgents,
    writeAccountProcessed,
} = require('../common/helper');
class b52Controller {
    async registerAccount(
        proxyUrl = 'http://1219mdtrieutct:trieutct@116.98.83.39:21433',
    ) {
        try {
            const username = generateRandomString();
            const agent = new HttpsProxyAgent(proxyUrl);
            const respose = await axios.post(
                'https://bfivegwlog.gwtenkges.com/user/register.aspx',
                {
                    app_id: 'b52.club',
                    browser: 'chrome',
                    device: 'Computer',
                    os: 'Windows',
                    fullname: username,
                    password: 'qwweee12345',
                    username: username,
                },
                {
                    headers: {
                        ...headersCommon,
                    },
                    httpsAgent: agent,
                },
            );
            return respose.data;
        } catch (error) {
            console.log(`Lỗi ${error.message}`);
            return error;
        }
    }

    async updateFullName(
        proxyUrl = 'http://1219mdtrieutct:trieutct@116.98.83.39:21433',
        userName = generateRandomString(),
        tokentx = 'ece042e718e2694706d39451b5c0c794',
    ) {
        try {
            const character = randomChar();

            const agent = new HttpsProxyAgent(proxyUrl);

            const respose = await axios.post(
                'https://bfivegwlog.gwtenkges.com/user/update.aspx',
                {
                    fullname: userName + character,
                    aff_id: '',
                },
                {
                    httpsAgent: agent,
                    headers: {
                        ...headersCommon,
                        'X-Token': `${tokentx}`,
                    },
                },
            );
            if (respose.data?.code === 200) {
                console.log('B52 update tên thành công');
            }
            return respose.data;
        } catch (error) {
            console.log(`B52 lỗi update fullName b52 ${error}`);
            return error;
        }
    }

    async login(username, password, proxyUrl) {
        try {
            const url = 'https://bfivegwlog.gwtenkges.com/user/login.aspx';
            const agent = new HttpsProxyAgent(proxyUrl);
            const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

            const headers = {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                'content-type': 'text/plain;charset=UTF-8',
                origin: 'https://i.b52.club',
                priority: 'u=1, i',
                referer: 'https://i.b52.club/',
                'sec-ch-ua':
                    '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': userAgent,
            };

            const data = {
                username: username,
                password: password,
                app_id: 'b52.club',
                os: 'Windows',
                device: 'Computer',
                browser: 'chrome',
                fg: crypto.randomUUID().toUpperCase(),
                version: '1.75.3',
                aff_id: 'b52',
            };

            const response = await axios.post(url, JSON.stringify(data), {
                headers,
                httpsAgent: agent,
            });
            const res = response?.data?.data;

            if (res && res[0]) {
                const token = res[0]?.session_id || null;

                if (res[0]?.fullname === '_noname') {
                    const fullName = generateRandomString();
                    await this.updateFullName(proxyUrl, fullName, token);
                }
                const account = `${username}|${password}`;
                await writeAccountProcessed(account, 'b52.txt');
                return token;
            }
            return null;
        } catch (error) {
            console.log(`B52 lỗi login b52 ${error}`);
            return null;
        }
    }
}
module.exports = new b52Controller();
