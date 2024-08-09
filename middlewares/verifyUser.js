const { ErrorResponse } = require("../core/reponseHandle");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const secret_key = process.env.SECRET_KEY || "secret_key";

const verifyUser = (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];

  if (!token) {
    throw new ErrorResponse({
      message: "Token is required",
      code: 401,
    });
  }

  jwt.verify(token, secret_key, (err, decode) => {
    if (err) {
      next(err);
    }

    req.user = decode;
    next();
  });
};

module.exports = verifyUser;