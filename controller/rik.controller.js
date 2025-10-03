const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { generateRandomString, randomChar, headersCommon, writeAccountProcessed, userAgents } = require('../common/helper');
const crypto = require('crypto');

class rikController {
    async registerAccount(
        proxyUrl = 'http://1219mdtrieutct:trieutct@116.98.83.39:21433',
    ) {
        try {
            const username = generateRandomString();

            const agent = new HttpsProxyAgent(proxyUrl);

            const respose = await axios.post(
                'https://bordergw.api-inovated.com/user/register.aspx',
                {
                    ff_id: 'RIKVIP',
                    browser: 'chrome',
                    device: 'Computer',
                    fullname: username,
                    os: 'Windows',
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
                'https://bordergw.api-inovated.com/user/update.aspx',
                {
                    fullname: userName + character,
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
                console.log('Rik update tên thành công');
            }
            return respose.data;
        } catch (error) {
            console.log(`Lỗi update fullName rik ${error}`);
            return error;
        }
    }

    async login(username, password, proxyUrl) {
        try {
            const url = 'https://bordergw.api-inovated.com/user/login.aspx';
            const time = Date.now();

            const agent = new HttpsProxyAgent(proxyUrl);
            const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

            const headers = {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                'content-type': 'text/plain;charset=UTF-8',
                origin: 'https://play.rikvip.win',
                priority: 'u=1, i',
                referer: 'https://play.rikvip.win/',
                'sec-ch-ua':
                    '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'cross-site',
                'user-agent': userAgent,
            };

            const body = {
                username: username,
                password: password,
                app_id: 'rik.vip',
                os: 'Windows',
                device: 'Computer',
                browser: 'chrome',
                fg: crypto.randomUUID().toUpperCase(),
                time: time,
                sign: crypto.randomUUID().toUpperCase(),
                aff_id: 'RIKVIP',
                version: '2.224.1',
            };

            const res = await axios.post(url, JSON.stringify(body), {
                headers,
                httpsAgent: agent,
            });
            const data = res?.data?.data;
            if (data) {
                const token = data[0]?.session_id || null;
                if (data[0]?.fullname === '_noname') {
                    const fullName = generateRandomString();
                    await this.updateFullName(proxyUrl, fullName, token);
                }
                const account = `${username}|${password}`;
                await writeAccountProcessed(account, 'rik.txt');
                return token;
            }
            return null;
        } catch (error) {
            console.log(`Rik lỗi login rik ${error}`);
            return null;
        }
    }
}
module.exports = new rikController();
