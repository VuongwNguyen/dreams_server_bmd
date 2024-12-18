require("dotenv").config();
const { Account, KeyStore } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail, MapCode, GetVerifyCode } = require("../mail");
const { generateTokens } = require("./token.service");
const keystoreService = require("./keystore.service");

const salt = bcrypt.genSaltSync(10);
const code = Math.floor(1000 + Math.random() * 9000).toString();
const verify = new MapCode();
const verifyObj = { verify: true };

const StreamChat = require("stream-chat").StreamChat;
const { STREAM_API_KEY, STREAM_API_SECRET } = process.env;
const streamClient = StreamChat.getInstance(STREAM_API_KEY, STREAM_API_SECRET);
 const {set} = require("../middlewares/verifyUser"); 

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

    await streamClient.upsertUser({
      name: `${newUser.first_name} ${newUser.last_name}`,
      id: newUser._id.toString(),
      role: "admin",
    });

    verify.set(newUser._id.toString(), code);
    await sendMail(GetVerifyCode(code, email));
    return newUser;
  }

  async getStreamToken({ user_id }) {
    return streamClient.createToken(user_id);
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
    if (user.isJudged?.judgeDate > Date.now() || user.isJudged?.judgeDate === null)
      throw new ErrorResponse({
        message: "User has been suspended",
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

    if (!verify.equals(user._id?.toString(), code))
      // nếu code không đúng thì thông báo lỗi
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });

    user.isVerified = true;
    verify.delete(user._id.toString());
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

    if (!verify.equals(user?._id.toString(), verifyObj))
      throw new ErrorResponse({
        message: "Code is incorrect",
        code: 400,
      });

    user.password = bcrypt.hashSync(newPassword, salt);
    verify.delete(user._id.toString());
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
          code: 401,
        });
      }

      if (!user) {
        throw new ErrorResponse({
          message: "User not found, please login",
          code: 401,
        });
      }

      const payload = {
        user_id: user._id,
      };

      const tokens = generateTokens(payload);

      await keystoreService.addRefreshTokenIntoBlackList({
        user_id: user._id,
        newRefreshToken: tokens.refreshToken,
        refreshToken: refreshToken,
      });

      return tokens;
    } catch (error) {
      throw new ErrorResponse({
        message: "Something went wrong, please login",
        code: 401,
      });
    }
  }

  async logout(user_id) {
    const user = await Account.findOne({ _id: user_id });
    user.fcm_token = null;
    await user.save();
    return await keystoreService.removeKeyStore(user_id);
  }

  async updateFcmToken({ user_id, token }) {
    const user = await Account.findOne({ _id: user_id });

    if (!user) {
      throw new ErrorResponse({ message: "User not found", code: 400 });
    }

    user.fcm_token = token;
    await user.save();
  }

  async revokeFcmToken({ user_id }) {
    const user = await Account.findOne({ _id: user_id });

    if (!user) {
      return;
    }

    user.fcm_token = null;
    await user.save();
  }

  async getInfo({ user_id }) {
    let user = await Account.findOne(
      { _id: user_id },
      {
        first_name: 1,
        last_name: 1,
        avatar: 1,
        phone: 1,
        email: 1,
        toggleNotification: 1,
      }
    );

    if (!user) {
      throw new ErrorResponse({
        message: "not found user",
        code: 400,
      });
    }

    user = user.toObject();

    user.fullname = `${user.first_name} ${user.last_name}`;
    user.avatar = user.avatar.url;
    delete user.first_name;
    delete user.last_name;

    return user;
  }

  async suspendUser({ user_id, judgeDate, reason }) {
    const user = await Account.findOne({ _id: user_id });

    if (!user) {
      throw new ErrorResponse({
        message: "not found user",
        code: 400,
      });
    }



    user.isJudged = {
      judgeDate,
      reason,
    };

    set.add(user_id);

    await user.save();
  }

  async authThirdPartner({
    email,
    phone,
    first_name,
    last_name,
    avatar,
    partner_id,
    password = null,
  }) {
    let user = await Account.findOne({ email });
    // check user is blocked

    if (!user) {
      user = await Account.create({
        email,
        phone,
        first_name,
        last_name,
        partner_id,
        role: "user",
        password,
        verified: true,
      });

      if (user.isJudged?.judgeDate > Date.now() || user.isJudged?.judgeDate === null)
        throw new ErrorResponse({
          message: "User has been suspended",
          code: 403,
        });

      if (avatar) user.avatar.url = avatar;

      await user.save();

      await streamClient.upsertUser({
        name: `${user.first_name} ${user.last_name}`,
        id: user._id.toString(),
        role: "admin",
      });

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

    if (!user.partner_id) user.partner_id = partner_id;
    await user.save();

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
  async authGithub({ code }) {
    const axios = require("axios");
    const { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } = process.env;

    if (!code) throw new ErrorResponse({ message: "Invalid code", code: 400 });

    const tokenResponse = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      },
      { Headers: { Accept: "application/json" } }
    );

    const queryString = tokenResponse.data;

    const params = new URLSearchParams(queryString);

    // Trích xuất các giá trị
    const accessToken = params.get("access_token");

    if (!accessToken)
      throw new ErrorResponse({ message: "Invalid code", code: 400 });

    // (Optional) Lấy thông tin người dùng từ GitHub
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = userResponse.data;

    if (!userData.email)
      throw new ErrorResponse({
        message: "Please public your email on github",
        code: 403,
      });
    let user = await Account.findOne({ email: userData.email });

    if (!user) {
      user = await Account.create({
        email: userData.email,
        first_name: userData.name.split(" ")[0],
        last_name: userData.name.split(" ")[1] || userData.name.split(" ")[0],
        role: "user",
        verified: true,
        avatar: {
          url: userData.avatar_url,
        },
        partner_id: userData.id,
      });

      await streamClient.upsertUser({
        name: `${user.first_name} ${user.last_name}`,
        id: user._id.toString(),
        role: "admin",
      });

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

    if (user.isJudged?.judgeDate > Date.now() || user.isJudged?.judgeDate === null)
      throw new ErrorResponse({
        message: "User has been suspended",
        code: 403,
      });

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
}


module.exports = new AccountService();
