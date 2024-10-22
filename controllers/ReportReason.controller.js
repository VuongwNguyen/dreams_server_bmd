const {
  reasonService,
  reportService,
} = require("../services/ReportReason.service");
const { SuccessfullyReponse } = require("../core/reponseHandle");

class ReportController {
  async createReport(req, res) {
    const { reported_content_id, report_type, reason } = req.body;
    const reported_user_id = req.user.user_id;
    const report = await reportService.createReport({
      reported_user_id,
      reported_content_id,
      report_type,
      reason,
    });
    return new SuccessfullyReponse({
      message: report.message,
    }).json(res);
  }

  async getReports(req, res) {
    const { report_type } = req.query;
    const reports = await reportService.getReports(report_type);
    return new SuccessfullyReponse({
      data: reports.reports,
      message: reports.message,
    }).json(res);
  }

  async updateReportStatus(req, res) {
    const { report_id, status } = req.body;
    const report = await reportService.updateReportStatus(report_id, status);
    return new SuccessfullyReponse({
      message: report.message,
    }).json(res);
  }
}

class ReasonController {
  async upSertReason(req, res) {
    const { reason_id, reason_title } = req.body;
    const upsertReason = await reasonService.upSertReason({reason_id, reason_title});
    return new SuccessfullyReponse({
      message: upsertReason.message,
      data: upsertReason.data,
    }).json(res);
  }

  async getReasons(req, res) {
    const reasons = await reasonService.getReasons();
    return new SuccessfullyReponse({
      data: reasons,
      message: "fetched reason succesfully",
    }).json(res);
  }

  async deleteReason(req, res) {
    const { reason_id } = req.body;
    const reason = await reasonService.deleteReason(reason_id);
    return new SuccessfullyReponse({
      message: reason.message,
    }).json(res);
  }
}

const reportController = new ReportController();
const reasonController = new ReasonController();

module.exports = { reportController, reasonController };
