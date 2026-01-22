const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrderById,
    updateOrder,
    getAllOrders,
    getOrdersByPhone
} = require('../services/dynamodb');
const auth = require('../middleware/auth');

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const {
            orderType,
            items,
            classId,
            packageType,
            amount,
            paymentMethod,
            paymentStatus,
            orderStatus,
            deliveryAddress
        } = req.body;

        if (!orderType || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Order type and amount are required'
            });
        }

        const orderData = {
            phone: req.user.phone,
            orderType, // 'digital' or 'hardcopy'
            items: items || [],
            classId: classId || '',
            packageType: packageType || '',
            amount: parseFloat(amount),
            paymentMethod: paymentMethod || 'online',
            paymentStatus: paymentStatus || 'pending', // Accept from request or default to pending
            orderStatus: orderStatus || 'pending', // Accept from request or default to pending
            deliveryAddress: deliveryAddress || null,
            trackingId: null
        };

        const order = await createOrder(orderData);

        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: order
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
});

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const orders = await getOrdersByPhone(req.user.phone);

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: error.message
        });
    }
});

// @route   GET /api/orders/admin
// @desc    Get all orders (admin)
// @access  Admin
router.get('/admin', async (req, res) => {
    try {
        const { orderType, orderStatus } = req.query;

        const orders = await getAllOrders({ orderType, orderStatus });

        res.json({
            success: true,
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Get admin orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get orders',
            error: error.message
        });
    }
});

// @route   GET /api/orders/stats
// @desc    Get order statistics
// @access  Admin
router.get('/stats', async (req, res) => {
    try {
        const orders = await getAllOrders({});

        const stats = {
            totalOrders: orders.length,
            digitalOrders: orders.filter(o => o.orderType === 'digital').length,
            hardcopyOrders: orders.filter(o => o.orderType === 'hardcopy').length,
            pendingOrders: orders.filter(o => o.orderStatus === 'pending').length,
            completedOrders: orders.filter(o => o.orderStatus === 'completed' || o.orderStatus === 'delivered').length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.amount || 0), 0)
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get statistics',
            error: error.message
        });
    }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const order = await getOrderById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if user owns the order or is admin
        if (order.phone !== req.user.phone && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this order'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get order',
            error: error.message
        });
    }
});

// @route   PUT /api/orders/:id
// @desc    Update order status
// @access  Admin
router.put('/:id', async (req, res) => {
    try {
        const { orderStatus, paymentStatus, trackingId } = req.body;

        const order = await getOrderById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const updates = {};
        if (orderStatus) updates.orderStatus = orderStatus;
        if (paymentStatus) updates.paymentStatus = paymentStatus;
        if (trackingId) updates.trackingId = trackingId;

        const updatedOrder = await updateOrder(req.params.id, updates);

        res.json({
            success: true,
            message: 'Order updated successfully',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: error.message
        });
    }
});

module.exports = router;
