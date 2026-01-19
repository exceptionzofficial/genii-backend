require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');

const app = express();

// CORS configuration
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        process.env.ADMIN_URL || 'http://localhost:5174',
        'http://localhost:3000'
    ],
    credentials: true
}));

// Body parser - increased limits for large files
app.use(express.json({ limit: '5000mb' }));
app.use(express.urlencoded({ extended: true, limit: '5000mb' }));

// File upload middleware - increased for video uploads
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB max for videos
    abortOnLimit: true,
    responseOnLimit: 'File size too large. Maximum 5GB allowed.'
}));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/pricing', require('./routes/pricing'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Genii Backend is running',
        database: 'AWS DynamoDB',
        storage: 'AWS S3'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Genii Books API',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            content: '/api/content',
            upload: '/api/upload',
            pricing: '/api/pricing',
            orders: '/api/orders',
            users: '/api/users'
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                   GENII BOOKS BACKEND                     ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  Server running on port: ${PORT}                              ║`);
    console.log(`║  Environment: ${process.env.NODE_ENV || 'development'}                            ║`);
    console.log(`║  API Base URL: http://localhost:${PORT}                       ║`);
    console.log('║  Database: AWS DynamoDB                                   ║');
    console.log('║  Storage: AWS S3                                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
});
