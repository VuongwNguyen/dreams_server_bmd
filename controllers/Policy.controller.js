const { SuccessfullyReponse } = require("../core/reponseHandle");
const PolicyService = require("../services/Policy.service");

class PolicyController {
  async upSertPolicy(req, res) {
    const { title, children } = req.body;

    const policy = await PolicyService.upSertPolicy({ title, children });
    return new SuccessfullyReponse({
      data: policy,
      message: "Create policy successfully",
    }).json(res);
  }

  async getAllPolicies(req, res) {
    const policies = await PolicyService.getAllPolicies();
    res.json(
      new SuccessfullyReponse({
        data: policies,
        message: "Get all policies successfully",
      })
    );
  }

  async deletePolicy(req, res) {
    const { policy_id } = req.body;
    await PolicyService.deletePolicy({ policy_id });
    return new SuccessfullyReponse({
      data: null,
      message: "Delete policy successfully",
    }).json(res);
  }
}

module.exports = new PolicyController();
