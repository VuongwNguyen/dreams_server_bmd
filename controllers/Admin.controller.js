const { SuccessfullyReponse } = require("../core/reponseHandle");
const AdminService = require("../services/Admin.service");

class AdminController {
  async loginAdmin(req, res) {
    const { email, password } = req.body;
    const data = await AdminService.loginAdmin({ email, password });
    new SuccessfullyReponse({
      data,
      message: "Login successfully",
    }).json(res);
  }

  async registerAdmin(req, res) {
    const { email, first_name, last_name } = req.body;
    const { user_id } = req.user;
    const data = await AdminService.registerAdmin({
      user_id,
      email,
      first_name,
      last_name,
    });
    new SuccessfullyReponse({
      message: data.message,
    }).json(res);
  }

  async getAdmins(req, res) {
    const { user_id } = req.user;
    const { _limit, _page } = req.query;
    const data = await AdminService.getAdmins({ user_id, _limit, _page });
    new SuccessfullyReponse({
      data,
      message: "Get admins successfully",
    }).json(res);
  }
  
  async revokeAdmin(req, res) {
    const { user_id } = req.user;
    const { admin_id } = req.body;
    const data = await AdminService.revokeAdmin({ user_id, admin_id });
    new SuccessfullyReponse({
      message: data.message,
    }).json(res);
  }
}

module.exports = new AdminController();
