const express = require('express');
const router = express.Router();
const {
    createContent,
    getContentById,
    updateContent,
    deleteContent,
    getAllContent
} = require('../services/dynamodb');
const { deleteFile, getKeyFromUrl } = require('../services/s3');

// @route   GET /api/content
// @desc    Get all published content
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { classId, board, type, subject, search } = req.query;

        let content = await getAllContent({
            classId,
            board,
            type,
            subject,
            status: 'published'
        });

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            content = content.filter(c =>
                c.title.toLowerCase().includes(searchLower) ||
                (c.description && c.description.toLowerCase().includes(searchLower))
            );
        }

        res.json({
            success: true,
            count: content.length,
            data: content
        });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content',
            error: error.message
        });
    }
});

// @route   GET /api/content/admin
// @desc    Get all content (including drafts) for admin
// @access  Admin
router.get('/admin', async (req, res) => {
    try {
        const { classId, board, type, subject, status } = req.query;

        const content = await getAllContent({ classId, board, type, subject, status });

        res.json({
            success: true,
            count: content.length,
            data: content
        });
    } catch (error) {
        console.error('Get admin content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content',
            error: error.message
        });
    }
});

// @route   GET /api/content/stats
// @desc    Get content statistics
// @access  Admin
router.get('/stats', async (req, res) => {
    try {
        const content = await getAllContent({});

        const stats = {
            totalContent: content.length,
            totalPDFs: content.filter(c => c.type === 'pdf').length,
            totalVideos: content.filter(c => c.type === 'video').length,
            published: content.filter(c => c.status === 'published').length,
            drafts: content.filter(c => c.status === 'draft').length,
            totalViews: content.reduce((sum, c) => sum + (c.views || 0), 0),
            totalPurchases: content.reduce((sum, c) => sum + (c.purchases || 0), 0)
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});

// @route   GET /api/content/:id
// @desc    Get single content by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const content = await getContentById(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Increment views
        await updateContent(req.params.id, { views: (content.views || 0) + 1 });

        res.json({
            success: true,
            data: content
        });
    } catch (error) {
        console.error('Get content by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get content',
            error: error.message
        });
    }
});

// @route   POST /api/content
// @desc    Create new content
// @access  Admin
router.post('/', async (req, res) => {
    try {
        const {
            title,
            description,
            type,
            classId,
            board,
            subject,
            fileUrl,
            thumbnailUrl,
            fileKey,
            chapters,
            pages,
            lessons,
            duration,
            previewPages,
            status
        } = req.body;

        if (!title || !type || !classId || !subject) {
            return res.status(400).json({
                success: false,
                message: 'Title, type, class and subject are required'
            });
        }

        const contentData = {
            title,
            description: description || '',
            type,
            classId,
            board: board || null,
            subject,
            fileUrl: fileUrl || '',
            thumbnailUrl: thumbnailUrl || '',
            fileKey: fileKey || '',
            chapters: parseInt(chapters) || 0,
            pages: parseInt(pages) || 0,
            lessons: parseInt(lessons) || 0,
            duration: duration || '',
            previewPages: parseInt(previewPages) || 5,
            status: status || 'draft'
        };

        const content = await createContent(contentData);

        res.status(201).json({
            success: true,
            message: 'Content created successfully',
            data: content
        });
    } catch (error) {
        console.error('Create content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create content',
            error: error.message
        });
    }
});

// @route   PUT /api/content/:id
// @desc    Update content
// @access  Admin
router.put('/:id', async (req, res) => {
    try {
        const content = await getContentById(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        const updates = {};
        const allowedFields = [
            'title', 'description', 'classId', 'board', 'subject',
            'fileUrl', 'thumbnailUrl', 'fileKey', 'chapters', 'pages',
            'lessons', 'duration', 'previewPages', 'status'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const updatedContent = await updateContent(req.params.id, updates);

        res.json({
            success: true,
            message: 'Content updated successfully',
            data: updatedContent
        });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update content',
            error: error.message
        });
    }
});

// @route   PUT /api/content/:id/status
// @desc    Toggle content publish status
// @access  Admin
router.put('/:id/status', async (req, res) => {
    try {
        const content = await getContentById(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        const newStatus = content.status === 'published' ? 'draft' : 'published';
        const updatedContent = await updateContent(req.params.id, { status: newStatus });

        res.json({
            success: true,
            message: `Content ${newStatus}`,
            data: updatedContent
        });
    } catch (error) {
        console.error('Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
});

// @route   DELETE /api/content/:id
// @desc    Delete content
// @access  Admin
router.delete('/:id', async (req, res) => {
    try {
        const content = await getContentById(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: 'Content not found'
            });
        }

        // Delete files from S3 if they exist
        if (content.fileKey) {
            try {
                await deleteFile(content.fileKey);
            } catch (e) {
                console.log('File delete error (may not exist):', e.message);
            }
        }

        if (content.thumbnailUrl) {
            const thumbKey = getKeyFromUrl(content.thumbnailUrl);
            if (thumbKey) {
                try {
                    await deleteFile(thumbKey);
                } catch (e) {
                    console.log('Thumbnail delete error:', e.message);
                }
            }
        }

        await deleteContent(req.params.id);

        res.json({
            success: true,
            message: 'Content deleted successfully'
        });
    } catch (error) {
        console.error('Delete content error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete content',
            error: error.message
        });
    }
});

module.exports = router;
