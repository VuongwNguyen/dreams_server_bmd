class UpSertPostService {
  async createPost({
    parent_id,
    user_id,
    content,
    privacy_status = "private",
    tagUsers = [],
    hashtags = [],
    videos = [],
    images = [],
    title,
  }) {
    // throw new Error("Not implemented");
    let user = null;
    let parentPost = null;

    if (parent_id) {
      parentPost = await Post.findOne({ _id: parent_id }).lean();
    }

    user = await Account.findOne({ _id: user_id }).lean();

    if (!user) {
      throw new ErrorResponse({ message: "User doesn't exist" });
    }

    const arrHashtags = [];

    if (Array.isArray(hashtags)) {
      for (const hashtag of hashtags) {
        const tag = await Hashtag.findOneAndUpdate(
          { title: hashtag },
          { title: hashtag },
          { upsert: true, new: true }
        );

        arrHashtags.push(tag._id);
      }
    } else {
      const tag = await Hashtag.findOneAndUpdate(
        { title: hashtags },
        { title: hashtags },
        { upsert: true, new: true }
      );

      arrHashtags.push(tag._id);
    }

    if (!parentPost && !content) {
      throw new ErrorResponse({ message: "Content is required" });
    }

    const newPost = await Post.create({
      content,
      account_id: user_id,
      parent_post_id: parentPost?.parent_post_id
        ? parentPost.parent_post_id
        : parentPost?._id,
      privacy_status,
      tagUsers: tagUsers,
      hashtags: arrHashtags,
      videos,
      images,
      title,
    });

    // const tokens = await Follow.aggregate([
    //   {
    //     $match: {
    //       following: user_id,
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "Account",
    //       localField: "follower",
    //       foreignField: "_id",
    //       pipeline: [
    //         {
    //           $match: {
    //             fcm_token: { $ne: null },
    //           },
    //         },
    //         {
    //           $project: {
    //             _id: 1,
    //             fcm_token: 1,
    //           },
    //         },
    //       ],
    //       as: "user",
    //     },
    //   },
    //   {
    //     $unwind: "$user",
    //   },
    //   {
    //     $group: {
    //       _id: "$following",
    //       fcm_tokens: {
    //         $push: "$user.fcm_token",
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       fcm_tokens: 1,
    //     },
    //   },
    // ]);

    // const chunks = _.chunk(tokens.tokens, 500);

    // chunks.forEach(function (chunk) {
    //   notificationWorker.add({ tokens: chunk });
    // });

    return newPost;
  }

  async setPostViewed({ user_id, post_id }) {
    const user = await Account.findOne({ _id: user_id });

    if (!user)
      throw new ErrorResponse({ message: "User not found", code: 401 });

    const post = await Post.findOne({ _id: post_id });

    if (!post)
      throw new ErrorResponse({ message: "Post not found", code: 401 });

    if (user.post_viewed?.includes(post_id)) return;

    user.post_viewed?.push(post_id);

    await user.save();
  }

  async countViewPost({ post_id }) {
    const post = await Post.findOne({ _id: post_id });

    if (!post)
      throw new ErrorResponse({ message: "Post not found", code: 404 });

    post.view_count += 1;

    await post.save();
  }

  async likePost({ user_id, post_id }) {
    const user = await Account.findOne({ _id: user_id });

    if (!user)
      throw new ErrorResponse({ message: "User not found", code: 401 });

    const post = await Post.findOne({ _id: post_id });

    if (!post)
      throw new ErrorResponse({ message: "Post not found", code: 401 });

    if (post.like.includes(user_id)) {
      // nếu đã like rồi thì bỏ like
      post.like = post.like.filter((id) => id !== user_id); // loại bỏ id user khỏi mảng like
    } else {
      post.like.push(user_id); // thêm id user vào mảng like
    }

    await post.save();
  }
}
