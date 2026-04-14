import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './ENV.js';

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image buffer or file path to Cloudinary
 * @param {Buffer|String} file - Buffer or path to the file
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadImage = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: 'timphongtro/rooms',
    });
    return result;
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param {String} publicId - The public ID of the image
 */
export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary Delete Error:', error);
    throw error;
  }
};

export default cloudinary;
