const { Schema, model } = require("mongoose");
const { ENUM_NOTIFICATION } = require("../utils/constants");

const NotificationSchema = new Schema(
  {
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    type: {
      type: String,
      enum: ENUM_NOTIFICATION,
      required: true,
    },
    post_id: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: function () {
        return this.type !== "follow";
      },
    },
    comment_id: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      required: function () {
        return this.type === "comment";
      },
    },
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const NotificationModel = model("Notification", NotificationSchema);

module.exports = NotificationModel;
