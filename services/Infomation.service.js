const { Account } = require("../models");
const { ErrorResponse } = require("../core/reponseHandle");
const { default: mongoose } = require("mongoose");
const { ENUM_INFOMATION } = require("../utils/Constant");

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

    if (!ENUM_INFOMATION.includes(key))
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

  // async getInfomation({ user_id, user_id_view }) {
  //   const user = await Account.findOne({ _id: user_id_view });

  //   if (!user)
  //     throw new ErrorResponse({
  //       message: "User not found",
  //       code: 400,
  //     });

  //   const infomation = Account.aggregate([
  //     {
  //       $match: {
  //         _id: new mongoose.Types.ObjectId(user_id_view),
  //         "infomation.privacy_status": "public",
  //       },
  //     },
  //     {
  //       $project: {
  //         _id: 1,
  //         full_name: { $concat: ["$first_name", " ", "$last_name"] },
  //         infomation: 1,
  //         avatar: 1,
  //       },
  //     },
  //     {
  //       $unwind: "$infomation",
  //     },
  //     {
  //       $group: {
  //         _id: "$_id",
  //         full_name: { $first: "$full_name" },
  //         infomation: { $push: "$infomation" },
  //       },
  //     },
  //     // Thêm lookup để lấy số lượng người đang follow và người theo dõi
  //     {
  //       $lookup: {
  //         from: "follows",
  //         let: { user_id: "$_id" },
  //         pipeline: [
  //           { $match: { $expr: { $eq: ["$follower", "$$user_id"] } } },
  //           { $count: "following_count" },
  //         ],
  //         as: "following_count",
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: "follows",
  //         let: { user_id: "$_id" },
  //         pipeline: [
  //           { $match: { $expr: { $eq: ["$following", "$$user_id"] } } },
  //           { $count: "follower_count" },
  //         ],
  //         as: "follower_count",
  //       },
  //     },
  //     // Kiểm tra trạng thái follow-back giữa user và user_id_view
  //     {
  //       $lookup: {
  //         from: "follows",
  //         let: { user_id_view: user_id_view, user_id: user_id },
  //         pipeline: [
  //           {
  //             $match: {
  //               $expr: {
  //                 $and: [
  //                   { $eq: ["$follower", "$$user_id_view"] },
  //                   { $eq: ["$following", "$$user_id"] },
  //                 ],
  //               },
  //             },
  //           },
  //         ],
  //         as: "is_following",
  //       },
  //     },
  //     {
  //       $addFields: {
  //         is_following: { $gt: [{ $size: "$is_following" }, 0] }, // Kiểm tra nếu đã follow hay chưa
  //         following_count: {
  //           $ifNull: [
  //             { $arrayElemAt: ["$following_count.following_count", 0] },
  //             0,
  //           ],
  //         },
  //         follower_count: {
  //           $ifNull: [
  //             { $arrayElemAt: ["$follower_count.follower_count", 0] },
  //             0,
  //           ],
  //         },
  //         is_viewing_self: {
  //           $eq: ["$_id", new mongoose.Types.ObjectId(user_id)],
  //         }, // Kiểm tra xem có phải chính mình không
  //         description: {
  //           $ifNull: ["$information.des", null],
  //         },
  //       },
  //     },
  //   ]);

  //   return infomation;
  // }

  async getInfomation(id, userViewId) {
    let pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id || userViewId) } },
      {
        $addFields: {
          description: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$infomation",
                  as: "info",
                  cond: { $eq: ["$$info.key", "des"] } // Lọc các phần tử có key là "des"
                }
              },
              0 // Lấy phần tử đầu tiên trong mảng đã lọc
            ]
          }
        }
      },
      //follows
      {
        $lookup: {
          from: "follows",
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                $or: [
                  {
                    follower: new mongoose.Types.ObjectId(id || userViewId),
                  },
                  {
                    following: new mongoose.Types.ObjectId(id || userViewId),
                  },
                ],
              },
            },
          ],
          as: "follows",
        },
      },
      {
        $addFields: {
          followingCount: {
            $size: {
              $filter: {
                input: "$follows",
                as: "follow",
                cond: { $eq: ["$$follow.following", new mongoose.Types.ObjectId(userViewId)] }
              }
            }
          },
          followerCount: {
            $size: {
              $filter: {
                input: "$follows",
                as: "follow",
                cond: { $eq: ["$$follow.follower", new mongoose.Types.ObjectId(userViewId)] }
              }
            }
          }
        }
      },
      //posts count
      {
        $lookup: {
          from: "posts",
          let: { user_id: "$_id" },
          pipeline: [{ $match: { account_id: new mongoose.Types.ObjectId(id || userViewId) } }],
          as: "posts",
        },
      },
      {
        $addFields: {
          postCount: { $size: "$posts" },
        },
      },
      //project
      {
        $project: {
          _id: 1,
          fullname: { $concat: ["$last_name", " ", "$first_name"] },
          email: 1,
          phone: 1,
          avatar: 1,
          infomation: !id
            ? 1
            : {
                $filter: {
                  input: "$infomation",
                  as: "info",
                  cond: { $eq: ["$$info.privacy_status", "public"] },
                }
              },
          avatar: 1,
          followingCount: 1,
          followerCount: 1,
          follows: 1,
          postCount: 1,
          nickname: { $cond: { if: { $ne: [id, null] }, then: 1, else: "$$REMOVE" } },
          description: { $cond: { if: { $ne: [id, null] }, then: "$description.value", else: "$$REMOVE" } }
        },
      },
    ];
    const result = await Account.aggregate(pipeline);    
    if (result.length === 0) {
      throw new ErrorResponse({
        message: "User not found",
        code: 400,
      });
    }
    const {follows,...infomations} = result[0];
    const isFollowing = follows.some(
      (item) =>
        item.follower.toString() === userViewId &&
        item.following.toString() === id
    )
    id && (infomations.isFollowing = isFollowing)
    infomations.isSelf = !id
    return infomations
  }
}

module.exports = new InfomationService();
/*
  1/ avt, tên, nickname, số ng theo dõi, số ng đang theo dõi, mô tả, số post của user_id_view

  2/ thông tin cá nhân của user_id_view
 */
