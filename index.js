const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent'); // import đúng
const GET_CAPTCHA_URL_API = 'http://193.39.185.183:5003';

// helper to safe log without colors package
const warn = (...args) => console.warn(...args);
const error = (...args) => console.error(...args);

const getCaptcha = async (proxyString, fgId) => {
    const api = 'https://bodergatez.dsrcgoms.net/verify/index.aspx';

    const headers = {
        Accept: '*/*',
        'Content-Type': 'application/json', // send JSON (match body)
        'User-Agent': 'TheShadowGrounds/2 CFNetwork/3826.500.111.2.2 Darwin/24.4.0',
        'X-FG-ID': fgId,
        Host: 'bodergatez.dsrcgoms.net',
    };

    try {
        const agent = new HttpsProxyAgent(proxyString);

        // send JSON body because header is application/json
        const response = await axios.post(
            api,
            { fg_id: fgId }, // axios will JSON.stringify automatically
            {
                headers,
                httpsAgent: agent,
                timeout: 7000,
            },
        );

        // debug: show top-level keys only (avoid logging sensitive)
        if (!response || !response.data) {
            warn('getCaptcha: empty response.data');
            return null;
        }

        // adjust this depending on real API shape
        // expected something like { c: { token, b64, message } } or { token, b64, message }
        let c = response.data.c ?? response.data;
        // if c is not object, bail
        if (!c || typeof c !== 'object') {
            warn('getCaptcha: unexpected response shape', Object.keys(response.data));
            return null;
        }

        // return the object assumed to contain token/b64/message
        return c;
    } catch (err) {
        // More informative error handling
        const code = err.code || (err.response && err.response.status) || 'UNKNOWN';
        error(`❌ CAPTCHA error: code=${code} message=${err.message}`);
        // optionally show response body for debugging (careful with sensitive data)
        if (err.response && err.response.data) {
            warn('response.data:', err.response.data);
        }
        return null;
    }
};

const login = async () => {
    // const fgId = uuidv4().toUpperCase();

    // proxy string you provided
    // const proxy = 'http://user49118:kkxIx1FnUX@103.162.31.234:49118';

    // const captchaData = await getCaptcha(proxy, fgId);
    // if (!captchaData) {
    //     warn('No captcha data received');
    //     return null;
    // }

    // const { token, b64, message } = captchaData;
    // console.log('captchaData', captchaData);

    // if (!token || !b64) {
    //     warn('Missing token or b64 in captchaData');
    //     return null;
    // }

    let captchaText = '';
    try {
        const res = await axios.post(
            // `${GET_CAPTCHA_URL_API}/get-base64-by-color`,
            `${GET_CAPTCHA_URL_API}/upload-login`,
            {
                image:"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",
                message: 'black',
            },
            { timeout: 10000 },
        );

        console.log('res', res);

        if (!res || !res.data) {
            warn('upload-login returned empty response');
            return null;
        }

        captchaText = res.data?.message || res.data?.text || '';
        if (!captchaText) throw new Error('Captcha decode failed');

        // trả về kết quả để dùng tiếp
        return { captchaText };
    } catch (err) {
        error(`❌ Captcha decoding error: ${err}`);
        return null;
    }
};

(async () => {
    const result = await login();
    console.log(
        'login result:',
        result ? { ...result /* hide sensitive if any */ } : null,
    );
})();
