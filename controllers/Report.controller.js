const reportService = require("../services/Report.service");
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
module.exports = new ReportController();
