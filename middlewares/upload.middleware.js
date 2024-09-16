const cloudinary = require("../config/cloudinary");
const multer = require("../config/uploader");
const asyncHandler = require("../core/asyncHandler");

class Upload {
  static async deleteResources(err, req, res, next) {
    if (err) {
      try {
        if (req.videos && req.videos.length > 0) {
          await Promise.all(
            req.videos.map((video) =>
              cloudinary.uploader.destroy(video.public_id, {
                resource_type: "video",
              })
            )
          );
        }

        if (req.images && req.images.length > 0) {
          await Promise.all(
            req.images.map((image) =>
              cloudinary.uploader.destroy(image.public_id)
            )
          );
        }
      } catch {
      } finally {
        return next(err);
      }
    }
  }

  static async handleUploadResources(req, res, next) {
    let images = [];
    let videos = [];
    if (req.files?.videos) {
      videos = Promise.all(
        req.files?.videos?.map(async (file) => {
          const video = await cloudinary.uploader.upload(file.path, {
            resource_type: "video",
            folder: "videos",
          });

          return {
            public_id: video.public_id,
            url: video.playback_url,
          };
        })
      );
    }
    if (req.files?.images) {
      images = Promise.all(
        req.files?.images?.map(async (file) => {
          const image = await cloudinary.uploader.upload(file.path, {
            resource_type: "image",
            folder: "images",
          });

          return {
            public_id: image.public_id,
            url: image.secure_url,
          };
        })
      );
    }

    const resources = await Promise.all([videos, images]);

    req.videos = resources[0];
    req.images = resources[1];
    return next();
  }
}

module.exports = Upload;
