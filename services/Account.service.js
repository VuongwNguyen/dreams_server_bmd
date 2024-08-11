const { Account } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail, MapCode, GetVerifyCode } = require("../mail");

const salt = bcrypt.genSaltSync(10);
const secret_key = process.env.SECRET_KEY || "secret_key";
const expiresIn = process.env.EXPIRES_IN || "1d";
const code = Math.floor(1000 + Math.random() * 9000).toString();
const forgotPassword = new MapCode();
const verifyCode = new MapCode();

class AccountService {
  async register(data) {
    const { first_name, last_name, email, phone, password } = data;

    // check all fields are required
    if (!first_name || !last_name || !email || !phone || !password)
      throw new ErrorResponse({
        message: "All fields are required",
        code: 400,
      });

    // check email and phone are valid
    const checkInvalidUser = await Account.findOne({
      $or: [{ email }, { phone }],
    });

    if (checkInvalidUser)
      throw new ErrorResponse({
        message: "Email or phone already exists",
        code: 400,
      });

    // hash password
    data.password = bcrypt.hashSync(password, salt);

    // create new user
    const newUser = await Account.create(data);
    return newUser;
  }

  async login(data) {
    const { UserIF, password } = data;

    const user = await Account.findOne({
      $or: [{ email: UserIF }, { phone: UserIF }],
    });
    // check user is exist
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

    // check user is verified
    if (!user.isVerified)
      throw new ErrorResponse({
        message: "User is not verified",
        code: 401,
      });

    // check user is blocked
    if (user.isActivated)
      throw new ErrorResponse({
        message: "User is blocked",
        code: 403,
      });

    // create token
    const token = jwt.sign({ _id: user._id }, secret_key, {
      expiresIn: expiresIn,
    });

    return { token };
  }

  async sendVerifyEmail(email) {
    const user = await Account.findOne({ email: email });
    if (!user)
      throw new ErrorResponse({
        message: "Email is not exist",
        code: 400,
      });

    // create verify code
    // store code in redis and send mail
    verifyCode.set(user._id.toString(), code);
    sendMail(GetVerifyCode(code, email));
    return true;
  }

  async verifyEmail(data) {
    const { email, code } = data;
    const user = await Account.findOne({ email });
    if (!user)
      throw new ErrorResponse({
        message: "Email is not exist",
        code: 400,
      });

    if (!verifyCode.equals(user._id.toString(), code)) {
      // nếu code không đúng thì thông báo lỗi
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });
    }
    user.isVerified = true;
    verifyCode.delete(user._id.toString());
    await user.save();
    return true;
  }

  async changePassword({ oldPassword, newPassword, userId }) {
    const user = await Account.findOne({ _id: userId });
    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }

    const checkPassword = bcrypt.compareSync(oldPassword, user.password);
    if (!checkPassword) {
      throw new ErrorResponse({
        message: "Old password is incorrect",
        code: 400,
      });
    }

    user.password = bcrypt.hashSync(newPassword, salt);
    await user.save();
    return true;
  }

  async resetPassword({ newPassword, email }) {
    const user = await Account.findOne({ email });
    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }

    if (forgotPassword.get(user._id.toString())?.expiresIn < Date.now()) {
      throw new ErrorResponse({
        message: "Request reset password is expired",
        code: 400,
      });
    }
    if (!forgotPassword?.get(user._id.toString())?.value?.verify) {
      console.log(forgotPassword.get(user._id.toString()));
      throw new ErrorResponse({
        message: "Request reset password is not verified",
        code: 400,
      });
    }

    user.password = bcrypt.hashSync(newPassword, salt);
    forgotPassword.delete(user._id.toString());
    await user.save();
    return true;
  }

  async sendCodeResetPassword(email) {
    const user = await Account.findOne({ email });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }

    forgotPassword.set(user._id.toString(), code);

    sendMail(GetVerifyCode(code, email));

    return true;
  }

  async verifyCodeResetPassword({ code, email }) {
    if (!code) {
      throw new ErrorResponse({
        message: "Code is required",
        code: 400,
      });
    }

    const user = await Account.findOne({ email });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }

    const forgotPasswordData = forgotPassword.get(user._id.toString());

    if (forgotPasswordData.expiresIn < Date.now()) {
      throw new ErrorResponse({
        message: "Code expired",
        code: 400,
      });
    }

    if (forgotPasswordData.value !== code) {
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });
    }

    forgotPassword.delete(user._id.toString());
    forgotPassword.set(user._id.toString(), { verify: true });

    return true;
  }
}

module.exports = new AccountService();
