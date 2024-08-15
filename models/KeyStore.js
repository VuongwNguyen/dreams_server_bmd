const { model, Schema } = require("mongoose");

const keyStoreSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  current_refresh_token: {
    type: String,
    required: true,
  },
  black_list_refresh_token: {
    type: [String],
  },
});

module.exports = model("KeyStore", keyStoreSchema);
