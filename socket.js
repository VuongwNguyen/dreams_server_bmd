var express = require("express");
var app = express();
var admin = require("firebase-admin");
var http = require("http");
const jwt = require("jsonwebtoken");
const { Account } = require("./models");
const User = require("./models/AccountModel");
const Follow = require("./models/FollowModel");
const Room = require("./models/RoomModel");

// const { Queue } = require("bullmq");

// const notificationQueue = new Queue("notifications");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

var server = http.createServer(app);

const { Server } = require("socket.io");
const MessageService = require("./services/Message.service");
const SendNotificationService = require("./services/SendNotification.service");

const io = new Server(server);

const usersOnline = {};
const sockets = {};

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
  usersOnline[socket.id] = {
    user_id: socket.user.user_id,
    socket_id: socket.id,
  };
  sockets[socket.user.user_id] = socket.id;

  io.except(socket.id).emit("user-online", usersOnline[socket.id]);

  socket.on("test", () => {
    console.log(Date.now());
    socket.emit("test");
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("leave-room", (roomId) => {
    socket.leave(roomId);
  });

  socket.on("get-user-status", (user_id) => {
    const status = Object.values(usersOnline).some(
      (user) => user.user_id === user_id
    );
    socket.emit("participant-status", status);
  });

  /**
   * @param mess: [Object] { images, replied_id, content }
   */

  socket.on("message", async (mess, roomId) => {
    try {
      let room = await Room.findOne({ _id: roomId });

      if (!room) {
        throw new Error("Room not found");
      }

      const message = await MessageService.createMessage({
        message: mess.content,
        replied_id: mess.replied_id,
        images: mess.images,
        author: usersOnline[socket.id].user_id,
        room_id: roomId,
      });

      await room.populate("members.account_id", "first_name last_name avatar");
      room = room.toObject();
      room.members = room.members.map((item) => {
        return {
          _id: item.account_id._id,
          avatar: item.account_id?.avatar?.url,
          fullname: `${item.account_id?.first_name} ${item.account_id?.last_name}`,
        };
      });

      delete room.__v;
      delete room.createdAt;
      delete room.updatedAt;

      // emit event to room
      io.to(roomId).emit("message", message);

      const offlines = [];

      // update room
      room.members.forEach((mem) => {
        if (!sockets[mem._id.toString()]) {
          offlines.push(mem._id.toString());
        }

        io.to(sockets[mem?._id?.toString()]).emit("update-room", message, room);
      });

      // handle push notification with offlines
      offlines.length > 0 &&
        (await MessageService.sendMessageNotification(offlines, room._id));
    } catch (e) {
      console.log("message group: ", e);
    }
  });

  socket.on("disconnect", () => {
    console.log(`user ${usersOnline[socket.id].user_id} disconnected`);
    io.emit("user-disconnect", usersOnline[socket.id]);
    delete usersOnline[socket.id];
    delete sockets[socket.user.user_id];
  });
});

module.exports = {
  app,
  server,
  io,
  usersOnline,
  sockets,
};
