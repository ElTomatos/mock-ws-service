const WebSocket = require("ws");
const express = require("express");
const app = express();
const path = require("path");
const bp = require("body-parser");

app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use("/", express.static(path.resolve(__dirname, "../client")));

app.use(function (error, req, res, next) {
  if (error instanceof SyntaxError) {
    res.status(400);
    res.send({ error: 'Invalid JSON'});
  } else {
    next();
  }
});

const myServer = app.listen(9876);

const wsServer = new WebSocket.Server({ port: 1337 });

wsServer.on("connection", function onConnect(wsClient) {
  wsClient.on("message", function (message) {
    try {
      const { id } = JSON.parse(message);
      wsClient.send(
        JSON.stringify({
          id,
          result: {},
        })
      );
    } catch (e) {}
  });
  wsClient.on("close", function () {
    console.log("Used disconnected");
  });
  wsClient.onerror = function () {
    console.log("Some Error occurred");
  };
});

app.post("/send-sms", (req, res) => {
  res.json({ status: "ok" });

  wsServer.clients.forEach(function each(client) {
    client.send(JSON.stringify(req.body));
  });
});

myServer.on("upgrade", async function upgrade(request, socket, head) {
  wsServer.handleUpgrade(request, socket, head, function done(ws) {
    wsServer.emit("connection", ws, request);
  });
});
