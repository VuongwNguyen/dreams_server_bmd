const { Account } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail, MapCode, GetVerifyCode } = require("../mail");

const salt = bcrypt.genSaltSync(10);
const secret_key = process.env.SECRET_KEY || "secret_key";
const expiresIn = process.env.EXPIRES_IN || "1d";
const forgotPassword = new Map();

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
    const token = jwt.sign({ id: user._id }, secret_key, {
      expiresIn: expiresIn,
    });

    // save fcm_token after login
    await user.save();

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
    let code = Math.floor(1000 + Math.random() * 9000).toString();
    // store code in redis and send mail
    MapCode.set(user._id.toString(), code); // 5 minutes
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

    if (!MapCode.equals(user._id.toString(), code)) {
      // nếu code không đúng thì thông báo lỗi
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });
    }
    MapCode.delete(user._id.toString());
    user.isVerified = true;
    await user.save();
    return true;
  }

  async changePassword({ oldPassword, newPassword, userId }) {
    const user = await Account.findOne({ _id: userId });
    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 404,
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
        code: 403,
      });
    }

    if (!forgotPassword?.get(user._id.toString())?.verify) {
      throw new ErrorResponse({
        message: "Reset password link is expired",
        code: 403,
      });
    }

    user.password = bcrypt.hashSync(newPassword, salt);
    await user.save();
    return true;
  }

  async sendCodeResetPassword(email) {
    const user = await Account.findOne({ email });

    if (!user) {
      throw new ErrorResponse({
        message: "User not found",
        code: 404,
      });
    }

    const code = Math.floor(Math.random() * 9000).toString();

    forgotPassword.set(user._id.toString(), {
      code,
      expIn: Date.now() + 1000 * 60,
      verify: false,
    });

    sendMail(GetVerifyCode(code, email));

    return true;
  }

  async verifyCodeResetPassword({code, email}) {
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
        code: 404,
      });
    }

    const forgotPasswordData = forgotPassword.get(user._id.toString());

    if (forgotPasswordData.expIn < Date.now()) {
      throw new ErrorResponse({
        message: "Code expired",
        code: 401,
      });
    }

    if (forgotPasswordData.code !== code) {
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });
    }

    forgotPassword.set(user._id.toString(), {
      ...forgotPasswordData,
      verify: true,
    });

    return true;
  }
}

module.exports = new AccountService();
