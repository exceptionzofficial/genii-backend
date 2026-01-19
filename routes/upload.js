const express = require('express');
const router = express.Router();
const { uploadFile, deleteFile, getKeyFromUrl, getUploadPresignedUrl } = require('../services/s3');

// @route   POST /api/upload/presigned
// @desc    Get presigned URL for direct S3 upload
// @access  Admin
router.post('/presigned', async (req, res) => {
    try {
        const { fileName, fileType, folder } = req.body;

        if (!fileName || !fileType || !folder) {
            return res.status(400).json({
                success: false,
                message: 'fileName, fileType, and folder are required'
            });
        }

        // Validate folder
        const allowedFolders = ['pdfs', 'videos', 'thumbnails'];
        if (!allowedFolders.includes(folder)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid folder. Must be pdfs, videos, or thumbnails'
            });
        }

        const result = await getUploadPresignedUrl(fileName, folder, fileType);

        res.json({
            success: true,
            message: 'Presigned URL generated',
            data: result
        });
    } catch (error) {
        console.error('Presigned URL error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate presigned URL',
            error: error.message
        });
    }
});

// @route   POST /api/upload/pdf
// @desc    Upload PDF to S3 (small files only)
// @access  Admin
router.post('/pdf', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.files.file;

        // Validate file type
        if (file.mimetype !== 'application/pdf') {
            return res.status(400).json({
                success: false,
                message: 'Only PDF files are allowed'
            });
        }

        // Upload to S3
        const result = await uploadFile(file, 'pdfs');

        res.json({
            success: true,
            message: 'PDF uploaded successfully',
            data: {
                url: result.url,
                key: result.key,
                size: result.size
            }
        });
    } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({
            success: false,
            message: 'PDF upload failed',
            error: error.message
        });
    }
});

// @route   POST /api/upload/video
// @desc    Upload Video to S3 (small files, use presigned for large)
// @access  Admin
router.post('/video', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.files.file;

        // Validate file type
        const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Only video files (MP4, WebM, MOV, AVI) are allowed'
            });
        }

        console.log(`Uploading video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        // Upload to S3
        const result = await uploadFile(file, 'videos');

        res.json({
            success: true,
            message: 'Video uploaded successfully',
            data: {
                url: result.url,
                key: result.key,
                size: result.size
            }
        });
    } catch (error) {
        console.error('Video upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Video upload failed',
            error: error.message
        });
    }
});

// @route   POST /api/upload/thumbnail
// @desc    Upload thumbnail image to S3
// @access  Admin
router.post('/thumbnail', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const file = req.files.file;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Only image files (JPEG, PNG, WebP) are allowed'
            });
        }

        // Upload to S3
        const result = await uploadFile(file, 'thumbnails');

        res.json({
            success: true,
            message: 'Thumbnail uploaded successfully',
            data: {
                url: result.url,
                key: result.key
            }
        });
    } catch (error) {
        console.error('Thumbnail upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Thumbnail upload failed',
            error: error.message
        });
    }
});

// @route   DELETE /api/upload
// @desc    Delete file from S3
// @access  Admin
router.delete('/', async (req, res) => {
    try {
        const { url, key } = req.body;

        const fileKey = key || getKeyFromUrl(url);

        if (!fileKey) {
            return res.status(400).json({
                success: false,
                message: 'File key or URL is required'
            });
        }

        await deleteFile(fileKey);

        res.json({
            success: true,
            message: 'File deleted successfully'
        });
    } catch (error) {
        console.error('File delete error:', error);
        res.status(500).json({
            success: false,
            message: 'File deletion failed',
            error: error.message
        });
    }
});

module.exports = router;
