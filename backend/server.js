import express from 'express';
import multer from 'multer';
import cors from 'cors';
import Replicate from 'replicate';
import { fileTypeFromBuffer } from 'file-type';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'express'; // Add this import

const app = express();
const upload = multer();
app.use(cors());
app.use(express.json());

// Load environment variables
import 'dotenv/config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN
});

// Function to upload to ImgBB (for face image)
async function uploadToImgBB(imageBuffer) {
  try {
    const formData = new FormData();
    formData.append('image', imageBuffer.toString('base64'));
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    console.log('ImgBB response:', data);
    if (!data.success) {
      throw new Error('Failed to upload image to ImgBB');
    }
    return data.data.url;
  } catch (error) {
    console.error('ImgBB upload error:', error);
    throw error;
  }
}

// Function to upload to Cloudinary (for video)
async function uploadVideoToCloudinary(videoBuffer) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "video",
        folder: "face-swap-videos"
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(videoBuffer);
  });
}

app.post('/api/swap-face', upload.fields([
  { name: 'face', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('Received request for face swap');
    if (!req.files?.face?.[0] || !req.files?.video?.[0]) {
      console.log('Missing required files');
      return res.status(400).json({ error: 'Please provide both face image and video' });
    }

    const faceFile = req.files.face[0];
    const videoFile = req.files.video[0];
    console.log('Files received:', {
      face: faceFile.originalname,
      video: videoFile.originalname
    });

    // Upload face image to ImgBB
    console.log('Uploading face to ImgBB...');
    const faceUrl = await uploadToImgBB(faceFile.buffer);

    // Upload video to Cloudinary
    console.log('Uploading video to Cloudinary...');
    const videoUrl = await uploadVideoToCloudinary(videoFile.buffer);

    console.log('Files uploaded:', {
      face: faceUrl,
      video: videoUrl
    });

    // Call Replicate API
    console.log('Calling Replicate API...');
    const output = await replicate.run(
      "arabyai-replicate/roop_face_swap:11b6bf0f4e14d808f655e87e5448233cceff10a45f659d71539cafb7163b2e84",
      {
        input: {
          swap_image: faceUrl,
          target_video: videoUrl
        }
      }
    );

    console.log('Replicate API response:', output);
    res.json({ result: output });
  } catch (error) {
    console.error('Detailed error:', error);
    res.status(500).json({ error: 'Failed to process face swap: ' + error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});