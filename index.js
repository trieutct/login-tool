const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent'); // import đúng
const GET_CAPTCHA_URL_API = 'http://157.66.47.38:5000';

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
    let captchaText = '';
    try {
        const res = await axios.post(
            // `${GET_CAPTCHA_URL_API}/get-base64-by-color`,
            `${GET_CAPTCHA_URL_API}/upload-login`,
            {
                image: "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",
                message: 'red',
            },

            { timeout: 120000, headers: { 'Content-Type': 'application/json' } },
        );

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
    const start = performance.now(); // ⏱️ bắt đầu đo
    const result = await login();
    const end = performance.now(); // ⏱️ kết thúc đo

    console.log(
        'login result:',
        result ? { ...result } : null,
    );

    console.log(`⏰ Thời gian thực thi: ${(end - start) / 1000}s`);
})();

