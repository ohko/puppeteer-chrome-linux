#!/usr/bin/env node

const express = require("express");
const bodyParser = require('body-parser')
const { runner, taskFull, taskSimple } = require("./runner");

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.send(`
<form method="POST" action="/run" target="_blank">
<textarea name="task" style="width:500px;height:300px;">${JSON.stringify(await taskSimple(), true, 2)}</textarea>
<input type="submit" value="SIMPLE">
</form>
<form method="POST" action="/run" target="_blank">
<textarea name="task" style="width:500px;height:300px;">${JSON.stringify(await taskFull(), true, 2)}</textarea>
<input type="submit" value="FULL">
</form>
  `)
});

app.post("/run", async (req, res) => {
  const result = await runner(JSON.parse(req.body.task));
  return res.json(result);
});

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);