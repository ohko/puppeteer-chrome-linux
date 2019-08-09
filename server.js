#!/usr/bin/env node

const express = require("express");
const bodyParser = require('body-parser')
const { runner, taskFull, taskSimple } = require("./runner");

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`
<form method="POST" action="/run" target="_blank">
<textarea name="task" style="width:500px;height:300px;">${JSON.stringify(taskSimple, true, 2)}</textarea>
<input type="submit" value="SIMPLE">
</form>
<form method="POST" action="/run" target="_blank">
<textarea name="task" style="width:500px;height:300px;">${JSON.stringify(taskFull, true, 2)}</textarea>
<input type="submit" value="FULL">
</form>
  `)
});

app.post("/run", async (req, res) => {
  try {
    const result = await runner(JSON.parse(req.body.task));
    return res.json({ no: 0, data: result });
  } catch (e) {
    return res.json({ no: 1, data: e });
  }
});

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);