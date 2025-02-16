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
}): Promise<string> {
  // Create a unique filename using timestamp and sanitized original filename
  const timestamp = new Date().getTime();
  const sanitizedFilename = filename
    .replace(/[^a-zA-Z0-9.]/g, '') // Remove special characters
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
  const uniqueFilename = `${timestamp}-${sanitizedFilename}`;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          public_id: uniqueFilename.split('.')[0], // Remove file extension from public_id
          resource_type: 'auto',
          format: mimetype.split('/')[1], // Extract format from mimetype
          transformation: [
            {
              quality: 'auto:good',
              fetch_format: 'auto',
            },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', {
              error,
              filename: uniqueFilename,
              folder,
            });
            reject(new Error(`Upload failed: ${error.message}`));
          } else if (result) {
            console.info('Cloudinary Upload Success:', {
              publicId: result.public_id,
              url: result.secure_url,
              folder,
            });
            resolve(result.secure_url);
          } else {
            console.error('Cloudinary Upload Failed: No result returned');
            reject(new Error('Upload failed: No result returned'));
          }
        }
      )
      .end(fileBuffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  if (!publicId) {
    console.warn('No public ID provided for deletion');
    return;
  }

  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      {
        invalidate: true,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary Delete Error:', {
            error,
            publicId,
          });
          reject(new Error(`Delete failed: ${error.message}`));
        } else if (result && result.result === 'ok') {
          console.info('Cloudinary Delete Success:', {
            publicId,
            result: result.result,
          });
          resolve();
        } else {
          console.error('Cloudinary Delete Failed:', {
            publicId,
            result: result?.result,
          });
          reject(
            new Error(`Delete failed: Unexpected result - ${result?.result}`)
          );
        }
      }
    );
  });
}

// Helper function to extract public ID from Cloudinary URL
export function getPublicIdFromUrl(url: string): string | null {
  try {
    const regex = /\/v\d+\/([^/]+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
}

// Helper function to validate file before upload
export function validateFile(
  file: { size: number; type: string },
  options = {
    maxSize: 5 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }
): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  if (file.size > options.maxSize) {
    return {
      isValid: false,
      error: `File size exceeds ${options.maxSize / (1024 * 1024)}MB limit`,
    };
  }

  if (!options.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${
        file.type
      } not allowed. Allowed types: ${options.allowedTypes.join(', ')}`,
    };
  }

  return { isValid: true };
}
