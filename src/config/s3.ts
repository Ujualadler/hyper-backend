import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { config } from "dotenv";
import  ffmpeg from 'fluent-ffmpeg';
import fs from 'fs-extra'
import { v4 as uuidv4 } from 'uuid'
config();

import path from 'path';

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION; 
const accessKeyId = process.env.AWS_ACCESS_KEY as string;
const secretAccessKey = process.env.AWS_SECRET_KEY as string;

const s3 = new S3Client({
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  region,
});

export const uploadFile = async (file: Express.Multer.File, folder: string) => { 
    const fileStream = fs.createReadStream(file.path);

    let filePath = file.filename; 

    if(folder) filePath = `${folder}/${filePath}`;

    console.log("filepath", filePath);

    const uploadParams = new PutObjectCommand({
        Bucket: bucketName,
        Key: filePath,
        Body: fileStream,
        ContentType: file.mimetype,
    });

  try {
    await s3.send(uploadParams);
    console.log(
      "Successfully uploaded data to " + bucketName + "/" + file.filename
    );
    // Delete file from local uploads folder
    fs.unlinkSync(file.path);
  } catch (err) {
    console.error("error s3:", err);
  }
};

export const uploadAssessment = async (file: Express.Multer.File) => {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = new PutObjectCommand({
    Bucket: bucketName,
    Key: `quiz/${file.originalname}`,
    Body: fileStream,
    ContentType: file.mimetype,
  });

  try {
    await s3.send(uploadParams);
    console.log(
      "Successfully uploaded data to " + bucketName + "/" + file.filename
    );
    // Delete file from local uploads folder
    fs.unlinkSync(file.path);
  } catch (err) {
    console.error("error s3:", err);
  }
};


export const uploadImages = async (file: Express.Multer.File) => {
  const fileStream = fs.createReadStream(file.path);

  const uploadParams = new PutObjectCommand({
    Bucket: bucketName,
    Key: `quiz/${file.filename}`,
    Body: fileStream,
    ContentType: file.mimetype,
  });

  try {
    await s3.send(uploadParams);
    console.log(
      "Successfully uploaded data to " + bucketName + "/" + file.filename
    );
    // Delete file from local uploads folder
    fs.unlinkSync(file.path);
  } catch (err) {
    console.error("error s3:", err);
  }
};

export const deleteFile = async(fileKey: string) => {
  const deleteParams = {
    Bucket: bucketName,
    Key: fileKey,
  };

  const deleteCommand = new DeleteObjectCommand(deleteParams);
  await s3.send(deleteCommand);
  console.log(`Successfully deleted object with key: ${fileKey}`);
}

export const generateSignedUrl = async (fileKey: string) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: fileKey, // The S3 file key you get from the frontend
  });

  // Generate signed URL valid for 60 minutes
  try {
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    console.log("key>>signedUrl", fileKey, signedUrl);
    return signedUrl;
  } catch (e) {
    console.log("Error generating signed url", e);
  }
};

export const getFile = async (file: string) => {
  console.log("s3 details: ", file);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: file,
  });

  try {
    const response = await s3.send(command);
    if (response.Body instanceof Readable) {
      return response.Body; // Return the readable stream
    }
    throw new Error("The file body is not readable.");
  } catch (e) {
    console.log(e);
  }
};

export const getFileProxy = async (fileKey: string) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
    });

    // Fetch file from S3
    const fileStream = await s3.send(command);

    // Ensure the file exists
    if (fileStream.Body) {
      console.log("File successfully fetched from S3:", fileStream);
    } else {
      console.log("No file found for key:", fileKey);
    }

    return fileStream;
  } catch (error) {
    console.log("Error fetching file from S3:", error);
    throw new Error("File fetching failed");
  }
};

// Function to update (rename) the object key in S3
export const updateS3ObjectKey = async (oldKey: string, newKey: string) => {
  console.log("old>>New", oldKey, newKey);
  try {
    // Step 1: Copy the object to the new key
    const copyParams = {
      Bucket: bucketName,
      CopySource: `${bucketName}/${oldKey}`, // Source bucket and key
      Key: newKey, // New destination key
    };

    const copyCommand = new CopyObjectCommand(copyParams);
    await s3.send(copyCommand);
    console.log(`Successfully copied object from ${oldKey} to ${newKey}`);

    // Step 2: Delete the original object
    const deleteParams = {
      Bucket: bucketName,
      Key: oldKey,
    };

    const deleteCommand = new DeleteObjectCommand(deleteParams);
    await s3.send(deleteCommand);
    console.log(`Successfully deleted object with key: ${oldKey}`);
  } catch (error) {
    console.error("Error updating S3 object key:", error);
    throw new Error("Failed to update S3 object key");
  }
};

export const getVideo = async (key: string) => {
  try {
    const params: any = {
      Bucket: bucketName,
      Key: key,
    };

    const command = new GetObjectCommand(params);
    const data = await s3.send(command);

    return { data };
  } catch (e) {
    throw e;
  }
};



export const convertAndUploadToHLS = async (file: Express.Multer.File, folder: string) => {
  const filePath = file.path;
  const uniqueId = uuidv4(); // Generate a unique ID to avoid directory conflicts
  const outputDir = path.resolve(`/home/entab/Desktop/SalesTraining/salestrainingbackend/uploads/${uniqueId}`); // Unique output directory path

  try {
    // Ensure output directory exists
    await fs.ensureDir(outputDir);

    // Create HLS segments and playlist using ffmpeg
    await new Promise<void>((resolve, reject) => { 
      ffmpeg(filePath)
        .videoCodec('libx264') // Encode video with H.264 codec for compatibility
        .audioCodec('aac') // Encode audio with AAC codec
        .outputOptions([
          '-hls_time', '10',
          '-hls_list_size', '0',
          '-f', 'hls',
        ])
        .on('stderr', (stderrLine) => {
          console.log('FFmpeg stderr:', stderrLine); // Log FFmpeg output for more information
        })
        .on('end', () => {
          console.log('HLS conversion finished');
          resolve();
        })
        .on('error', (err) => {
          console.error('Error during HLS conversion:', err);
          reject(err);
        })
        .save(`${outputDir}/output.m3u8`);
    });

    // Read and modify the manifest file to update URLs to absolute URLs
    const manifestPath = `${outputDir}/output.m3u8`;
    let manifestContent = await fs.readFile(manifestPath, 'utf8');
    const baseUrl = `http://localhost:4000/api/video/stream?key=${uniqueId}`;
    manifestContent = manifestContent.replace(/(output\d+\.ts)/g, (match) => {
      return `${baseUrl}/${match}`;
    });

    // Write the updated manifest file back
    await fs.writeFile(manifestPath, manifestContent);

    // Upload HLS segments and modified playlist to S3
    const files = fs.readdirSync(outputDir);
    for (const fileName of files) {
      const fileStream = fs.createReadStream(`${outputDir}/${fileName}`);
      const s3Path = `${folder}/${uniqueId}/${fileName}`;

      const uploadParams = new PutObjectCommand({ 
        Bucket: bucketName,
        Key: s3Path, 
        Body: fileStream,
        ContentType: fileName.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/MP2T',
      });

      await s3.send(uploadParams);
      console.log('Successfully uploaded data to ' + bucketName + '/' + s3Path);
    }

    // Delete local files after upload
    fs.unlinkSync(filePath); // Delete original video
    await fs.remove(outputDir); // Delete HLS output directory
    return { url: `${uniqueId}/output.m3u8` }
  } catch (err) {
    console.error('Error during HLS conversion or upload:', err);
  }
};