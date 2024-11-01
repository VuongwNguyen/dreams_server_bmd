const { KeyStore } = require("../models");

class KeyStoreService {
  async upsertKeyStore({ user_id, refreshToken }) {
    const filter = {
      user_id,
    };
    const update = {
      current_refresh_token: refreshToken,
      black_list_refresh_token: [],
    };
    const upsertOptions = { upsert: true, new: true };

    const keyStore = await KeyStore.findOneAndUpdate(
      filter,
      update,
      upsertOptions
    );

    return keyStore;
  }

  async removeKeyStore(userId) {
    return await KeyStore.deleteOne({ user_id: userId });
  }

  async addRefreshTokenIntoBlackList({
    user_id,
    newRefreshToken,
    refreshToken,
  }) {
    const keyStore = await KeyStore.findOneAndUpdate(
      {
        user_id: user_id,
      },
      {
        current_refresh_token: newRefreshToken,
        $addToSet: {
          black_list_refresh_token: refreshToken.toString(),
        },
      }
    );

    return keyStore;
  }
}

module.exports = new KeyStoreService();
