const ReasonModel = require("../models/ReasonModel");
const ReportModel = require("../models/ReportModel");
const { ENUM_TYPE } = require("../utils/constants");
const { ErrorResponse } = require("../core/reponseHandle");

class ReportService {
  async createReport({
    reported_user_id,
    reported_content_id,
    report_type,
    reason,
  }) {
    const checkType = ENUM_TYPE.includes(report_type);
    if (!checkType) {
      throw new Error("Invalid report type");
    }

    const newReport = await ReportModel.create({
      reported_user_id,
      reported_content_id,
      report_type,
      reason,
    }).lean();

    if (!newReport) {
      throw new Error("Failed to create report");
    }
    return {
      message: "Report created successfully",
    };
  }

  async getReports(report_type) {
    const checkType = ENUM_TYPE.includes(report_type);
    if (checkType)
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

  async updateReportStatus(report_id, status) {
    const checkStatus = ["pending", "resolved", "rejected"].includes(status);
    if (!checkStatus) {
      throw new Error("Invalid status");
    }

    const report = await ReportModel.findByIdAndUpdate(report_id, {
      status,
    }).lean();

    if (!report) {
      throw new Error("Report not found");
    }

    return {
      message: "Report updated successfully",
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
      throw new Error("Reason not found");
    }

    return {
      message: "Reason deleted successfully",
    };
  }
}
const reasonService = new ReasonService();
const reportService = new ReportService();

module.exports = { reasonService, reportService };
