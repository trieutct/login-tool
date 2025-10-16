const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');

// theo bản của app1 thì là 305s

// const GET_CAPTCHA_URL_API = 'http://157.66.47.38:5001';//36s
const GET_CAPTCHA_URL_API = 'http://160.191.87.227:5000'; //117s

const warn = (...args) => console.warn(...args);
const error = (...args) => console.error(...args);

const login = async () => {
    let captchaText = '';
    try {
        const res = await axios.post(
            `${GET_CAPTCHA_URL_API}/upload`,
            {
                image:"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",
                message: 'red',
            },
            { headers: { 'Content-Type': 'application/json' } },
        );

        captchaText = res.data?.message || res.data?.text || '';
        if (!captchaText) throw new Error('Captcha decode failed');
        return { captchaText };
    } catch (err) {
        error(`❌ Captcha decoding error: ${err}`);
        return null;
    }
};

(async () => {
    const tasks = Array.from({ length: 100 }, (_, i) => (async () => {
        const id = uuidv4();
        const start = performance.now();
        const result = await login();
        const end = performance.now();
        console.log(`✅ [${id}] Result:`, result);
        console.log(`⏰ [${id}] Thời gian thực thi: ${(end - start).toFixed(2)}ms`);
        return result;
    })());

    await Promise.all(tasks);
    console.log('🎉 Hoàn tất 100 lần gọi login!');
})();
