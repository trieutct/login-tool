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
class hitClubController {
    async registerAccount(
        proxyUrl = 'http://1219mdtrieutct:trieutct@116.98.83.39:21433',
    ) {
        try {
            const username = generateRandomString();
            const agent = new HttpsProxyAgent(proxyUrl);
            const response = await axios.post(
                'https://getquayaybiai.gwyqinbg.com/user/register.aspx',
                {
                    aff_id: 'iwin',
                    avatar: 'Avatar_05',
                    browser: 'chrome',
                    device: 'Computer',
                    fullname: username,
                    os: 'Windows',
                    password: 'qwweee12345',
                    username: username,
                },
                {
                    httpsAgent: agent,
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
            return response.data;
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
                'https://getquayaybiai.gwyqinbg.com/user/update.aspx',
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
                console.log('Play Iwin update tên thành công');
            }
            return respose.data;
        } catch (error) {
            console.log(`Play Iwin lỗi update fullName Iwin ${error}`);
            return error;
        }
    }

    async login(username, password, proxyUrl, tool = 1) {
        try {
            const url = 'https://getquayaybiai.gwyqinbg.com/user/login.aspx';
            const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
            const agent = new HttpsProxyAgent(proxyUrl);

            const headers = {
                accept: '*/*',
                'accept-language': 'en-US,en;q=0.9,vi;q=0.8',
                'content-type': 'text/plain;charset=UTF-8',
                origin: 'https://play.iwin.net',
                priority: 'u=1, i',
                referer: 'https://play.iwin.net/',
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
                app_id: 'iwin.club',
                os: 'Windows',
                device: 'Computer',
                browser: 'chrome',
                fg: crypto.randomUUID().toUpperCase(),
                aff_id: 'IWIN',
                version: '2.34.0',
            };

            const response = await axios.post(url, JSON.stringify(body), {
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
                await writeAccountProcessed(account, 'iwin.txt', tool);
                return token;
            }
            return null;
        } catch (error) {
            console.log(`Play Iwin lỗi login Iwin ${error}`);
            return null;
        }
    }
}

module.exports = new hitClubController();
