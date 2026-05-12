const { Queue } = require('bullmq');
const Redis = require('ioredis');

async function check() {
  const connection = new Redis('redis://localhost:6379');
  const queue = new Queue('documentProcessing', { connection });
  
  const failedCount = await queue.getFailedCount();
  const waitingCount = await queue.getWaitingCount();
  const activeCount = await queue.getActiveCount();
  const completedCount = await queue.getCompletedCount();
  
  console.log(`Queue stats:`);
  console.log(`- Failed: ${failedCount}`);
  console.log(`- Waiting: ${waitingCount}`);
  console.log(`- Active: ${activeCount}`);
  console.log(`- Completed: ${completedCount}`);
  
  if (failedCount > 0) {
    const failedJobs = await queue.getFailed(0, 5);
    console.log('\nFailed Jobs:');
    failedJobs.forEach(job => {
      console.log(`Job ${job.id} (Document ${job.data.documentId}) failed with: ${job.failedReason}`);
    });
  }
  
  process.exit(0);
}

check();
