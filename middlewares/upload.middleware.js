const cloudinary = require("../config/cloudinary");

class Upload {
  static async uploadVideo(req, res, next) {
    if (req?.file) {
      return next();
    }

    await cloudinary.uploader.upload(
      req.file.path,
      {
        resource_type: "video",
        folder: "videos",
      },
      (err, result) => {
        if (err) {
          return next(err);
        }

        const vid = {
          data: {
            public_id: result.public_id,
            url: result.placeback_url,
          },
          type: "video",
        };

        req.resources = vid;
        next();
      }
    );
  }

  static async uploadImages(req, res, next) {
    if (req?.file || req?.files?.length) {
      return next();
    }

    if (req.file) {
      await cloudinary.uploader.upload(
        req.file.path,
        {
          resource_type: "image",
          folder: "images",
        },
        (err, result) => {
          if (err) {
            return next(err);
          }

          const img = {
            data: {
              public_id: result.public_id,
              url: result.secure_url,
            },
            type: "image",
          };

          req.resources = img;
          next();
        }
      );
    } else if (Array.isArray(req.files)) {
      let images = await Promise.all(
        req.files.map(async (file) => {
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

      images = {
        data: images,
        type: "image",
      };

      req.resources = images;
      next();
    }
  }

  static async deleteResources(err, req, res, next) {
    if (err) {
      if (req.resources) {
        if (Array.isArray(req.resources.data)) {
          await cloudinary.api.delete_resources([
            req.resources.data.map((resource) => resource.public_id),
          ]);
        } else {
          await cloudinary.api.delete_resources([req.resources.data.public_id]);
        }
      }

      return next(err);
    }
  }
}
