#!/usr/bin/env node
// ./node_modules/puppeteer/.local-chromium/mac-674921/chrome-mac/Chromium.app/Contents/MacOS/Chromium --remote-debugging-port=9222 --proxy-server=socks5://127.0.0.1:1080

const { runner, taskFull, taskSimple } = require("./runner");

(async () => {
   const result = await runner(taskSimple);
   // const result = await runner(taskFull);
   console.log("RESULT:", result ? result.length : result)
   process.exit()
})();

