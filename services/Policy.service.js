const Policy = require("../models/PolicyModel");
const { ErrorResponse } = require("../core/reponseHandle");

class PolicyService {
  async upSertPolicy({ policy_id = "", title = "", children = [] }) {
    if ((!title, !children))
      throw new ErrorResponse({
        message: "Please fill in all fields",
        code: 400,
      });

    if (policy_id) {
      const policy = await Policy.findByIdAndUpdate(policy_id, {
        title,
        children,
      });
      if (!policy)
        throw new ErrorResponse({
          message: "Policy not found",
          code: 400,
        });
      return { data: policy, message: "Update policy successfully" };
    } else {
      const policy = await Policy.create({ title, children });
      return { data: policy, message: "Create policy successfully" };
    }
  }

  async getAllPolicies() {
    return await Policy.find();
  }

  async deletePolicy({ policy_id = "" }) {
    if (!policy_id)
      throw new ErrorResponse({
        message: "Policy ID is required",
        code: 400,
      });

    const policy = await Policy.findByIdAndDelete(policy_id);

    if (!policy)
      throw new ErrorResponse({
        message: "Policy not found",
        code: 400,
      });

    return policy;
  }
}

module.exports = new PolicyService();
