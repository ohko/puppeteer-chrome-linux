const puppeteer = require('puppeteer');
const axios = require("axios")

const runner = async (task) => {
   let browser
   try {
      // init
      browser = task.ws ? await puppeteer.connect({ browserWSEndpoint: task.ws }) : await puppeteer.launch(task.browserArgs);
      const page = task.ws ? (await browser.pages()).shift() : await browser.newPage();

      // setting
      await page.setViewport(task.viewport || { width: 1920, height: 1066 })
      task.timeout && await page.setDefaultNavigationTimeout(task.timeout)
      task.userAgent && await page.setUserAgent(task.userAgent)

      // steps
      let options = task.action.options || {}
      await page.goto(task.action.url, options);

      for (let i = 0; i < task.action.steps.length; i++) {
         const step = task.action.steps[i];
         console.log("===== STEP:", (i + 1), "=====\n", step)

         step.waitText && await page.waitForFunction(step => {
            // document.documentElement.outerHTML
            // document.children[0].outerHTML
            // document.body.outerHTML
            return document.children[0].outerHTML.match(new RegExp(step.waitText))
         }, {}, step)
         step.waitSelector && await page.waitForSelector(step.waitSelector)

         const result = await page.evaluate(step.js || "(_=>{return document.children[0].outerHTML})()")
         if (i == task.action.steps.length - 1) return { no: 0, data: result }
      }

      return { no: 1, data: "not found steps" }
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