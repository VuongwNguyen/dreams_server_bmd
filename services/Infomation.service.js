const { Account } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const { default: mongoose } = require("mongoose");
const cloudinary = require("../config/cloudinary");

const {
  ENUM_INFORMATION,
  BASIC_INFORMATION,
  OTHER_INFORMATION,
} = require("../utils/constants");

const privacyStatus = ["public", "private"];

class InfomationService {
  async upSertInfomation({ user_id, payload }) {
    const { key, value, privacy_status = "public" } = payload;
    const user = await Account.findOne({ _id: user_id }).select("infomation");
    if (!user)
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });

    if (!ENUM_INFORMATION.includes(key))
      throw new ErrorResponse({
        message: "Key is incorrect",
        code: 400,
      });

    if (!privacyStatus.includes(privacy_status) && privacy_status)
      throw new ErrorResponse({
        message: "Privacy status is incorrect",
        code: 400,
      });

    const index = user.infomation.findIndex((item) => item.key === key);
    if (index !== -1) {
      if (value) {
        user.infomation[index].value = value;
      }
      user.infomation[index].privacy_status = privacy_status;
    } else {
      user.infomation.push({ key, value, privacy_status });
    }

    const result = await user.save();
    return result;
  }

  async getInfomation({ user_id, user_id_view }) {
    if (!user_id_view) user_id_view = user_id;
    const result = await Account.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(user_id_view) } },

      // Add nickname và description dựa trên key trong infomation
      {
        $addFields: {
          description: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$infomation",
                  as: "info",
                  cond: { $eq: ["$$info.key", "des"] }, // Lọc các phần tử có key là "des"
                },
              },
              0, // Lấy phần tử đầu tiên trong mảng đã lọc
            ],
          },
          nickname: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$infomation",
                  as: "info",
                  cond: { $eq: ["$$info.key", "nick"] },
                },
              },
              0,
            ],
          },
        },
      },

      // Lookup follows collection để kiểm tra quan hệ follower/following
      {
        $lookup: {
          from: "follows",
          pipeline: [
            {
              $match: {
                $or: [
                  { follower: new mongoose.Types.ObjectId(user_id) },
                  { following: new mongoose.Types.ObjectId(user_id_view) },
                ],
              },
            },
          ],
          as: "follows",
        },
      },

      // Add fields: isFollowed, followingCount và followerCount
      {
        $addFields: {
          isFollowed: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$follows",
                    as: "follow",
                    cond: {
                      $and: [
                        {
                          $eq: [
                            "$$follow.follower",
                            new mongoose.Types.ObjectId(user_id),
                          ],
                        },
                        {
                          $eq: [
                            "$$follow.following",
                            new mongoose.Types.ObjectId(user_id_view),
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              0,
            ], // Nếu có ít nhất 1 bản ghi, isFollowed sẽ là true
          },
          followingCount: {
            $size: {
              $filter: {
                input: "$follows",
                as: "follow",
                cond: {
                  $eq: [
                    "$$follow.follower",
                    new mongoose.Types.ObjectId(user_id_view),
                  ],
                },
              },
            },
          },
          followerCount: {
            $size: {
              $filter: {
                input: "$follows",
                as: "follow",
                cond: {
                  $eq: [
                    "$$follow.following",
                    new mongoose.Types.ObjectId(user_id_view),
                  ],
                },
              },
            },
          },
        },
      },

      // Lookup posts collection để đếm số lượng bài viết
      {
        $lookup: {
          from: "posts",
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                account_id: new mongoose.Types.ObjectId(user_id_view),
              },
            },
          ],
          as: "posts",
        },
      },

      // Add postCount
      {
        $addFields: {
          postCount: { $size: "$posts" },
        },
      },

      // Project các trường cần thiết
      {
        $project: {
          _id: 1,
          fullname: { $concat: ["$last_name", " ", "$first_name"] },
          avatar: "$avatar.url",
          followingCount: 1,
          followerCount: 1,
          postCount: 1,
          isFollowed: 1,
          nickname: "$nickname.value",
          description: "$description.value",
        },
      },
    ]);

    // Check isSelf
    if (user_id_view == user_id) {
      result[0].isSelf = true;
    }

    return result[0];
  }

  async getInfomationList({ user_id, user_id_view }) {
    if (!user_id_view) user_id_view = user_id;
    const result = await Account.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(user_id_view) } },
      {
        $addFields: {
          description: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$infomation",
                  as: "info",
                  cond: { $eq: ["$$info.key", "des"] }, // Lọc các phần tử có key là "des"
                },
              },
              0, // Lấy phần tử đầu tiên trong mảng đã lọc
            ],
          },
          nickname: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$infomation",
                  as: "info",
                  cond: { $eq: ["$$info.key", "nick"] },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $project: {
          infomation: !user_id
            ? 1
            : {
                $filter: {
                  input: "$infomation",
                  as: "info",
                  cond: {
                    $and: [
                      { $ne: ["$$info.key", "des"] },
                      { $ne: ["$$info.key", "nick"] },
                      { $eq: ["$$info.privacy_status", "public"] },
                    ],
                  },
                },
              },
        },
      },
    ]);

    return result[0];
  }

  async getInfomationBySelfSetting({ user_id }) {
    const result = await Account.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(user_id) } },
      {
        $project: {
          infomation: 1,
          avatar: 1,
          fullname: { $concat: ["$last_name", " ", "$first_name"] },
        },
      },
    ]);

    const basicInformation = result[0].infomation.filter((item) =>
      BASIC_INFORMATION.includes(item.key)
    );

    const otherInformation = result[0].infomation.filter((item) =>
      OTHER_INFORMATION.includes(item.key)
    );

    basicInformation.push({
      key: "fullname",
      value: result[0].fullname,
    });

    const avatar = result[0].avatar?.url;
    return { avatar, basicInformation, otherInformation };
  }

  async changeNameAvatar({ user_id, first_name, last_name, avatar }) {
    const user = await Account.findOne({ _id: user_id });
    if (!user)
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });

    if (first_name) user.first_name = first_name;
    if (last_name) user.last_name = last_name;
    if (avatar) {
      if (user.avatar?.public_id) {
        await cloudinary.uploader.destroy(user.avatar.public_id);
      }
      user.avatar = {
        url: avatar.url,
        public_id: avatar.public_id,
      };
    }

    const result = await user.save();
    return {
      avatar: result.avatar.url,
      fullname: `${result.last_name} ${result.first_name}`,
    };
  }
}

module.exports = new InfomationService();
