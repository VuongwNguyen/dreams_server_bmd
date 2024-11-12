var createError = require("http-errors");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var helmet = require("helmet");
const { app, firebase } = require("./socket");
const express = require("express");

const database = require("./config/connectToDatabase");
const { getMessaging } = require("firebase-admin/messaging");

// app configuration
app.use(helmet());
app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/api", require("./routes"));
app.get("/", async (req, res) => {
  res.json({
    status: true,
    message: "Welcome to the API of Dreams Social Network",
    data: null,
  });
});

// test
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/view/index.html"));
});

// connect to database
database.connect();

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error("Not found");
  err.code = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.code || 500).json({
    message: err.message,
    status: err.status,
  });
  console.log(err.stack);
});
