#!/usr/bin/env node

const express = require("express");
const bodyParser = require('body-parser')
const { runner, taskFull, taskSimple } = require("./runner");

const app = express();
const port = process.env.PORT || 8080;

app.use(function (req, res, next) {
  res.setTimeout(600000, function () {
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
  const result = await runner(req.body.task);
  return res.json(result);
});

app.listen(port, () =>
  console.log(`Example app listening on port ${port}!`)
);