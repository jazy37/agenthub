const { Queue } = require('bullmq');
const Redis = require('ioredis');

// Setup Redis connection for BullMQ
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Create the document processing queue
const documentQueue = new Queue('documentProcessing', { connection });

console.log('📦 BullMQ Document Queue initialized');

module.exports = {
    documentQueue,
    connection
};
