var express = require("express");
var app = express();
var admin = require("firebase-admin");
var http = require("http");
const jwt = require("jsonwebtoken");
const { Account } = require("./models");
const User = require("./models/AccountModel");
const Follow = require("./models/FollowModel");

// const { Queue } = require("bullmq");

// const notificationQueue = new Queue("notifications");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

var server = http.createServer(app);

const { Server } = require("socket.io");

const io = new Server(server);

const usersOnline = {};

io.use(function (socket, next) {
  const token = socket.handshake.auth.token;
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return next(err);
    }
    socket.user = decoded;
    next();
  });
});

io.on("connection", (socket) => {
  usersOnline[socket.id] = socket.user.user_id;
  console.log(`user ${usersOnline[socket.id]} connected`);
  console.log(`list of user`, usersOnline);

  // io.except(socket.id).emit("user-online", usersOnline[socket.id]);

  socket.on("hello", () => {
    console.log(Date.now());
    socket.emit("hello");
  });

  socket.on("mock", async () => {
    const users = await User.find().lean();
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (users[i]._id.toString() === users[j]._id.toString()) continue;

        await Follow.create({
          follower: users[i]._id,
          following: users[j]._id,
        });
      }
    }

    console.log("create complete");
  });

  socket.on("disconnect", () => {
    console.log(`user ${usersOnline[socket.id]} disconnected`);
    io.emit("user-disconnect", usersOnline[socket.id]);
    delete usersOnline[socket.id];
  });
});

module.exports = {
  app,
  server,
  io,
  firebase: admin,
};
