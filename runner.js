const puppeteer = require('puppeteer');

const runner = async (task) => {
   // init
   const browser = task.ws ? await puppeteer.connect({ browserWSEndpoint: task.ws }) : await puppeteer.launch(task.browserArgs);
   const page = task.ws ? (await browser.pages()).shift() : await browser.newPage();

   // setting
   await page.setViewport(task.viewport || { width: 1920, height: 1066 })
   task.timeout && await page.setDefaultNavigationTimeout(task.timeout)
   task.userAgent && await page.setUserAgent(task.userAgent)

   // steps
   let options = task.actions.options || {}
   await page.goto(task.actions.url, options);

   for (let i = 0; i < task.actions.steps.length; i++) {
      const step = task.actions.steps[i];
      // await task.actions.steps.forEach(async (step) => {
      // console.log("===== STEP:", (i + 1), "=====\n", step)
      step.waitText && await page.waitForFunction(step => { return document.documentElement.outerHTML.match(new RegExp(step.waitText)) }, {}, step)
      step.waitSelector && await page.waitForSelector(step.waitSelector)
      const result = await page.evaluate(step.js)
      if (i == task.actions.steps.length - 1) return result
      // })
   }

   // close
   task.ws || await browser.close();
};


const taskFull =
{
   "ws": "ws://127.0.0.1:9222/devtools/browser/29ad7062-4212-44e2-8267-23d8f0f32714",
   "browserArgs": {
      "headless": true,
      "args": ["--proxy-server=socks5://127.0.0.1:1080"],
   },
   "viewport": { "width": 1920, "height": 1066 },
   "timeout": 30000,
   "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
   "actions": {
      "url": "https://www.baidu.com",
      "options": { "timeout": 30000, "waitUntil": "load", "referer": "" },
      "steps": [
         {
            "timeout": 30000,
            "waitSelector": "#kw",
            "js": "document.getElementById(\"kw\").value=\"baidu\";document.getElementById(\"su\").click()"
         },
         {
            "timeout": 30000,
            "waitText": "全球最大的中文搜索引擎",
            "js": "(_=>{let hrefs=[];let a=document.getElementsByTagName(\"a\");for(var i=0;i<a.length;i++) hrefs.push(a[i].href);return hrefs;})()"
         }
      ]
   }
};

const taskSimple =
{
   "actions": {
      "url": "https://www.baidu.com",
      "steps": [
         {
            "waitSelector": "#kw",
            "js": "document.getElementById(\"kw\").value=\"baidu\";document.getElementById(\"su\").click()"
         },
         {
            "waitText": "全球最大的中文搜索引擎",
            "js": "(_=>{let hrefs=[];let a=document.getElementsByTagName(\"a\");for(var i=0;i<a.length;i++) hrefs.push(a[i].href);return hrefs;})()"
         }
      ]
   }
};

module.exports = { runner, taskFull, taskSimple }