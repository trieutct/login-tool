const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { generateRandomString, randomChar, headersCommon, userAgents, writeAccountProcessed } = require('../common/helper');
const crypto = require('crypto');
class noHuController {
    async registerAccount(
        proxyUrl = 'http://1219mdtrieutct:trieutct@116.98.83.39:21433',
    ) {
        try {
            const username = generateRandomString();
            const agent = new HttpsProxyAgent(proxyUrl);
            const respose = await axios.post(
                'https://gatqueization.jeckatis.com/user/register.aspx',
                {
                    fullname: username,
                    username: username,
                    password: 'cc414252617',
                    app_id: 'bc112118',
                    avatar: 'avatar44',
                    os: 'Windows',
                    device: 'Computer',
                    browser: 'chrome',
                    version: '1.3.3',
                    aff_id: 'nohu',
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
                'https://gatqueization.jeckatis.com/user/update.aspx',
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
                console.log('Nohu update tên thành công');
            }
            return respose.data;
        } catch (error) {
            console.log(`Nohu lỗi update fullName nohu ${error}`);
            return error;
        }
    }

    async login(username, password, proxyUrl) {
        try {
            const url = 'https://gatqueization.jeckatis.com/user/login.aspx';
            const agent = new HttpsProxyAgent(proxyUrl);
            const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

            const headers = {
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                'content-type': 'text/plain;charset=UTF-8',
                'origin': 'https://play.nohu.top',
                'priority': 'u=1, i',
                'referer': 'https://play.nohu.top/',
                'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
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
                app_id: "bc112118",
                os: "Windows",
                device: "Computer",
                browser: "chrome",
                fg: crypto.randomUUID().toUpperCase(),
                aff_id: "",
                apVer: "1.7.1",
                version: "1.7.1"
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
                await writeAccountProcessed(account, 'nohu.txt');
                return token;
            }else{
                console.log(`Nohu lỗi login nohu: ${response?.data?.message}`);
            }
            return null;
        } catch (error) {
            console.log(`Nohu lỗi login nohu ${error}`);
            return null;
        }
    }
}
module.exports = new noHuController();
