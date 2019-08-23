const puppeteer = require('puppeteer');
const axios = require("axios")

const runner = async (task) => {
   let browser, logs = []
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

   if (task.action.url == "") return { no: 1, data: "url is empty", logs: logs }
   if (task.action.steps.length == 0) return { no: 1, data: "not found steps", logs: logs }

   try {
      // init
      browser = task.ws ? await puppeteer.connect({ browserWSEndpoint: task.ws }) : await puppeteer.launch(task.browserArgs);
      const ps = await browser.pages()
      const page = ps.length ? ps.shift() : await browser.newPage();

      // setting
      await page.setViewport(task.viewport)
      task.timeout > 0 && await page.setDefaultNavigationTimeout(task.timeout)
      task.userAgent && await page.setUserAgent(task.userAgent)

      // steps
      console.log("===== START:", task.action.url, "=====")
      logs.push("START: " + task.action.url)
      await page.goto(task.action.url, task.action.options);

      let result
      for (let i = 0; i < task.action.steps.length; i++) {
         const step = task.action.steps[i];
         console.log("----- STEP:", (i + 1), "-----\n" + JSON.stringify(step, "", 2))
         logs.push("STEP." + (i + 1) + ": " + JSON.stringify(step))

         step.waitText && await page.waitForFunction(step => {
            try { return document.documentElement.outerHTML.match(new RegExp(step.waitText)) } catch (e) { return null }
         }, {}, step)
         step.waitSelector && await page.waitForSelector(step.waitSelector)

         // 死循环，直到返回0
         if (step.while) {
            let count = 0
            console.log("----- SUB START -----")
            logs.push("SUB START:")
            const subSteps = step.while;
            while (result !== 0) {
               count++
               for (let j = 0; j < subSteps.length; j++) {
                  const subStep = subSteps[j];
                  console.log("----- SUB STEP:", count + "-" + (j + 1), "-----\n" + JSON.stringify(subStep, "", 2))
                  logs.push("SUB STEP." + count + "-" + (j + 1) + ": " + JSON.stringify(subStep))
                  subStep.waitText && await page.waitForFunction(subStep => {
                     try { return document.documentElement.outerHTML.match(new RegExp(subStep.waitText)) } catch (e) { return null }
                  }, {}, subStep)
                  subStep.waitSelector && await page.waitForSelector(subStep.waitSelector)
                  result = subStep.js ? await page.evaluate(subStep.js) : await page.content()
                  if (result === 0) break
               }
            }
         }

         result = step.js ? await page.evaluate(step.js) : await page.content()
      }
      return { no: 0, data: result, logs: logs }
   } catch (e) {
      return { no: 1, data: e.message ? e.message : e, logs: logs }
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
         "slowMo": 100,
         "headless": false,
         "args": ["--no-sandbox", "--proxy-server-(remove this)=socks5://127.0.0.1:1080"],
      },
      "viewport": { "width": 1920, "height": 1066 },
      "timeout": 30000,
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36",
      "action": {
         "url": "https://bing.com",
         "options": { "waitUntil": "domcontentloaded", "referer": "" },
         "steps": [
            {
               "waitSelector": ".b_searchbox",
               "js": "document.querySelector('.b_searchbox').value='apple stock price';document.querySelector('.b_searchbox').form.submit()"
            },
            {
               "waitText": "NASDAQ: AAPL",
               "waitSelector": ".b_focusTextMedium",
               "js": "(_=>{return document.querySelector('.b_focusTextMedium').textContent})()"
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
               "js": "var k=document.querySelector('#kw');k.value='百度股价';k.form.submit()"
            },
            {
               "while": [
                  {
                     "waitSelector": "#content_left",
                     "js": "(_=>{document.querySelector('#content_left').outerHTML = '';document.querySelector('.n').click(); return document.documentElement.outerHTML.match(/上一页/)?0:1})()"
                  }
               ]
            },
            {
               "waitText": "[BIDU]",
               "waitSelector": ".op-stockdynamic-moretab-cur-num",
               "js": "(_=>{return document.querySelector('.op-stockdynamic-moretab-cur-num').textContent})()"
            }
         ]
      }
   }
}

module.exports = { runner, taskFull, taskSimple }