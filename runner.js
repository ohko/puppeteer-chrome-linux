const puppeteer = require('puppeteer');
const axios = require("axios")

const runner = async (task) => {
   let browser
   let defaultTask = {
      "ws": "",
      "browserArgs": {
         "headless": true,
         "args": ["--no-sandbox", "--proxy-server-(remove this)=socks5://127.0.0.1:1080"],
      },
      "viewport": { "width": 1024, "height": 768 },
      "timeout": 0,
      "userAgent": "",
      "action": {
         "url": "",
         "options": {},
         "steps": []
      }
   }
   task = Object.assign(defaultTask, task)

   if (task.action.url == "") return { no: 1, data: "url is empty" }
   if (task.action.steps.length == 0) return { no: 1, data: "not found steps" }

   try {
      // init
      browser = task.ws ? await puppeteer.connect({ browserWSEndpoint: task.ws }) : await puppeteer.launch(task.browserArgs);
      const page = task.ws ? (await browser.pages()).shift() : await browser.newPage();

      // setting
      await page.setViewport(task.viewport)
      task.timeout > 0 && await page.setDefaultNavigationTimeout(task.timeout)
      task.userAgent && await page.setUserAgent(task.userAgent)

      // steps
      await page.goto(task.action.url, task.action.options);

      let result
      for (let i = 0; i < task.action.steps.length; i++) {
         const step = task.action.steps[i];
         console.log("===== STEP:", (i + 1), "=====\n", step)

         step.waitText && await page.waitForFunction(step => {
            try { return document.documentElement.outerHTML.match(new RegExp(step.waitText)) } catch (e) { return null }
         }, {}, step)
         step.waitSelector && await page.waitForSelector(step.waitSelector)

         result = step.js ? await page.evaluate(step.js) : await page.content()
      }
      return { no: 0, data: result }
   } catch (e) {
      return { no: 1, data: e.message ? e.message : e }
   } finally {
      if (browser) {
         // close
         task.ws || await browser.close();
      }
   }
};

const taskFull = async () => {
   let ws
   try { ws = (await axios.get('http://127.0.0.1:9222/json/version')).data.webSocketDebuggerUrl } catch (e) { }
   return {
      "ws": ws,
      "browserArgs": {
         "headless": false,
         "args": ["--no-sandbox", "--proxy-server-(remove this)=socks5://127.0.0.1:1080"],
      },
      "viewport": { "width": 1920, "height": 1066 },
      "timeout": 30000,
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
      "action": {
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
   }
}

const taskSimple = async () => {
   return {
      "browserArgs": { "args": ["--no-sandbox"] },
      "action": {
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
   }
}

module.exports = { runner, taskFull, taskSimple }