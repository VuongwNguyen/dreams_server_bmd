const bcrypt = require("bcryptjs/dist/bcrypt");
const { ErrorResponse } = require("../core/reponseHandle");
const { Account } = require("../models");
const { generateTokens } = require("./token.service");
const sendmail = require("../mail/sendmail");
const SendSecretPassword = require("../mail/option/SendSecretPassword");
const SendNotifyMakeAdmin = require("../mail/option/SendNotifyMakeAdmin");

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

    const tokens = generateTokens({ user_id: user._id });

    return {
      ...tokens,
      role: user.role,
      avatar: user.avatar.url,
      fullname: `${user.first_name} ${user.last_name}`,
    };
  }

  async registerAdmin({ user_id, email, first_name, last_name }) {
    if (!email || !first_name || !last_name)
      throw new ErrorResponse({
        message: "Please fill in all fields",
        code: 400,
      });

    const checkEmail = await Account.findOne({ email });
    const admin = await Account.findById(user_id);

    if (checkEmail && checkEmail?.role === "user") {
      checkEmail.role = "admin";
      checkEmail.save();
      sendmail(
        SendNotifyMakeAdmin({
          mail: checkEmail.email,
          user: `${checkEmail.first_name} ${checkEmail.last_name}`,
          admin: `${admin.first_name} ${admin.last_name}`,
          role: admin.role,
          newRole: checkEmail.role,
        })
      );
      return {
        message: "make admin successfully",
      };
    } else if (checkEmail && checkEmail?.role === "admin") {
      throw new ErrorResponse({
        message: "Email is already exist",
        code: 400,
      });
    } else {
      const password = Math.random().toString(36).slice(-8);
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(password, salt);

      const newUser = await Account.create({
        email,
        first_name,
        last_name,
        password: hashPassword,
        role: "admin",
      });

      await sendmail(
        SendSecretPassword({
          mail: newUser.email,
          password: password,
          user: `${newUser.first_name} ${newUser.last_name}`,
          admin: `${admin.first_name} ${admin.last_name}`,
          role: admin.role,
        })
      );
      return {
        message: "create admin successfully",
      };
    }
  }

  async getAdmins({ user_id, _page, _limit }) {
    if (!_page || _page < 1) _page = 1;
    if (!_limit || _limit < 1) _limit = 10;
    const total = await Account.countDocuments({
      role: { $in: ["admin", "superadmin"] },
    });

    const data = await Account.find({ role: { $in: ["admin", "superadmin"] } })
      .sort({ role: -1 })
      .select("email role first_name last_name avatar.url")
      .skip((+_page - 1) * _limit)
      .limit(+_limit)
      .lean();

    data.forEach((item) => {
      item.fullname = `${item.first_name} ${item.last_name}`;
      item.avatar = item.avatar.url;
      delete item.first_name;
      delete item.last_name;
      item._id.toString() === user_id
        ? (item.isMe = true)
        : (item.isMe = false);
    });

    return {
      list: data,
      page: {
        max: Math.ceil(total / _limit),
        prev: _page > 1,
        next: data.length === _limit,
        limit: +_limit,
        current: +_page,
      },
    };
  }

  async revokeAdmin({ user_id, admin_id }) {
    if (user_id === admin_id)
      throw new ErrorResponse({
        message: "You can't revoke yourself",
        code: 400,
      });

    const user = await Account.findById(user_id);
    const admin = await Account.findById(admin_id);

    if (!user || !admin)
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });

    if (user.role !== "superadmin")
      throw new ErrorResponse({
        message: "You don't have permission",
        code: 403,
      });

    if (admin.role === "superadmin")
      throw new ErrorResponse({
        message: "You can't revoke superadmin",
        code: 400,
      });

    admin.role = "user";
    admin.save();

    return {
      message: "Revoke admin successfully",
    };
  }
}

module.exports = new AdminService();
