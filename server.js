#!/usr/bin/env node

const express = require("express");
const bodyParser = require('body-parser')
const { runner, taskFull, taskSimple } = require("./runner");

const app = express();
const port = process.env.PORT || 8080;
let RequestTimeout = parseInt(process.env.TIMEOUT) || 120000;

app.use(function (req, res, next) {
  res.setTimeout(RequestTimeout, function () {
    console.log('Request has timed out.');
    res.send(408);
  });
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", express.static("./public"))

app.get("/demo.json", async (req, res) => {
  res.send({ "simple": await taskSimple(), "full": await taskFull() })
});

app.post("/run", async (req, res) => {
  const script = req.body;
  if (script.timeout) res.setTimeout(script.timeout)
  const result = await runner(script.task);
  return res.json(result);
});

app.get("/timeout", async (req, res) => {
  const timeout = parseInt(req.query.timeout);
  if (timeout) RequestTimeout = timeout
  return res.send(String(RequestTimeout));
});

app.listen(port, () => {
  console.log("Request Timeout:", RequestTimeout)
  console.log(`Example app listening on port ${port}!`)
});