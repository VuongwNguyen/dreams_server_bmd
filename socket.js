var express = require("express");
var app = express();
var admin = require("firebase-admin");
var http = require("http");
const jwt = require("jsonwebtoken");
const { Account } = require("./models");

// const { Queue } = require("bullmq");

// const notificationQueue = new Queue("notifications");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

var server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server);

io.use(function (socket, next) {
  const token = socket.handshake.auth.token;
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error"));
      }
      socket.user_id = decoded;

      const account = await Account.findById(decoded);
      if (!account) {
        return next(new Error("Authentication error"));
      }
    });
  } else {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  console.log("a user connected");
});

module.exports = {
  app,
  server,
  io,
  firebase: admin,
};
