#!/usr/bin/env node

const express = require("express");
const bodyParser = require('body-parser')
const { runner, taskFull, taskSimple } = require("./runner");

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static("./public"))

app.get("/demo.json", async (req, res) => {
  res.send({ "simple": JSON.stringify(await taskSimple(), true, 2), "full": JSON.stringify(await taskFull(), true, 2) })
});

app.post("/run", async (req, res) => {
  const result = await runner(JSON.parse(req.body.task));
  return res.json(result);
});

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);