const { ErrorResponse } = require("../core/reponseHandle");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const verifyUser = (req, res, next) => {
  const token = req?.headers?.authorization?.split(" ")[1];

  if (!token) {
    throw new ErrorResponse({
      message: "Token is required",
      code: 401,
    });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      return next(err);
    }

    req.user = decode;
    next();
  });
};

module.exports = verifyUser;
