#!/usr/bin/env node

const { runner, taskFull, taskSimple } = require("./runner");

(async _ => {

   await (async _ => {
      console.log("===== Simple =====")
      const result = await runner(await taskSimple());
      console.log("RESULT:", result)
   })();

   // sleep
   (async _ => {
      await new Promise(x => setTimeout(x, 2000))
   })();

   await (async _ => {
      console.log("===== Full =====")
      const result = await runner(await taskFull());
      console.log("RESULT:", result)
   })();

   console.log("done");
   process.exit()
})();
