const AccountService = require("../services/Account.service");
const { SuccessfullyReponse } = require("../core/reponseHandle");

class AccountController {
  async register(req, res, next) {
    const { first_name, last_name, email, phone, password } = req.body;
    await AccountService.register({
      first_name,
      last_name,
      email,
      phone,
      password,
    });
    return new SuccessfullyReponse({
      message: "Register successfully",
      code: 201,
    }).json(res);
  }

  async login(req, res, next) {
    const { UserIF, password } = req.body;
    const user = await AccountService.login({ UserIF, password });
    return new SuccessfullyReponse({
      data: user,
      message: "Login successfully",
      code: 200,
    }).json(res);
  }

  async verifyEmail(req, res, next) {
    const { code, email } = req.body;
    await AccountService.verifyEmail({ code, email });
    return new SuccessfullyReponse({
      message: "Verify successfully",
      code: 200,
    }).json(res);
  }

  async sendVerifyCode(req, res, next) {
    const { email } = req.body;
    await AccountService.sendVerifyCode(email);
    return new SuccessfullyReponse({
      message: "Send verify email successfully",
      code: 200,
    }).json(res);
  }

  async resetPassword(req, res, next) {
    const { newPassword, email } = req.body;
    await AccountService.resetPassword({ newPassword, email });
    return new SuccessfullyReponse({
      message: "Reset password successfully",
      code: 200,
    }).json(res);
  }

  async changePassword(req, res, next) {
    const { oldPassword, newPassword } = req.body;
    const { user_id } = req.user;
    await AccountService.changePassword({
      oldPassword,
      newPassword,
      userId: user_id,
    });
    return new SuccessfullyReponse({
      message: "Change password successfully",
      code: 200,
    }).json(res);
  }

  async verifyCodeResetPassword(req, res, next) {
    const { code, email } = req.body;
    await AccountService.verifyCodeResetPassword({ code, email });
    return new SuccessfullyReponse({
      message: "Verify code reset password successfully",
      code: 200,
    }).json(res);
  }

  async renewTokens(req, res, next) {
    const { refreshToken } = req.body;
    const token = await AccountService.renewTokens(refreshToken);
    return new SuccessfullyReponse({
      data: { token },
      message: "Renew token successfully",
      code: 200,
    }).json(res);
  }

  async logout(req, res, next) {
    const { user_id } = req.user;

    await AccountService.logout(user_id);
    new SuccessfullyReponse({
      message: "Logout successfully",
      code: 200,
    }).json(res);
  }

  async getNameAvatarUser(req, res, next) {
    const { user_id } = req.user;
    const user = await AccountService.getNameAvatarUser(user_id);
    new SuccessfullyReponse({
      data: user,
      message: "Get name and avatar user successfully",
      code: 200,
    }).json(res);
  }

  async updateFcm(req, res) {
    const { user_id } = req.user;
    const { token } = req.body;

    await AccountService.updateFcmToken({ user_id, token });
    new SuccessfullyReponse({
      message: "update fcm token success",
    }).json(res);
  }

  async revokeFcmToken(req, res) {
    const { user_id } = req.body;

    await AccountService.revokeFcmToken({ user_id });

    new SuccessfullyReponse({
      message: "revoke fcm token success",
    }).json(res);
  }
}

module.exports = new AccountController();
