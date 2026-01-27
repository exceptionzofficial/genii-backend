/**
 * DynamoDB Service - CRUD operations for all tables
 */
const {
    PutCommand,
    GetCommand,
    UpdateCommand,
    DeleteCommand,
    ScanCommand,
    QueryCommand
} = require('@aws-sdk/lib-dynamodb');
const { docClient, TABLES } = require('../config/aws');

// ==================== USERS ====================

const createUser = async (userData) => {
    const params = {
        TableName: TABLES.USERS,
        Item: {
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        ConditionExpression: 'attribute_not_exists(phone)'
    };

    try {
        await docClient.send(new PutCommand(params));
        return { success: true, data: params.Item };
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return { success: false, error: 'User already exists' };
        }
        throw error;
    }
};

const getUserByPhone = async (phone) => {
    const params = {
        TableName: TABLES.USERS,
        Key: { phone }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
};

const updateUser = async (phone, updates) => {
    const updateExpressions = [];
    const expressionValues = {};
    const expressionNames = {};

    Object.keys(updates).forEach((key, index) => {
        updateExpressions.push(`#field${index} = :value${index}`);
        expressionValues[`:value${index}`] = updates[key];
        expressionNames[`#field${index}`] = key;
    });

    expressionValues[':updatedAt'] = new Date().toISOString();
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';

    const params = {
        TableName: TABLES.USERS,
        Key: { phone },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

const getAllUsers = async (filters = {}) => {
    const params = {
        TableName: TABLES.USERS
    };

    const result = await docClient.send(new ScanCommand(params));
    let users = result.Items || [];

    // Apply filters
    if (filters.classId) {
        users = users.filter(u => u.classId === filters.classId);
    }
    if (filters.board) {
        users = users.filter(u => u.board === filters.board);
    }

    return users;
};

// ==================== CONTENT ====================

const createContent = async (contentData) => {
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const params = {
        TableName: TABLES.CONTENT,
        Item: {
            contentId,
            ...contentData,
            views: 0,
            purchases: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };

    await docClient.send(new PutCommand(params));
    return params.Item;
};

const getContentById = async (contentId) => {
    const params = {
        TableName: TABLES.CONTENT,
        Key: { contentId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
};

const updateContent = async (contentId, updates) => {
    const updateExpressions = [];
    const expressionValues = {};
    const expressionNames = {};

    Object.keys(updates).forEach((key, index) => {
        updateExpressions.push(`#field${index} = :value${index}`);
        expressionValues[`:value${index}`] = updates[key];
        expressionNames[`#field${index}`] = key;
    });

    expressionValues[':updatedAt'] = new Date().toISOString();
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';

    const params = {
        TableName: TABLES.CONTENT,
        Key: { contentId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

const deleteContent = async (contentId) => {
    const params = {
        TableName: TABLES.CONTENT,
        Key: { contentId }
    };

    await docClient.send(new DeleteCommand(params));
    return { success: true };
};

const getAllContent = async (filters = {}) => {
    const params = {
        TableName: TABLES.CONTENT
    };

    const result = await docClient.send(new ScanCommand(params));
    let content = result.Items || [];

    // Apply filters
    if (filters.classId) {
        content = content.filter(c => c.classId === filters.classId);
    }
    if (filters.board) {
        content = content.filter(c => c.board === filters.board);
    }
    if (filters.type) {
        content = content.filter(c => c.type === filters.type);
    }
    if (filters.status) {
        content = content.filter(c => c.status === filters.status);
    }
    if (filters.subject) {
        content = content.filter(c => c.subject === filters.subject);
    }

    // Sort by createdAt descending
    content.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return content;
};

// ==================== PRICING ====================

const getPricing = async (classId) => {
    const params = {
        TableName: TABLES.PRICING,
        Key: { classId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
};

const getAllPricing = async () => {
    const params = {
        TableName: TABLES.PRICING
    };

    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
};

const upsertPricing = async (classId, pricingData) => {
    const params = {
        TableName: TABLES.PRICING,
        Item: {
            classId,
            ...pricingData,
            updatedAt: new Date().toISOString()
        }
    };

    await docClient.send(new PutCommand(params));
    return params.Item;
};

// ==================== ORDERS ====================

const createOrder = async (orderData) => {
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const params = {
        TableName: TABLES.ORDERS,
        Item: {
            orderId,
            ...orderData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };

    await docClient.send(new PutCommand(params));
    return params.Item;
};

const getOrderById = async (orderId) => {
    const params = {
        TableName: TABLES.ORDERS,
        Key: { orderId }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item;
};

const updateOrder = async (orderId, updates) => {
    const updateExpressions = [];
    const expressionValues = {};
    const expressionNames = {};

    Object.keys(updates).forEach((key, index) => {
        updateExpressions.push(`#field${index} = :value${index}`);
        expressionValues[`:value${index}`] = updates[key];
        expressionNames[`#field${index}`] = key;
    });

    expressionValues[':updatedAt'] = new Date().toISOString();
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';

    const params = {
        TableName: TABLES.ORDERS,
        Key: { orderId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

const getAllOrders = async (filters = {}) => {
    const params = {
        TableName: TABLES.ORDERS
    };

    const result = await docClient.send(new ScanCommand(params));
    let orders = result.Items || [];

    // Apply filters
    if (filters.phone) {
        orders = orders.filter(o => o.phone === filters.phone);
    }
    if (filters.orderType) {
        orders = orders.filter(o => o.orderType === filters.orderType);
    }
    if (filters.orderStatus) {
        orders = orders.filter(o => o.orderStatus === filters.orderStatus);
    }

    // Sort by createdAt descending
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return orders;
};

const getOrdersByPhone = async (phone) => {
    const params = {
        TableName: TABLES.ORDERS,
        IndexName: 'phone-index',
        KeyConditionExpression: 'phone = :phone',
        ExpressionAttributeValues: {
            ':phone': phone
        },
        ScanIndexForward: false // Descending order
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
};

// ==================== REVIEWS ====================

const createReview = async (reviewData) => {
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const params = {
        TableName: TABLES.REVIEWS,
        Item: {
            reviewId,
            ...reviewData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
    };

    await docClient.send(new PutCommand(params));
    return params.Item;
};

const getAllReviews = async (filters = {}) => {
    const params = {
        TableName: TABLES.REVIEWS
    };

    const result = await docClient.send(new ScanCommand(params));
    let reviews = result.Items || [];

    // Sort by createdAt descending
    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return reviews;
};

const deleteReview = async (reviewId) => {
    const params = {
        TableName: TABLES.REVIEWS,
        Key: { reviewId }
    };

    await docClient.send(new DeleteCommand(params));
    return { success: true };
};

const updateReview = async (reviewId, updates) => {
    const updateExpressions = [];
    const expressionValues = {};
    const expressionNames = {};

    Object.keys(updates).forEach((key, index) => {
        updateExpressions.push(`#field${index} = :value${index}`);
        expressionValues[`:value${index}`] = updates[key];
        expressionNames[`#field${index}`] = key;
    });

    expressionValues[':updatedAt'] = new Date().toISOString();
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionNames['#updatedAt'] = 'updatedAt';

    const params = {
        TableName: TABLES.REVIEWS,
        Key: { reviewId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeValues: expressionValues,
        ExpressionAttributeNames: expressionNames,
        ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes;
};

module.exports = {
    // Users
    createUser,
    getUserByPhone,
    updateUser,
    getAllUsers,

    // Content
    createContent,
    getContentById,
    updateContent,
    deleteContent,
    getAllContent,

    // Pricing
    getPricing,
    getAllPricing,
    upsertPricing,

    // Orders
    createOrder,
    getOrderById,
    updateOrder,
    getAllOrders,
    getOrdersByPhone,

    // Reviews
    createReview,
    getAllReviews,
    deleteReview,
    updateReview
};
