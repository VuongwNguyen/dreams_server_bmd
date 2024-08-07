const { Schema, model } = require("mongoose");

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
      enum: ["user", "superadmin"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Account", AccountSchema);
