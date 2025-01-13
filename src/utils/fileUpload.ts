import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary({
  fileBuffer,
  folder,
  filename,
  mimetype,
}: {
  fileBuffer: Buffer;
  folder: string;
  filename: string;
  mimetype: string;
}) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: filename,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            // console.error("Cloudinary Upload Error:", error);
            reject(error);
          } else if (result) {
            // console.info("Cloudinary Upload Success:", result);
            resolve(result.secure_url);
          } else {
            reject(new Error('Upload failed, result is undefined'));
          }
        }
      )
      .end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { invalidate: true },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Delete Error:', error);
          reject(error);
        } else if (result && result.result === 'ok') {
          console.info('Cloudinary Delete Success:', result);
          resolve();
        } else {
          reject(
            new Error('Delete failed, unexpected result: ' + result?.result)
          );
        }
      }
    );
  });
}
