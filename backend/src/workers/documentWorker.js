const { Worker } = require('bullmq');
const { connection } = require('../queues/documentQueue');
const { processDocument } = require('../services/documentProcessing.service');
const logger = require('../utils/logger').child({ module: 'worker' });

// Create the worker that will process jobs from 'documentProcessing' queue
const documentWorker = new Worker('documentProcessing', async (job) => {
    logger.info({ jobId: job.id, documentId: job.data.documentId }, 'Job started');

    try {
        const { documentId } = job.data;
        await processDocument(documentId);
        logger.info({ jobId: job.id, documentId }, 'Job completed successfully');
        return { success: true, documentId };
    } catch (error) {
        logger.error({ jobId: job.id, err: error }, 'Job failed');
        throw error;
    }
}, {
    connection,
    concurrency: 2 // Number of documents to process in parallel
});

documentWorker.on('failed', (job, err) => {
    logger.error({ jobId: job.id, err }, 'Job permanently failed');
});

logger.info('BullMQ Document Worker initialized & listening for jobs');

module.exports = { documentWorker };
