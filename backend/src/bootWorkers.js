// Script to boot up background workers independently
require('dotenv').config();

// Ensure db and other services have envs loaded before firing
console.log('🚀 Booting up BullMQ Workers...');

// Require workers here to keep them running
require('./workers/documentWorker');

console.log('👁️  Workers are running and waiting for jobs...');
