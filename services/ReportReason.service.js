const ReasonModel = require("../models/ReasonModel");
const ReportModel = require("../models/ReportModel");
const AccountService = require("./Account.service");
const PostService = require("./Post.service");
const { ENUM_TYPE } = require("../utils/constants");
const { ErrorResponse } = require("../core/reponseHandle");

class ReportService {
  async createReport({
    reported_user_id,
    reported_content_id,
    report_type,
    reason,
    description = "",
  }) {
    const checkType = ENUM_TYPE.includes(report_type);
    if (!checkType) {
      throw new ErrorResponse({
        message: "Invalid report type",
        code: 400,
      });
    }

    if (!reported_user_id || !reported_content_id || !reason) {
      throw new ErrorResponse({
        message: "Missing required fields",
        code: 400,
      });
    }

    const newReport = await ReportModel.create({
      reported_user_id,
      reported_content_id,
      report_type,
      reason,
      description,
    });

    if (!newReport) {
      throw new ErrorResponse({
        message: "Report not created",
        code: 400,
      });
    }
    return {
      message: "Report created successfully",
    };
  }

  async getReports(report_type) {
    const checkType = ENUM_TYPE.includes(report_type);
    if (!checkType)
      throw new ErrorResponse({
        message: "Invalid report type",
        code: 400,
      });

    const reports = await ReportModel.find({ report_type }).lean();

    return {
      reports,
      message: `reports fetched successfully`,
    };
  }

  async judgeTheReport(user_id, report_id, status, date_of_judge = "") {
    const checkStatus = ["resolved", "rejected"].includes(status);
    if (!checkStatus) {
      throw new ErrorResponse({
        message: "Invalid status",
        code: 400,
      });
    }

    const report = await ReportModel.findById(report_id);
    if (!report)
      throw new ErrorResponse({
        message: "Report not found",
        code: 400,
      });

    if (report.status !== "pending")
      throw new ErrorResponse({
        message: "Report already resolved",
        code: 400,
      });

    const type = report.report_type;
    const content_id = report.reported_content_id;
    const reason = report.reason;

    if (type === "post" && status === "resolve") {
      await PostService.SuspensionOfPosting(content_id, reason);
      report.status = status;
    } else if (type === "comment" && status === "resolve") {
      // to be implemented
      throw new ErrorResponse({
        message: "Feature not implemented",
        code: 400,
      });
      report.status = status;
    } else if (type === "account" && status === "resolve") {
      await AccountService.suspendUser(content_id, reason, date_of_judge);
      report.status = status;
    } else {
      report.status = status;
    }

    report.judger_id = user_id;
    report.date_of_judge = new Date();

    await report.save();

    return {
      data: report,
      message: "Report resolved successfully",
    };
  }
}

class ReasonService {
  async upSertReason({ reason_id, reason_title }) {
    if (reason_id) {
      const updatedReason = await ReasonModel.findByIdAndUpdate(
        reason_id,
        { reason_title },
        { new: true }
      ).lean();
      return { message: "Reason updated successfully", data: updatedReason };
    } else {
      const newReason = await ReasonModel.create({ reason_title });
      return {
        message: "Reason created successfully",
        data: newReason.toObject(),
      };
    }
  }

  async getReasons() {
    const reasons = await ReasonModel.find({ active: true }).lean();
    return reasons;
  }

  async deleteReason(reason_id) {
    const reason = await ReasonModel.findByIdAndDelete(reason_id);
    if (!reason) {
      throw new ErrorResponse({
        message: "Reason not found",
        code: 400,
      });
    }

    return {
      message: "Reason deleted successfully",
    };
  }
}
const reasonService = new ReasonService();
const reportService = new ReportService();

module.exports = { reasonService, reportService };
