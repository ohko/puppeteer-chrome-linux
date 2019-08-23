#!/usr/bin/env node

const { runner, taskFull, taskSimple } = require("./runner");

(async () => {
   const result = await runner(await taskSimple());
   // const result = await runner(await taskFull());
   console.log("RESULT:", result.data)
   console.log("LOGS:\n", result.logs.join("\n"))
   process.exit()
})();

