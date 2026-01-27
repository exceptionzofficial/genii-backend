const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { S3Client } = require('@aws-sdk/client-s3');

// AWS Configuration
const awsConfig = {
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
};

// DynamoDB Client
const dynamoDBClient = new DynamoDBClient(awsConfig);

// DynamoDB Document Client (for easier operations)
const docClient = DynamoDBDocumentClient.from(dynamoDBClient, {
    marshallOptions: {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true
    },
    unmarshallOptions: {
        wrapNumbers: false
    }
});

// S3 Client
const s3Client = new S3Client(awsConfig);

// Table names
const TABLES = {
    USERS: process.env.DYNAMODB_USERS_TABLE || 'genii-users',
    CONTENT: process.env.DYNAMODB_CONTENT_TABLE || 'genii-content',
    PRICING: process.env.DYNAMODB_PRICING_TABLE || 'genii-pricing',
    ORDERS: process.env.DYNAMODB_ORDERS_TABLE || 'genii-orders',
    REVIEWS: process.env.DYNAMODB_REVIEWS_TABLE || 'genii-reviews',
    NOTIFICATIONS: process.env.DYNAMODB_NOTIFICATIONS_TABLE || 'genii-notifications'
};

// S3 Bucket
const S3_BUCKET = process.env.S3_BUCKET_NAME || 'genii-assets';

module.exports = {
    dynamoDBClient,
    docClient,
    s3Client,
    TABLES,
    S3_BUCKET
};
