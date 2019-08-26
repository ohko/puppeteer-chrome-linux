const puppeteer = require('puppeteer');
const axios = require("axios")

const runner = async (script) => {
   let logs = []
   try {
      const result = await eval(`(async _=>{` + script + `})()`)
      return { no: 0, data: result, logs: logs }
   } catch (e) {
      return { no: 1, data: e.message ? e.message : e, logs: logs }
   }
};

const taskFull = async () => {
   return `// 复杂案例: 查询baidu的股价

// 查找已有的ws
let ws
try { ws = (await axios.get('http://127.0.0.1:9222/json/version')).data.webSocketDebuggerUrl } catch (e) { }

// 初始化
const browser = ws ?
   await puppeteer.connect({ browserWSEndpoint: ws }) :
   await puppeteer.launch({
      headless:false,
      args:["--no-sandbox", "--proxy-server-(remove this)=socks5://127.0.0.1:1080"]
   });
const ps = await browser.pages()
const page = ps.length ? ps.shift() : await browser.newPage();
await page.goto("about:blank")

// 设置
await page.setViewport({width:1024, height:768})
await page.setDefaultNavigationTimeout(3000)
await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36")

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
// 如果是链接已有的ws，就不关闭
ws || await page.close()
ws || await browser.close()

// 返回
return rs
`
}

const taskSimple = async () => {
   return `// 简单案例: 查询apple的股价

// 初始化
const browser = await puppeteer.launch({args:["--no-sandbox"]});
const page = await browser.newPage();

logs.push("START: https://bing.com")
// 打开bing
await page.goto("https://bing.com", {waitUntil:"domcontentloaded"})

logs.push("STEP1: 搜索'apple stock price'")
// 等待搜索输入框
await page.waitForSelector(".b_searchbox")
// 输入搜索词，点击搜索
await page.evaluate("const x=document.querySelector('.b_searchbox');x.value='apple stock price';x.form.submit()")

logs.push("STEP2: 查找'NASDAQ: AAPL'")
// 等待股价关键词
await page.waitForFunction(step => {
   try {return document.documentElement.outerHTML.match(/NASDAQ: AAPL/)} 
   catch (e) { return null }
})
// 返回股价信息
const rs = await page.evaluate("(_=>{return document.querySelector('.b_focusTextMedium').textContent})()")

logs.push("STEP3: 股价 " + rs)
// 关闭
await page.close()
await browser.close()

// 返回
return rs
`}

module.exports = { runner, taskFull, taskSimple }