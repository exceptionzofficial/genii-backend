const express = require('express');
const router = express.Router();
const {
    createNotification,
    getNotifications
} = require('../services/dynamodb');

// @route   GET /api/notifications
// @desc    Get notifications with optional filtering
// @access  Public (filtered by client)
router.get('/', async (req, res) => {
    try {
        const { classId, board } = req.query;
        const notifications = await getNotifications({ classId, board });
        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

// @route   POST /api/notifications
// @desc    Create and send a notification
// @access  Admin
router.post('/', async (req, res) => {
    try {
        const { title, message, targetClasses, targetBoard } = req.body;

        if (!title || !message || !targetClasses || !targetBoard) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const notificationData = {
            title,
            message,
            targetClasses, // Array: ['10', '12', 'all']
            targetBoard,  // String: 'state', 'cbse', 'all'
            status: 'sent',
            recipients: 0 // In a real app, this would be calculated
        };

        const notification = await createNotification(notificationData);

        res.status(201).json({
            success: true,
            message: 'Notification sent successfully',
            data: notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});

module.exports = router;
