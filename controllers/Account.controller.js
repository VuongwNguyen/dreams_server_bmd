const AccountService = require("../services/Account.service");
const { SuccessfullyReponse } = require("../core/reponseHandle");

class AccountController {
  async register(req, res, next) {
    const { first_name, last_name, email, phone, password, fcm_token } =
      req.body;
    await AccountService.register({
      first_name,
      last_name,
      email,
      phone,
      password,
    });
    return new SuccessfullyReponse({
      data: {},
      message: "Register successfully",
      code: 201,
    }).json(res);
  }

  async login(req, res, next) {
    const { UserIF, password, fcm_token } = req.body;
    const user = await AccountService.login({ UserIF, password, fcm_token });
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
      data: {},
      message: "Verify successfully",
      code: 200,
    }).json(res);
  }

  async sendVerifyEmail(req, res, next) {
    const { email } = req.body;
    await AccountService.sendVerifyEmail(email);
    return new SuccessfullyReponse({
      data: {},
      message: "Send verify email successfully",
      code: 200,
    }).json(res);
  }

  async resetPassword(req, res, next) {
    const { newPassword, email } = req.body;

    return new SuccessfullyReponse({
      data: await AccountService.resetPassword({ newPassword, email }),
      message: "Reset password successfully",
      code: 200,
    }).json(res);
  }

  async changePassword(req, res, next) {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;
    return new SuccessfullyReponse({
      data: await AccountService.changePassword({
        oldPassword,
        newPassword,
        userId,
      }),
      message: "Change password successfully",
      code: 200,
    }).json(res);
  }

  async sendCodeResetPassword(req, res, next) {
    const { email } = req.body;

    return new SuccessfullyReponse({
      data: await AccountService.sendCodeResetPassword(email),
      message: "Send code reset password successfully",
      code: 200,
    }).json(res);
  }

  async verifyCodeResetPassword(req, res, next) {
    const { code, email } = req.body;

    return new SuccessfullyReponse({
      data: await AccountService.verifyCodeResetPassword({ code, email }),
      message: "Verify code reset password successfully",
      code: 200,
    }).json(res);
  }
}

module.exports = new AccountController();
