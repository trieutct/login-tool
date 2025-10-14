const { default: axios } = require('axios');
require('dotenv').config();
require('colors');
const {
    generateRandomString,
    generateRandomPassword,
    getFullName,
    getProxies,
    shuffleArray,
    sleep,
    headersCommon,
    sendNewData,
    getRandomNumber,
    writeAccountToFile,
    sendMessageTele,
    excludedBanks,
    tachChuoi,
    getAccountsWeb,
    getProcessedAccounts,
    writeAccountProcessed,
} = require('../common/helper');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { v4: uuidv4 } = require('uuid');
const accountSchema = require('../model/account');
const crypto = require('crypto');
const dayjs = require('dayjs');
const GET_CAPTCHA_URL_API = process.env.GET_CAPTCHA_URL_API;

// async function hitFunction(banks = [], isUseProxyRotating = false) {
//     const proxies = shuffleArray(
//         getProxies(isUseProxyRotating ? 'proxy-rotating.txt' : 'proxy.txt'),
//     );
//     const typeWeb = isUseProxyRotating ? 'Hit-Rotating' : 'Hit';
//     let count = 0;
//     while (true) {
//         count++;
//         for (const proxy of proxies) {
//             const fg = uuidv4().toUpperCase();
//             const username = generateRandomString();
//             const password = generateRandomPassword();
//             const proxyAgent = new HttpsProxyAgent(proxy);

//             const userData = {
//                 username: username,
//                 fullname: getFullName(),
//                 password: password,
//                 avatar: `Avatar${Math.floor(Math.random() * 50 + 1)}`,
//                 app_version: `${Math.floor(Math.random() * 2 + 2)}.${Math.floor(
//                     Math.random() * 51 + 100,
//                 )}.${Math.floor(Math.random() * 10)}`,
//                 os_version: `${Math.floor(Math.random() * 5 + 14)}.${Math.floor(
//                     Math.random() * 10,
//                 )}`,
//                 user_agent: randomUserAgent(),
//                 fg,
//                 ci_session: generateSessionKey(),
//             };

//             const captchaData = await getCaptcha(proxy, fg);
//             if (!captchaData) {
//                 continue;
//             }

//             const { token, b64, message } = captchaData;
//             if (!token || !b64) {
//                 console.log('⚠️ Missing captcha data, skip...'.red);
//                 continue;
//             }

//             let captchaText = '';
//             try {
//                 const res = await axios.post(`${GET_CAPTCHA_URL_API}/upload`, {
//                     image: b64,
//                     message,
//                 });
//                 captchaText = res.data?.message || '';
//                 console.log("res.data", res.data);

//                 if (!captchaText) throw new Error('Captcha decode failed');
//             } catch (err) {
//                 console.error(`❌ Captcha decoding error: ${err.message}`.red);
//                 continue;
//             }

//             const registerPayload = {
//                 fullname: userData.fullname,
//                 username: userData.username,
//                 password: userData.password,
//                 app_id: 'bc114103',
//                 avatar: userData.avatar,
//                 os: 'iOS',
//                 device: 'Phone',
//                 browser: 'App',
//                 fg: userData.fg,
//                 aff_id: 'hit',
//                 bunleid: 'com.Medaver.WhatTheShot',
//                 referer: 'app.com.TSG.TheShadowGrounds',
//                 version: userData.app_version,
//                 os_version: userData.os_version,
//                 token,
//                 captcha: captchaText,
//             };

//             try {
//                 const registerRes = await axios.post(
//                     'https://bodergatez.dsrcgoms.net/user/register.aspx',
//                     JSON.stringify(registerPayload),
//                     {
//                         headers: {
//                             'Content-Type': 'application/x-www-form-urlencoded',
//                             'User-Agent': userData.user_agent,
//                             Cookie: `ci_session=${userData.ci_session}`,
//                             Host: 'bodergatez.dsrcgoms.net',
//                         },
//                         httpsAgent: proxyAgent,
//                         timeout: 7000,
//                     },
//                 );

//                 const resp = registerRes.data;

//                 const { session_id } = resp?.data?.[0] || {};
//                 if (!session_id) {
//                     console.log(
//                         `⚠️ Register failed or no session returned. ${JSON.stringify(
//                             resp,
//                         )}`.red,
//                     );
//                     continue;
//                 }

//                 const verifyRes = await axios.get(
//                     `https://bodergatez.dsrcgoms.net/gwms/v1/verifytoken.aspx?token=${session_id}&fg=${userData.fg}`,
//                     {
//                         headers: { 'User-Agent': userData.user_agent },
//                         httpsAgent: proxyAgent,
//                         timeout: 5000,
//                     },
//                 );

//                 if (verifyRes.data?.status === 'OK') {
//                     await accountSchema({
//                         username: username,
//                         token: session_id,
//                         web: 'hit',
//                         proxy: proxy,
//                     }).save();

//                     const fullname = getFullName(username);
//                     const resUpdateFullName = await updateFullNameHit(
//                         proxy,
//                         fullname,
//                         session_id,
//                     );

//                     // if (!resUpdateFullName) {
//                     //     throw new Error(
//                     //         `Lỗi updateFullNameHit: ${JSON.stringify(resUpdateFullName)}`,
//                     //     );
//                     // }

//                     const account = `${username}|${password}`;
//                     await writeAccountToFile(account, 'hit.txt');
//                     console.log(
//                         `${typeWeb}: Đăng ký tài khoản thành công-> ${username} -> ${password}`
//                             .green,
//                     );

//                     while (true) {
//                         const res = await getBankHit(
//                             session_id,
//                             proxy,
//                             banks,
//                             isUseProxyRotating,
//                         );
//                         if (!res) break;
//                     }
//                 } else {
//                     console.log('❌ Token verify failed.'.red);
//                     continue;
//                 }
//             } catch (err) {
//                 console.error(`❌ Register error:${err.message}`.red);
//                 continue;
//             }
//         }

//         // bắn vào account để check
//         await sendMessageTele(
//             `${typeWeb} đã xong ${count} lần. Và đang đợi 30s để chạy lại`,
//         );
//         await sleep(30000);
//         await sendMessageTele(
//             `${typeWeb} đã đợi xong 30s để chạy lại. Bắt đầu chạy tiếp lần ${count + 1}`,
//         );
//     }
// }

async function hitFunctionLogin(datatest = [], proxies = []) {
    const chunkArray = (array, chunkSize) => {
        const result = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            result.push(array.slice(i, i + chunkSize));
        }
        return result;
    };

    const runGetBank = async (accounts, proxies, index = 0) => {
        for (const account of accounts) {
            const proxyString = proxies[Math.floor(Math.random() * proxies.length)];
            const { username, password } = tachChuoi(account);
            const token = await loginHit(username, password, proxyString);
            if (token) {
                await writeAccountProcessed(account, 'hit.txt');
                while (true) {
                    const res = await getBankHit(
                        token,
                        proxyString,
                        datatest,
                        true,
                        false,
                        index,
                    );
                    if (!res) break;
                }
            }
            await sleep(500);
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
            const accounts = getAccountsWeb('hit.txt');
            const accountsProcessed = getProcessedAccounts('hit.txt');
            // const proxies = await getProxies('proxy-rotating.txt');
            if (!proxies.length) {
                continue;
            }
            const accountsChunks = chunkArray(accounts, Math.floor(accounts?.length / 100));
            const runPromises = accountsChunks.map((accountsChunk, index) =>
                runGetBank(
                    getAccountsProcessed(accountsChunk, accountsProcessed),
                    proxies,
                    index + 1,
                ),
            );
            await Promise.allSettled(runPromises);
        } catch (error) {
            console.log(
                `Lỗi hitFunctionLogin: ${error?.message || error?.response?.data?.message || error}`,
            );
            continue;
        }
    }
}

async function yesterDayHitFunction(datatest = []) {
    const proxies = shuffleArray(getProxies());
    const yesterdayStart = dayjs().subtract(1, 'day').startOf('day').toDate(); // 00:00:00 hôm qua
    const yesterdayEnd = dayjs().subtract(1, 'day').endOf('day').toDate(); // 23:59:59 hôm qua

    while (true) {
        const accounts = await accountSchema
            .find({
                web: 'hit',
                createdAt: { $gte: yesterdayStart, $lte: yesterdayEnd },
            })
            .sort({ createdAt: 1 })
            .limit(500)
            .lean();

        if (accounts?.length > 0) {
            for (const account of accounts) {
                try {
                    while (true) {
                        const res = await getBankHit(
                            account.token,
                            proxies[Math.floor(Math.random() * proxies.length)],
                            datatest,
                            false,
                            true,
                        );
                        if (!res) break;
                    }
                } catch (err) {
                    console.log(
                        `Lỗi yesterDayHitFunction: ${err?.message || err?.response?.data?.message || err
                            }`.red,
                    );
                    continue;
                }
            }

            const accountIds = accounts.map((account) => account._id);
            await accountSchema.deleteMany({ _id: { $in: accountIds } });
        }

        await sleep(30000);
    }
}

function generateSessionKey(length = 32) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    // Tạo buffer ngẫu nhiên đủ dài
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        key += chars[bytes[i] % chars.length];
    }
    return key;
}

async function updateFullNameHit(
    proxyUrl = 'http://1219mdtrieutct:trieutct@116.98.83.39:21433',
    fullName,
    tokentx = 'ece042e718e2694706d39451b5c0c794',
) {
    try {
        const agent = new HttpsProxyAgent(proxyUrl);

        const respose = await axios.post(
            'https://bodergatez.dsrcgoms.net/user/update.aspx',
            {
                fullname: fullName,
            },
            {
                httpsAgent: agent,
                headers: {
                    ...headersCommon,
                    'X-Token': `${tokentx}`,
                },
            },
        );
        if (respose.data?.code !== 200) {
            throw new Error(`Lỗi updateFullNameHit: ${JSON.stringify(respose.data)}`);
        }
        console.log('Hit update tên thành công'.green);
        return true;
    } catch (error) {
        console.log(
            `Lỗi updateFullNameHit: ${error?.message || error?.response?.data?.message || error
                }`.red,
        );
        return false;
    }
}

async function getBankHit(
    tokentx,
    proxyString,
    datatest,
    isUseProxyRotating = false,
    isYesterDay = false,
    index = 0,
) {
    const httpsAgent = new HttpsProxyAgent(proxyString);
    const typeWeb = isYesterDay
        ? 'Y-Hit'
        : isUseProxyRotating
            ? `Hit-Rotating-index${index}`
            : `Hit-index${index}`;

    const baseHeaders = {
        ...headersCommon,
    };

    try {
        const { data: status } = await axios.get(
            `https://pmbodergw.dsrcgoms.net/payment/np/status?version=v2&xtoken=${tokentx}`,
            {
                headers: {
                    ...baseHeaders,
                },
                httpsAgent: httpsAgent,
            },
        );

        if (status?.code !== 200) {
            console.log(`status length hit 0 ${JSON.stringify(status)}`.red);
            return false;
        }

        let originalData = status?.rows
            .map((item) => ({
                nicepay_code: item.nicepay_code,
                bankcode: item.bankcode,
                ext_status: item?.ext_status || false,
            }))
            .filter(
                (item) =>
                    item.nicepay_code !== undefined &&
                    item.bankcode !== undefined &&
                    !excludedBanks.includes(item.nicepay_code),
            );
        if (isUseProxyRotating && index % 2 === 0) {
            originalData = originalData.filter((item) =>
                ['TCB', 'ICB', 'VCB', 'BIDV', 'VPB'].includes(item.nicepay_code),
            );
        }

        const combinedList = shuffleArray(originalData);

        if (!combinedList?.length) {
            console.log('combinedList length hit 0'.red);
            return false;
        }

        for (const item of combinedList) {
            const { data } = await axios.post(
                `https://pmbodergw.dsrcgoms.net/payment/np?version=v2&xtoken=${tokentx}`,
                {
                    amount: 100000 * getRandomNumber(1, 1000),
                    bank_code: item.nicepay_code,
                    bank_code2: item.bankcode,
                    ext_status: item.ext_status,
                },
                {
                    headers: {
                        ...baseHeaders,
                        'Content-Type': 'application/json',
                        origin: 'https://web.hit.club',
                        referer: 'https://web.hit.club/',
                        'x-token': `${tokentx}`,
                    },
                    httpsAgent: httpsAgent,
                },
            );

            if (!data?.code === 200) {
                throw new Error(JSON.stringify(data));
            }

            const bankItem = data?.rows;
            if (!bankItem) {
                throw new Error(`${typeWeb} không có bankItem ${JSON.stringify(data)}`);
            }

            console.log(
                `Có bankItem ${typeWeb}: ${item.nicepay_code}-${bankItem.bank_account_no}`
                    .yellow,
            );

            const exists = datatest.find(
                (item) =>
                    item.account_no === bankItem.bank_account_no &&
                    item.account_name === bankItem.bank_account_name,
            );
            if (!exists) {
                console.log(`${typeWeb} có data mới`.green);
                const title = `HIT-LG`;

                await sendNewData(
                    title,
                    bankItem.bank_account_name,
                    bankItem.bank_code,
                    bankItem.bank_account_no,
                    bankItem.bank_name || 'no bank name',
                    proxyString,
                    'hit',
                );
            }

            await sleep(getRandomNumber(3000, 4000));
        }

        return true;
    } catch (err) {
        console.log(
            `Lỗi getBankHit: ${err?.message || err?.response?.data?.message || err}`.red,
        );
        return false;
    }
}

async function getCaptcha(proxyString, fgId, islogin = false) {
    const url = islogin
        ? 'https://bodergatez.dsrcgoms.net/verify/index.aspx'
        : 'https://bodergatez.dsrcgoms.net/verify/index.aspx?register=get-captcha';

    const headers = {
        Accept: '*/*',
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'TheShadowGrounds/2 CFNetwork/3826.500.111.2.2 Darwin/24.4.0',
        'X-FG-ID': fgId,
        Host: 'bodergatez.dsrcgoms.net',
    };

    try {
        const response = await axios.post(url, JSON.stringify({ fg_id: fgId }), {
            headers,
            httpsAgent: new HttpsProxyAgent(proxyString),
            timeout: 7000,
        });
        return response.data?.c || null;
    } catch (err) {
        console.error(`❌ CAPTCHA error: ${err.response?.data || err.message}`.red);
        return null;
    }
}

async function loginHit(username, password, proxyString) {
    const fg = uuidv4().toUpperCase();

    const captchaData = await getCaptcha(proxyString, fg, false);
    if (!captchaData) {
        return null;
    }

    const { token, b64, message } = captchaData;
    if (!token || !b64) {
        console.log('⚠️ Missing captcha data, skip...'.red);
        return null;
    }

    let captchaText = '';
    try {
        const res = await axios.post(`${GET_CAPTCHA_URL_API}/upload`, {
            image: b64,
            message,
        });
        captchaText = res.data?.message || '';

        if (!captchaText) throw new Error('Captcha decode failed');
    } catch (err) {
        console.error(`❌ Captcha decoding error: ${err.message}`.red);
        return null;
    }

    if (!captchaText) {
        console.log('⚠️ Missing captcha text, skip...'.red);
        return null;
    }

    const headers = {
        accept: '*/*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8,vi;q=0.7',
        'content-type': 'application/json', // đổi sang json nếu bạn gửi JSON
        origin: 'https://i.hit.club',
        referer: 'https://i.hit.club/',
        'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'user-agent': randomUserAgent(),
        'x-fg-id': fg,
    };
    const loginPayload = {
        username,
        password,
        app_id: 'bc114103',
        os: 'Windows',
        device: 'Computer',
        browser: 'chrome',
        fg,
        time: Date.now(),
        token: token,
        captcha: captchaText,
        sign: generateRandomKey(),
        version: '1.52.5',
        bunleid: '',
        csrf: '',
        aff_id: 'hit',
    };

    const respose = await axios.post(
        'https://bodergatez.dsrcgoms.net/user/login.aspx',
        JSON.stringify(loginPayload),
        {
            headers,
            httpsAgent: new HttpsProxyAgent(proxyString),
        },
    );

    const { session_id = undefined } = respose.data?.data?.[0] || {};
    return session_id;
}

const randomUserAgent = () => {
    const agents = [
        'WhattTheShot-mobile/3 CFNetwork/3826.500.131 Darwin/24.5.0',
        'WhattTheShot-mobile/3 CFNetwork/1390.0.1 Darwin/22.0.0',
        'WhattTheShot-mobile/3 CFNetwork/978.0.7 Darwin/18.7.0',
        'WhattTheShot-mobile/3 CFNetwork/1240.0.4 Darwin/20.6.0',
    ];
    return agents[Math.floor(Math.random() * agents.length)];
};

function generateRandomKey(length = 32) {
    const characters = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

module.exports = {
    // hitFunction,
    yesterDayHitFunction,
    loginHit,
    hitFunctionLogin,
};
