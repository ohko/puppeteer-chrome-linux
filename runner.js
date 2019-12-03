const puppeteer = require('puppeteer');
const axios = require("axios")

const runner = async (script, replaceSlant = true) => {
   let logs = []
   try {
      const result = await eval(`(async _=>{` + (replaceSlant ? script.replace(/\\/g, "\\\\") : script) + `})()`)
      return { no: (result === undefined ? 1 : 0), data: result, logs: logs }
   } catch (e) {
      e = e || {}
      return { no: 1, data: e.message ? e.message : e, logs: logs }
   }
};

const functionToString = f => {
   const x = f.toString()
   const main = x.substring(x.indexOf("{") + 2, x.lastIndexOf("}"))
   const space = main.substr(0, main.indexOf("/"))
   return main.replace(new RegExp("^" + space, "gm"), "")
}

const taskFull = async () => {
   return functionToString(async _ => {
      // 复杂案例: 查询baidu的股价

      // 查找已有的ws
      let ws
      try { ws = (await axios.get('http://127.0.0.1:9222/json/version')).data.webSocketDebuggerUrl } catch (e) { }

      // 初始化
      const width = 1024, height = 768
      const iPhone = puppeteer.devices['iPhone X'];
      const browser = ws ?
         await puppeteer.connect({ browserWSEndpoint: ws }) :
         await puppeteer.launch({
            headless: false, // 有头
            devtools: false, // 开发工具
            slowMo: 100, // 放慢速度，headless=false才有效
            ignoreHTTPSErrors: true, // 忽略SSL检查
            defaultViewport: { width, height }, // 页面尺寸
            args: ["--no-sandbox", "--disable-setuid-sandbox", `--window-size=${width},${height}`, "--proxy-server-(remove this)=socks5://127.0.0.1:1080"]
         });
      const ps = await browser.pages()
      const page = ps.length ? ps.shift() : await browser.newPage();
      await page.emulate(iPhone);
      await page.goto("about:blank")
      let rs;

      try {
         // 设置
         await page.setDefaultTimeout(30000)
         await page.setDefaultNavigationTimeout(30000)
         await page.setViewport({ width, height })
         await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36")

         // console
         page.on('console', msg => {
            // for (let i = 0; i < msg.args().length; ++i) console.log(i, msg.args()[i]);
         });

         // 对话框
         page.on('dialog', async dialog => {
            console.log(dialog.message());
            await dialog.dismiss();
         });

         logs.push("START: https://www.baidu.com")
         // 打开baidu
         await page.goto("https://www.baidu.com")

         logs.push("STEP1: 搜索'百度股价'")
         // 等待搜索输入框
         await page.waitForSelector("#kw")
         // 输入搜索词，点击搜索
         await page.evaluate(_ => {
            var k = document.querySelector('#kw'); k.value = '百度股价'; k.form.submit()
         })

         logs.push("STEP2: 下一页")
         // 下一页
         await page.waitForSelector("#content_left")
         // 输入搜索词，点击搜索
         await page.evaluate(_ => {
            document.querySelector('#content_left').remove();
            document.querySelector('.n').click();
            return document.documentElement.outerHTML.match(/上一页/) ? 0 : 1
         })

         logs.push("STEP3: 上一页")
         // 上一页
         await page.waitForSelector("#content_left")
         // 输入搜索词，点击搜索
         await page.evaluate(_ => {
            document.querySelector('#content_left').remove();
            document.querySelector('.n').click();
            return document.documentElement.outerHTML.match(/上一页/) ? 0 : 1
         })

         logs.push("STEP4: 查找股价")
         // 等待股价关键词
         await page.waitForSelector(".op-stockdynamic-moretab-cur-num")
         // 返回股价信息
         rs = await page.evaluate(_ => {
            return document.querySelector('.op-stockdynamic-moretab-cur-num').textContent
         })

         logs.push("STEP5: 股价 " + rs)
      } catch (e) {
         e = e || {}
         logs.push(e.message || e)
      } finally {
         // 如果是链接已有的ws，就不关闭
         ws || await browser.close()

         // 返回
         return rs
      }
   })
}

const taskSimple = async () => {
   return functionToString(async _ => {
      // 简单案例: 查询apple的股价

      // 初始化
      const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
      const page = await browser.newPage();
      let rs;

      try {
         logs.push("START: https://www.baidu.com")
         // 打开baidu
         await page.goto("https://www.baidu.com", { waitUntil: "domcontentloaded" })

         logs.push("STEP1: 搜索'apple股票'")
         // 等待搜索输入框
         await page.waitForSelector("#kw")
         // 输入搜索词，点击搜索
         await page.evaluate(_ => {
            const x = document.querySelector('#kw'); x.value = 'apple股票'; x.form.submit()
         })

         logs.push("STEP2: 查找'AAPL'")
         // 等待股价关键词
         await page.waitFor(_ => {
            try { return !!document.documentElement.outerHTML.match(/AAPL/) }
            catch (e) { return false }
         })
         // 等待股价关键词
         await page.waitForSelector('.op-stockdynamic-moretab-cur-num')
         // 返回股价信息
         rs = await page.evaluate(_ => {
            return document.querySelector('.op-stockdynamic-moretab-cur-num').textContent
         })

         logs.push("STEP3: 股价 " + rs)
      } catch (e) {
         e = e || {}
         logs.push(e.message || e)
      } finally {
         // 关闭
         await browser.close()

         // 返回
         return rs
      }
   })
}

module.exports = { runner, taskFull, taskSimple }