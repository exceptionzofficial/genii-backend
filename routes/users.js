const express = require('express');
const router = express.Router();
const { getAllUsers, getUserByPhone } = require('../services/dynamodb');

// @route   GET /api/users
// @desc    Get all users
// @access  Admin
router.get('/', async (req, res) => {
    try {
        const { classId, board } = req.query;

        const users = await getAllUsers({ classId, board });

        // Remove passwords from response
        const safeUsers = users.map(u => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
        });

        res.json({
            success: true,
            count: safeUsers.length,
            data: safeUsers
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: error.message
        });
    }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Admin
router.get('/stats', async (req, res) => {
    try {
        const users = await getAllUsers({});

        const stats = {
            totalUsers: users.length,
            classDistribution: {
                class10: users.filter(u => u.classId === 'class10').length,
                class11: users.filter(u => u.classId === 'class11').length,
                class12: users.filter(u => u.classId === 'class12').length,
                neet: users.filter(u => u.classId === 'neet').length
            },
            boardDistribution: {
                state: users.filter(u => u.board === 'state').length,
                cbse: users.filter(u => u.board === 'cbse').length
            },
            newUsersToday: users.filter(u => {
                const today = new Date().toISOString().split('T')[0];
                return u.createdAt && u.createdAt.startsWith(today);
            }).length
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});

// @route   GET /api/users/:phone
// @desc    Get user by phone
// @access  Admin
router.get('/:phone', async (req, res) => {
    try {
        const user = await getUserByPhone(req.params.phone);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { password, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
});

module.exports = router;
