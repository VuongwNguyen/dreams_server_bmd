const { Report } = require("../models");
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

      const reports = await Report.aggregate([
        { $match: { report_type: report_type } },
        {
          $lookup: {
            from: "accounts",
            localField: "reported_user_id",
            foreignField: "_id",
            as: "reported_user",
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "judger_id",
            foreignField: "_id",
            as: "judger",
          },
        },
        {
          $lookup: {
            from: "posts",
            localField: "reported_content_id",
            foreignField: "_id",
            as: "reported_post",
          },
        },
        {
          $lookup: {
            from: "comments",
            localField: "reported_content_id",
            foreignField: "_id",
            as: "reported_comment",
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "reported_content_id",
            foreignField: "_id",
            as: "reported_user_content",
          },
        },
        {
          $addFields: {
            reported_user: { $arrayElemAt: ["$reported_user", 0] },
            judger: { $arrayElemAt: ["$judger", 0] },
            reported_content: {
              $cond: {
                if: { $eq: ["$report_type", "post"] },
                then: { $arrayElemAt: ["$reported_post", 0] },
                else: {
                  $cond: {
                    if: { $eq: ["$report_type", "comment"] },
                    then: { $arrayElemAt: ["$reported_comment", 0] },
                    else: { $arrayElemAt: ["$reported_user_content", 0] },
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "reported_content.account_id",
            foreignField: "_id",
            as: "reported_content_user",
          },
        },
        {
          $addFields: {
            reported_content_user: {
              $arrayElemAt: ["$reported_content_user", 0],
            },
          },
        },
        {
          $project: {
            _id: 1,
            reason: 1,
            status: 1,
            description: 1,
            date_of_judge: 1,
            createdAt: 1,
            reported_user: {
              _id: 1,
              fullname: {
                $concat: [
                  "$reported_user.first_name",
                  " ",
                  "$reported_user.last_name",
                ],
              },
            },
            judger: 1,
            reported_content: {
              $cond: {
                if: { $eq: ["$report_type", "post"] },
                then: {
                  title: "$reported_content.title",
                  content: "$reported_content.content",
                  images: "$reported_content.images.url",
                  videos: "$reported_content.videos.url",
                  tagUsers: "$reported_content.tagUsers",
                  hashtags: "$reported_content.hashtags",
                  author: {
                    _id: "$reported_content_user._id",
                    fullname: {
                      $concat: [
                        "$reported_content_user.first_name",
                        " ",
                        "$reported_content_user.last_name",
                      ],
                    },
                  },
                },
                else: {
                  $cond: {
                    if: { $eq: ["$report_type", "comment"] },
                    then: { text: "$reported_content.text" },
                    else: {
                      username: "$reported_content.username",
                      email: "$reported_content.email",
                    },
                  },
                },
              },
            },
          },
        },
      ]);
      

    return {
      reports,
      message: "Get reports successfully",
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

module.exports = new ReportService();
