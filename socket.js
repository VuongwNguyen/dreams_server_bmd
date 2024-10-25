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
const RoomService = require("./services/Room.service");
const MessageService = require("./services/Message.service");

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
  usersOnline[socket.id] = {
    user_id: socket.user.user_id,
    socket_id: socket.id,
  };
  console.log(`user ${usersOnline[socket.id]} connected`);
  console.log(`list of user`, usersOnline);

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

  /**
   * @param mess: [Object] { images, replied_id, content }
   */

  socket.on("direct-message", async (mess, participant) => {
    try {
      let room;

      room = await RoomService.getDirectRoom({
        members: [usersOnline[socket.id].user_id, participant],
      });

      if (!room) {
        room = await RoomService.createDirectRoom({
          members: [usersOnline[socket.id].user_id, participant],
        });

        room.isNewRoom = true;
      }

      const message = await MessageService.createMessage({
        message: mess.content,
        replied_id: mess.replied_id,
        images: mess.images,
        author: usersOnline[socket.id].user_id,
        room_id: room._id,
      });

      io.to(room._id.toString()).emit("message", message);

      if (room.isNewRoom) {
        const user = Object.values(usersOnline).find(
          (us) => us.user_id === participant
        );
        io.to([user.socket_id, socket.id]).emit("new-room", room, message);
      }

      const onlines = await io.in(room._id.toString()).fetchSockets();

      const onlineUserIds = new Set(
        onlines.map((online) => usersOnline[online.id]?.user_id)
      );

      const offlines = [];
      const onlinesButNotInRoom = [];

      [usersOnline[socket.id].user_id, participant].forEach((userId) => {
        const isInRoom = onlineUserIds.has(userId.toString());

        if (!isInRoom) {
          const userOnline = Object.values(usersOnline).find(
            (user) => user.user_id === userId.toString()
          );

          if (!userOnline) {
            offlines.push(userId);
          } else {
            onlinesButNotInRoom.push(userOnline.socket_id);
          }
        }

        // handle push notification

        // emit event
      });
    } catch (e) {
      console.log("error message: ", e);
    }
  });

  socket.on("group-message", async (mess, roomId) => {
    try {
      const room = await Room.findOne({ _id: roomId }).lean();

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

      io.to(roomId).emit("message", message);

      // fetch all socket instance in room
      const onlines = await io.in(roomId).fetchSockets();

      // array of user
      const offlines = [];

      // array of socket id
      const onlinesButNotInRoom = [];

      const onlineUserIds = new Set(
        onlines.map((online) => usersOnline[online.id]?.user_id)
      );

      room.members.forEach((member) => {
        const memberUserId = member.account_id.toString();

        if (!onlineUserIds.has(memberUserId)) {
          const userOnline = Object.values(usersOnline).find(
            (user) => user.user_id === memberUserId
          );

          if (!userOnline) {
            offlines.push(memberUserId);
          } else {
            onlineUserIds.push(userOnline.socket_id);
          }
        }
      });

      // handle push notification with offlines

      // emit event to update list room with onlineButNotInRoom
      io.to(onlinesButNotInRoom).emit("update-room-list", roomId, message);
    } catch (e) {
      console.log("message group: ", e);
    }
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
  usersOnline,
};
