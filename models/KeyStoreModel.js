const { model, Schema } = require("mongoose");

const keyStoreSchema = new Schema({
  user_id: {
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
const KeyStore = model("KeyStore", keyStoreSchema);

module.exports = KeyStore;