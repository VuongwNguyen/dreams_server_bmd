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
            enum: [
              "natl", // nationality
              "htown", // hometown
              "zone", // live in
              "gender", // gender
              "dob", // date of birth
              "job", // job
              "edu", // education
              "hobby", // hobby
              "rlts", // relationship
              "zodiac", // zodiac
              "des", // description
            ],
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
