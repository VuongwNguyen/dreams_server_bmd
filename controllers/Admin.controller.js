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
}

module.exports = new AdminController();