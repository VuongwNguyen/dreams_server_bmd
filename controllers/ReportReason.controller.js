const {
  reasonService,
  reportService,
} = require("../services/ReportReason.service");
const { SuccessfullyReponse } = require("../core/reponseHandle");

class ReportController {
  async createReport(req, res) {
    const { reported_content_id, report_type, reason, description } = req.body;
    const reported_user_id = req.user.user_id;
    const report = await reportService.createReport({
      reported_user_id,
      reported_content_id,
      report_type,
      reason,
      description,
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

  async judgeTheReport(req, res) {
    const { report_id, status, date_of_judge } = req.body;
    const { user_id } = req.user;
    const report = await reportService.judgeTheReport(
      user_id,
      report_id,
      status,
      date_of_judge
    );
    return new SuccessfullyReponse({
      message: report.message,
    }).json(res);
  }
}

class ReasonController {
  async upSertReason(req, res) {
    const { reason_id, reason_title } = req.body;
    const upsertReason = await reasonService.upSertReason({
      reason_id,
      reason_title,
    });
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
