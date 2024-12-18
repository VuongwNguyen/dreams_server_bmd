const { ErrorResponse } = require("../core/reponseHandle");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { Account } = require("../models");
const set = new Set();

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
      err.code = 401;
      return next(err);
    }

    req.user = decode;

    if (set.has(req.user.user_id)) {
      return next(
        new ErrorResponse({
          message: "You are banned",
          code: 403,
        })
      );
    }

    next();
  });
};

const verifyAdmin = async (req, res, next) => {
  try {
    const { user_id } = req.user;

    // Find the user with the role 'admin' or 'superadmin'
    const checkAdmin = await Account.findById(user_id)
      .where({
        role: { $in: ["admin", "superadmin"] },
      })
      .lean();

    if (!checkAdmin) {
      return next(
        new ErrorResponse({
          message: "You are not admin",
          code: 401,
        })
      );
    }

    next();
  } catch (err) {
    next(err); // Pass the error to the next middleware
  }
};

const verifySuperAdmin = (req, res, next) => {
  const { user_id } = req.user;
  const checkSuperAdmin = Account.findById(user_id).where({
    role: "superadmin",
  });

  if (!checkSuperAdmin) {
    return new ErrorResponse({
      message: "You are not super admin",
      code: 403,
    }).json(res);
  }
  next();
};

module.exports = { verifyUser, verifyAdmin, verifySuperAdmin, set };
