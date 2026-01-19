const jwt = require('jsonwebtoken');
const { getUserByPhone } = require('../services/dynamodb');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token, authorization denied'
            });
        }

        const token = authHeader.replace('Bearer ', '');

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from DynamoDB
        const user = await getUserByPhone(decoded.phone);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        // Attach user to request (without password)
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};

module.exports = auth;
