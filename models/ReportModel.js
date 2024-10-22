const { Schema, model } = require("mongoose");
const { ENUM_TYPE } = require("../utils/constants");

const ReportSchema = new Schema(
  {
    reported_user_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    reported_content_id: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    report_type: {
      type: String,
      required: true,
      enum: ENUM_TYPE,
    },
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "resolved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Report = model("Report", ReportSchema);

module.exports = Report;
