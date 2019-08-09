#!/usr/bin/env node

const { runner, taskFull, taskSimple } = require("./runner");

(async () => {
   const result = await runner(await taskSimple());
   // const result = await runner(await taskFull());
   console.log("RESULT:", result.no == 0 ? result.data.length : result.data)
   process.exit()
})();

