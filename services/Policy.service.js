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
      const policy = await Policy.findById(policy_id);
      if (policy) {
        policy.title = title;
        policy.children = children;
        return await policy.save();
      }
    } else {
      return await Policy.create({ title, children });
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
