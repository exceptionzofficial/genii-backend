/**
 * DynamoDB Table Creation Script
 * Run this script once to create all required tables
 * 
 * Usage: node scripts/createTables.js
 */

require('dotenv').config();
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const tables = [
    {
        TableName: 'genii-content',
        KeySchema: [
            { AttributeName: 'contentId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'contentId', AttributeType: 'S' },
            { AttributeName: 'classId', AttributeType: 'S' },
            { AttributeName: 'type', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'classId-index',
                KeySchema: [
                    { AttributeName: 'classId', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            },
            {
                IndexName: 'type-index',
                KeySchema: [
                    { AttributeName: 'type', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'genii-pricing',
        KeySchema: [
            { AttributeName: 'classId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'classId', AttributeType: 'S' }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    },
    {
        TableName: 'genii-orders',
        KeySchema: [
            { AttributeName: 'orderId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'orderId', AttributeType: 'S' },
            { AttributeName: 'phone', AttributeType: 'S' },
            { AttributeName: 'createdAt', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'phone-index',
                KeySchema: [
                    { AttributeName: 'phone', KeyType: 'HASH' },
                    { AttributeName: 'createdAt', KeyType: 'RANGE' }
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    }
];

async function tableExists(tableName) {
    try {
        await client.send(new DescribeTableCommand({ TableName: tableName }));
        return true;
    } catch (error) {
        if (error.name === 'ResourceNotFoundException') {
            return false;
        }
        throw error;
    }
}

async function createTable(tableConfig) {
    const { TableName } = tableConfig;

    console.log(`\n📋 Checking table: ${TableName}`);

    if (await tableExists(TableName)) {
        console.log(`   ✅ Table already exists: ${TableName}`);
        return;
    }

    try {
        console.log(`   🔨 Creating table: ${TableName}`);
        await client.send(new CreateTableCommand(tableConfig));
        console.log(`   ✅ Table created successfully: ${TableName}`);

        // Wait for table to be active
        console.log(`   ⏳ Waiting for table to be active...`);
        let active = false;
        while (!active) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const response = await client.send(new DescribeTableCommand({ TableName }));
            if (response.Table.TableStatus === 'ACTIVE') {
                active = true;
                console.log(`   ✅ Table is now active: ${TableName}`);
            }
        }
    } catch (error) {
        console.error(`   ❌ Error creating table ${TableName}:`, error.message);
        throw error;
    }
}

async function main() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║      GENII BOOKS - DynamoDB Table Creation Script      ║');
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log(`║  Region: ${process.env.AWS_REGION || 'ap-south-1'}                                    ║`);
    console.log('╚════════════════════════════════════════════════════════╝');

    console.log('\n🚀 Starting table creation...\n');
    console.log('Note: genii-users table should already exist (created manually)');

    try {
        for (const table of tables) {
            await createTable(table);
        }

        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║           ✅ All tables created successfully!          ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');

        console.log('Tables summary:');
        console.log('  • genii-users    (PK: phone)     - Existing');
        console.log('  • genii-content  (PK: contentId) - Created');
        console.log('  • genii-pricing  (PK: classId)   - Created');
        console.log('  • genii-orders   (PK: orderId)   - Created');

    } catch (error) {
        console.error('\n❌ Table creation failed:', error.message);
        process.exit(1);
    }
}

main();
