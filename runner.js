const puppeteer = require('puppeteer');
const axios = require("axios")

const runner = async (script) => {
   let logs = []
   try {
      let ws, browser, page;
      // 查找已有的ws
      try { ws = (await axios.get('http://127.0.0.1:9222/json/version')).data.webSocketDebuggerUrl } catch (e) { }
      const result = await eval(`(async _=>{` + script.replace(/\\/g, "\\\\") + `})()`)
      try {
         page && page.close();
         if (!ws) {
            browser && browser.close();
         }
      } catch (e) {
         console.log(e)
      }
      return { no: 0, data: result, logs: logs }
   } catch (e) {
      return { no: 1, data: e.message ? e.message : e, logs: logs }
   }
};

const taskFull = async () => {
   return `// 复杂案例: 查询baidu的股价

// 初始化
browser = ws ?
   await puppeteer.connect({ browserWSEndpoint: ws }) :
   await puppeteer.launch({
      headless:false,
      devtools:true,
      args:["--no-sandbox", "--proxy-server-(remove this)=socks5://127.0.0.1:1080"]
   });
const ps = await browser.pages()
page = ps.length ? ps.shift() : await browser.newPage();
await page.goto("about:blank")
let rs = "";

try{
   // 设置
   await page.setDefaultTimeout(30000)
   await page.setDefaultNavigationTimeout(30000)
   await page.setViewport({width:1024, height:768})
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
   await page.evaluate("var k=document.querySelector('#kw');k.value='百度股价';k.form.submit()")

   logs.push("STEP2: 下一页")
   // 下一页
   await page.waitForSelector("#content_left")
   // 输入搜索词，点击搜索
   await page.evaluate("(_=>{document.querySelector('#content_left').remove();document.querySelector('.n').click(); return document.documentElement.outerHTML.match(/上一页/)?0:1})()")

   logs.push("STEP3: 上一页")
   // 上一页
   await page.waitForSelector("#content_left")
   // 输入搜索词，点击搜索
   await page.evaluate("(_=>{document.querySelector('#content_left').remove();document.querySelector('.n').click(); return document.documentElement.outerHTML.match(/上一页/)?0:1})()")

   logs.push("STEP4: 查找股价")
   // 等待股价关键词
   await page.waitForSelector(".op-stockdynamic-moretab-cur-num")
   // 返回股价信息
   const rs = await page.evaluate("(_=>{return document.querySelector('.op-stockdynamic-moretab-cur-num').textContent})()")

   logs.push("STEP5: 股价 " + rs)
}catch(e){
   logs.push(e.Message ? e.Message : e)
}finally{   
   // 返回
   return rs
}
`
}

const taskSimple = async () => {
   return `// 简单案例: 查询apple的股价

// 初始化
browser = await puppeteer.launch({args:["--no-sandbox"]});
page = await browser.newPage();
let rs = "";

try{
   logs.push("START: https://www.baidu.com")
   // 打开baidu
   await page.goto("https://www.baidu.com", {waitUntil:"domcontentloaded"})

   logs.push("STEP1: 搜索'apple股票'")
   // 等待搜索输入框
   await page.waitForSelector("#kw")
   // 输入搜索词，点击搜索
   await page.evaluate("const x=document.querySelector('#kw');x.value='apple股票';x.form.submit()")

   logs.push("STEP2: 查找'AAPL'")
   // 等待股价关键词
   await page.waitFor(_ => {
      try {return !!document.documentElement.outerHTML.match(/AAPL/)} 
      catch (e) { return false }
   })
   // 返回股价信息
   const rs = await page.evaluate("(_=>{return document.querySelector('.op-stockdynamic-moretab-cur-num').textContent})()")

   logs.push("STEP3: 股价 " + rs)
}catch(e){
   logs.push(e.Message ? e.Message : e)
}finally{   
   // 返回
   return rs
}
`}

module.exports = { runner, taskFull, taskSimple }