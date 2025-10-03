require('dotenv').config();
const cron = require('node-cron');
const { clearAccountProcessed } = require('../common/helper');

cron.schedule('0 0 * * *', async () => {
    await clearAccountProcessed();
});
