const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createUser, getUserByPhone, updateUser } = require('../services/dynamodb');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password, classId, board, school, pincode } = req.body;

        // Validate required fields
        if (!name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, phone and password are required'
            });
        }

        // Check if user exists
        const existingUser = await getUserByPhone(phone);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this phone number'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const userData = {
            phone,
            name,
            email: email || '',
            password: hashedPassword,
            classId: classId || 'class10',
            board: board || 'state',
            school: school || '',
            pincode: pincode || '',
            role: 'user',
            purchases: []
        };

        const result = await createUser(userData);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.error
            });
        }

        // Create token
        const token = jwt.sign(
            { phone: userData.phone },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = result.data;

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                token,
                user: userWithoutPassword
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone and password are required'
            });
        }

        // Find user
        const user = await getUserByPhone(phone);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = jwt.sign(
            { phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '30d' }
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: userWithoutPassword
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        const user = await getUserByPhone(req.user.phone);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
});

// @route   PUT /api/auth/update
// @desc    Update user profile
// @access  Private
router.put('/update', auth, async (req, res) => {
    try {
        const { name, email, classId, board, school, pincode } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (classId) updates.classId = classId;
        if (board) updates.board = board;
        if (school) updates.school = school;
        if (pincode) updates.pincode = pincode;

        const updatedUser = await updateUser(req.user.phone, updates);

        const { password: _, ...userWithoutPassword } = updatedUser;

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            success: false,
            message: 'Profile update failed',
            error: error.message
        });
    }
});

module.exports = router;
