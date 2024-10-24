const { Schema, model } = require("mongoose");
const { ENUM_INFORMATION } = require("../utils/constants");

const AccountSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    fcm_token: {
      type: String,
      required: false,
    },
    isActivated: {
      type: Boolean,
      required: false,
      default: false,
    },
    isVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
    role: {
      type: String,
      required: true,
      default: "user",
      enum: ["user", "admin", "superadmin"],
    },
    avatar: {
      type: {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
      required: false,
    },
    post_viewed: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
        required: false,
      },
    ],
    infomation: [
      {
        type: {
          key: {
            type: String,
            required: true,
            enum: ENUM_INFORMATION,
          },
          value: { type: String, required: true },
          privacy_status: {
            type: String,
            default: "public",
            enum: ["public", "private"],
          },
        },
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);
const Account = model("Account", AccountSchema);

module.exports = Account;
