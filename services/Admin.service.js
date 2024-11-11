const bcrypt = require("bcryptjs/dist/bcrypt");
const { ErrorResponse } = require("../core/reponseHandle");
const { Account } = require("../models");
const { generateTokens } = require("./token.service");

class AdminService {
  async loginAdmin({ email, password }) {
    const user = await Account.findOne({
      email,
      $or: [{ role: "admin" }, { role: "superadmin" }],
    });

    if (!user)
      throw new ErrorResponse({
        message: "Username or password is incorrect",
        code: 400,
      });

    const checkPassword = bcrypt.compareSync(password, user.password);

    if (!checkPassword)
      throw new ErrorResponse({
        message: "Username or password is incorrect",
        code: 400,
      });

    if (!user.isVerified)
      throw new ErrorResponse({
        message: "User is not verified",
        code: 401,
      });

    const tokens = generateTokens({ user_id: user._id });

    return {
      ...tokens,
      role: user.role,
      avatar: user.avatar.url,
      fullname: `${user.first_name} ${user.last_name}`,
    };
  }

  async registerAdmin({ email, first_name, last_name }) {
    const user = await Account.findOne({
      email,
    });

    if (user)
      throw new ErrorResponse({
        message: "Email is already taken",
        code: 400,
      });

    const newUser = new Account({
      email,
      password: bcrypt.hashSync(password, 10),
      first_name,
      last_name,
      role: "admin",
    });

    await newUser.save();

    return {
      message: "Register successfully",
    };
  }
}

module.exports = new AdminService();
