const { spawn } = require('child_process');
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

setInterval(async () => {
    startApp();
}, 3 * 60 * 60 * 1000); // 3 giờ = 10800000 ms
