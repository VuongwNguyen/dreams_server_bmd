const { Schema, model } = require("mongoose");

const AvatarSchema = new Schema({
  account_id: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  public_id: {
    type: String,
    required: true,
  },
});

const Avatar = model("Avatar", AvatarSchema);

module.exports = Avatar;
