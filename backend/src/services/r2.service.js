const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

/**
 * Storage client factory.
 * - Local / development: Cloudflare R2 (S3-compatible, custom endpoint)
 * - Production (NODE_ENV=production): AWS S3 (standard, no endpoint override)
 */
const isProduction = process.env.NODE_ENV === 'production';

const storageClient = new S3Client(
  isProduction
    ? {
      // --- AWS S3 (production) ---
      region: process.env.AWS_REGION || 'eu-central-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    }
    : {
      // --- Cloudflare R2 (local dev) ---
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    }
);

const BUCKET_NAME = isProduction
  ? process.env.AWS_S3_BUCKET_NAME
  : process.env.R2_BUCKET_NAME;

console.log(`📦 Storage: ${isProduction ? 'AWS S3' : 'Cloudflare R2'} | Bucket: ${BUCKET_NAME}`);

/**
 * Upload file to storage (R2 locally, S3 on production)
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} agentId - Agent ID for folder structure
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Storage key (not full URL)
 */
async function uploadFile(fileBuffer, filename, agentId, contentType) {
  const key = `agent_${agentId}/${Date.now()}_${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await storageClient.send(command);

  // Return just the key – signed URLs are generated on-demand
  return key;
}

/**
 * Delete file from storage
 * @param {string} key - Storage key (not full URL)
 */
async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await storageClient.send(command);
}

/**
 * Generate a temporary pre-signed download URL (works identically for both R2 and S3)
 * @param {string} key - Storage key
 * @param {number} expiresIn - Expiration in seconds (default: 1 hour)
 * @returns {Promise<string>} - Pre-signed URL
 */
async function getSignedFileUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(storageClient, command, { expiresIn });
}

module.exports = {
  uploadFile,
  deleteFile,
  getSignedFileUrl,
};
