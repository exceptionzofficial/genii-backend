const express = require('express');
const router = express.Router();
const { getPricing, getAllPricing, upsertPricing } = require('../services/dynamodb');

// @route   GET /api/pricing
// @desc    Get all pricing
// @access  Public
router.get('/', async (req, res) => {
    try {
        const pricing = await getAllPricing();

        res.json({
            success: true,
            data: pricing
        });
    } catch (error) {
        console.error('Get pricing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pricing',
            error: error.message
        });
    }
});

// @route   GET /api/pricing/:classId
// @desc    Get pricing for specific class
// @access  Public
router.get('/:classId', async (req, res) => {
    try {
        const pricing = await getPricing(req.params.classId);

        if (!pricing) {
            return res.status(404).json({
                success: false,
                message: 'Pricing not found for this class'
            });
        }

        res.json({
            success: true,
            data: pricing
        });
    } catch (error) {
        console.error('Get class pricing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get pricing',
            error: error.message
        });
    }
});

// @route   PUT /api/pricing/:classId
// @desc    Update pricing for a class
// @access  Admin
router.put('/:classId', async (req, res) => {
    try {
        const { pdfPrice, videoPrice, bundlePrice, hardCopyPrice, className, description } = req.body;

        const pricingData = {
            className: className || req.params.classId,
            description: description || '',
            pdfPrice: parseFloat(pdfPrice) || 0,
            videoPrice: parseFloat(videoPrice) || 0,
            bundlePrice: parseFloat(bundlePrice) || 0,
            hardCopyPrice: parseFloat(hardCopyPrice) || 0
        };

        const pricing = await upsertPricing(req.params.classId, pricingData);

        res.json({
            success: true,
            message: 'Pricing updated successfully',
            data: pricing
        });
    } catch (error) {
        console.error('Update pricing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update pricing',
            error: error.message
        });
    }
});

// @route   POST /api/pricing/seed
// @desc    Seed initial pricing data
// @access  Admin
router.post('/seed', async (req, res) => {
    try {
        const defaultPricing = [
            {
                classId: 'class10',
                className: 'Class 10',
                description: 'Complete study materials for Class 10',
                pdfPrice: 499,
                videoPrice: 799,
                bundlePrice: 999,
                hardCopyPrice: 1499
            },
            {
                classId: 'class11',
                className: 'Class 11',
                description: 'Complete study materials for Class 11',
                pdfPrice: 599,
                videoPrice: 899,
                bundlePrice: 1199,
                hardCopyPrice: 1699
            },
            {
                classId: 'class12',
                className: 'Class 12',
                description: 'Complete study materials for Class 12',
                pdfPrice: 699,
                videoPrice: 999,
                bundlePrice: 1399,
                hardCopyPrice: 1899
            },
            {
                classId: 'neet',
                className: 'NEET',
                description: 'Complete NEET preparation materials',
                pdfPrice: 999,
                videoPrice: 1499,
                bundlePrice: 1999,
                hardCopyPrice: 2499
            }
        ];

        for (const pricing of defaultPricing) {
            await upsertPricing(pricing.classId, pricing);
        }

        res.json({
            success: true,
            message: 'Pricing seeded successfully',
            data: defaultPricing
        });
    } catch (error) {
        console.error('Seed pricing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed pricing',
            error: error.message
        });
    }
});

module.exports = router;
