import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME as string,
  api_key: process.env.CLOUDINARY_API_KEY as string,
  api_secret: process.env.CLOUDINARY_API_SECRET as string,
});

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}

export const uploadToCloudinary = (
  file: Express.Multer.File,
  folder: string = "booking.com",
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file provided"));

    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error: Error | undefined, result: UploadApiResponse | undefined) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));

        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

export const deleteFromCloudinary = async (
  public_id: string,
): Promise<void> => {
  if (!public_id) return;

  await cloudinary.uploader.destroy(public_id);
};
