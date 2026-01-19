/**
 * S3 Service - File upload and management with Presigned URLs
 */
const {
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, S3_BUCKET } = require('../config/aws');
const path = require('path');
const fs = require('fs');

/**
 * Generate presigned URL for direct upload from browser
 * @param {string} fileName - Original file name
 * @param {string} folder - Folder in S3 bucket (pdfs, videos, thumbnails)
 * @param {string} contentType - MIME type of the file
 * @returns {Object} Presigned URL and file key
 */
const getUploadPresignedUrl = async (fileName, folder, contentType) => {
    const fileExtension = path.extname(fileName);
    const key = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;

    const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        ContentType: contentType
    });

    // URL expires in 15 minutes
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

    // Construct the public URL
    const publicUrl = `https://${S3_BUCKET}.s3.ap-south-1.amazonaws.com/${key}`;

    return {
        uploadUrl: presignedUrl,
        publicUrl,
        key,
        bucket: S3_BUCKET
    };
};

/**
 * Upload file to S3 (server-side upload for small files)
 * @param {Object} file - File object from express-fileupload
 * @param {string} folder - Folder in S3 bucket (pdfs, videos, thumbnails)
 * @returns {Object} Upload result with URL
 */
const uploadFile = async (file, folder) => {
    const fileExtension = path.extname(file.name);
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}${fileExtension}`;

    // Read file content
    const fileContent = fs.readFileSync(file.tempFilePath);

    const params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Body: fileContent,
        ContentType: file.mimetype
    };

    await s3Client.send(new PutObjectCommand(params));

    // Construct the public URL
    const url = `https://${S3_BUCKET}.s3.ap-south-1.amazonaws.com/${fileName}`;

    return {
        url,
        key: fileName,
        bucket: S3_BUCKET,
        size: file.size,
        contentType: file.mimetype
    };
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key (file path)
 */
const deleteFile = async (key) => {
    const params = {
        Bucket: S3_BUCKET,
        Key: key
    };

    await s3Client.send(new DeleteObjectCommand(params));
    return { success: true };
};

/**
 * Get signed URL for private file access
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiry in seconds (default 1 hour)
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
    const params = {
        Bucket: S3_BUCKET,
        Key: key
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn });

    return url;
};

/**
 * Extract key from S3 URL
 * @param {string} url - Full S3 URL
 */
const getKeyFromUrl = (url) => {
    if (!url) return null;

    // Handle both path-style and virtual-hosted-style URLs
    const bucketUrl = `https://${S3_BUCKET}.s3.ap-south-1.amazonaws.com/`;
    if (url.startsWith(bucketUrl)) {
        return url.replace(bucketUrl, '');
    }

    return null;
};

module.exports = {
    uploadFile,
    deleteFile,
    getPresignedUrl,
    getKeyFromUrl,
    getUploadPresignedUrl
};
