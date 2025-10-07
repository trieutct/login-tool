const { spawn } = require('child_process');
const cron = require('node-cron');

let child;
async function startApp() {
    if (child) {
        child.kill();
        child = null;
    }

    // Spawn lại app
    child = spawn('node', ['tool.js'], { stdio: 'inherit' });
}

// Chạy lần đầu ngay khi start scheduler
startApp();

cron.schedule("0 */2 * * *", () => {
    startApp();
});
