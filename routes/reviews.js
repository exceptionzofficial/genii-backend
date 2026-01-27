const express = require('express');
const router = express.Router();
const {
    createReview,
    getAllReviews,
    deleteReview,
    updateReview
} = require('../services/dynamodb');

// @route   GET /api/reviews
// @desc    Get all reviews
// @access  Public
router.get('/', async (req, res) => {
    try {
        const reviews = await getAllReviews();
        res.json({
            success: true,
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get reviews',
            error: error.message
        });
    }
});

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Admin
router.post('/', async (req, res) => {
    try {
        const { userName, studentClass, rating, comment } = req.body;

        if (!userName || !rating || !comment) {
            return res.status(400).json({
                success: false,
                message: 'User name, rating and comment are required'
            });
        }

        const reviewData = {
            userName,
            studentClass: studentClass || '',
            rating: parseInt(rating) || 5,
            comment,
            status: 'active'
        };

        const review = await createReview(reviewData);

        res.status(201).json({
            success: true,
            message: 'Review added successfully',
            data: review
        });
    } catch (error) {
        console.error('Create review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add review',
            error: error.message
        });
    }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Admin
router.put('/:id', async (req, res) => {
    try {
        const updates = {};
        const allowedFields = ['userName', 'studentClass', 'rating', 'comment', 'status'];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        const updatedReview = await updateReview(req.params.id, updates);

        res.json({
            success: true,
            message: 'Review updated successfully',
            data: updatedReview
        });
    } catch (error) {
        console.error('Update review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update review',
            error: error.message
        });
    }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Admin
router.delete('/:id', async (req, res) => {
    try {
        await deleteReview(req.params.id);
        res.json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
            error: error.message
        });
    }
});

module.exports = router;
