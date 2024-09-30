var express = require("express");
var app = express();
var admin = require("firebase-admin");

// const { Queue } = require("bullmq");

// const notificationQueue = new Queue("notifications");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

var http = require("http");
var server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server);

io.on("connection", (socket) => {
  console.log("a user connected");
});

module.exports = {
  app,
  server,
  io,
  firebase: admin,
};
