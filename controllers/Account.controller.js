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

  async sendVerifyEmail(req, res, next) {
    const { email } = req.body;
    await AccountService.sendVerifyEmail(email);
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
    const userId = req.user.userId;
    await AccountService.changePassword({
      oldPassword,
      newPassword,
      userId,
    });
    return new SuccessfullyReponse({
      message: "Change password successfully",
      code: 200,
    }).json(res);
  }

  async sendCodeResetPassword(req, res, next) {
    const { email } = req.body;
    await AccountService.sendCodeResetPassword(email);
    return new SuccessfullyReponse({
      message: "Send code reset password successfully",
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
    const { userId } = req.user;

    await AccountService.logout(userId);
    new SuccessfullyReponse({
      message: "Logout successfully",
      code: 200,
    }).json(res);
  }
}

module.exports = new AccountController();
