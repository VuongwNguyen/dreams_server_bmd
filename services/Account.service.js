const { Account, KeyStore } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail, MapCode, GetVerifyCode } = require("../mail");
const { generateTokens } = require("./token.service");
const keystoreService = require("./keystore.service");

const salt = bcrypt.genSaltSync(10);
const code = Math.floor(1000 + Math.random() * 9000).toString();
// const forgotPassword = new MapCode();
// const verifyCode = new MapCode();
const verify = new MapCode();
const verifyObj = { verify: true };
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
    const payload = {
      user_id: user._id,
    };

    const tokens = generateTokens(payload);

    await keystoreService.upsertKeyStore({
      user_id: user._id,
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  async sendVerifyCode(email) {
    const user = await Account.findOne({ email: email });
    if (!user)
      throw new ErrorResponse({
        message: "Email is not exist",
        code: 400,
      });

    verify.set(user._id.toString(), code);
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

    if (!verify.equals(user._id.toString(), code))
      // nếu code không đúng thì thông báo lỗi
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });

    user.isVerified = true;
    // verify.delete(user._id.toString());
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

    if (!newPassword)
      throw new ErrorResponse({
        message: "New password is required",
        code: 400,
      });

    if (!verify.equals(user._id.toString(), verifyObj))
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });

    user.password = bcrypt.hashSync(newPassword, salt);
    // verify.delete(user._id.toString());
    await user.save();
    return true;
  }

  async verifyCodeResetPassword({ code, email }) {
    if (!code)
      throw new ErrorResponse({
        message: "Code is required",
        code: 400,
      });

    if (!email)
      throw new ErrorResponse({
        message: "Email is required",
        code: 400,
      });

    const user = await Account.findOne({ email });

    if (!verify.equals(user._id.toString(), code))
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });

    verify.set(user._id.toString(), verifyObj);

    return true;
  }

  async renewTokens(refreshToken) {
    try {
      const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

      const user = await Account.findOne({ _id: decode.user_id }).lean();

      const keyStore = await KeyStore.findOne({ user_id: user._id });

      if (
        !keyStore ||
        keyStore.current_refresh_token !== refreshToken ||
        keyStore.black_list_refresh_token.includes(refreshToken)
      ) {
        await keystoreService.removeKeyStore(user._id);
        throw new ErrorResponse({
          message: "Something went wrong, please login",
        });
      }

      if (!user) {
        throw new ErrorResponse({
          message: "User not found",
          code: 400,
        });
      }

      const payload = {
        userId: user._id,
      };

      const tokens = generateTokens(payload);

      await keystoreService.addRefreshTokenIntoBlackList({
        userId: user._id,
        newRefreshToken: tokens.refreshToken,
        refreshToken: refreshToken,
      });

      return tokens;
    } catch (error) {
      if (
        error.message === "jwt expired" ||
        error.message === "invalid signature"
      ) {
        throw new ErrorResponse({
          message: "Something went wrong, please login",
          code: 403,
        });
      }

      throw error;
    }
  }

  async logout(userId) {
    return await keystoreService.removeKeyStore(userId);
  }
}

module.exports = new AccountService();
