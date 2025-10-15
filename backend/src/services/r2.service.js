const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize R2 client (compatible with S3 API)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/**
 * Upload file to R2 storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} agentId - Agent ID for folder structure
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
async function uploadFile(fileBuffer, filename, agentId, contentType) {
  const key = `agent_${agentId}/${Date.now()}_${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType
  });

  await r2Client.send(command);

  // Store just the key, not full URL (we'll generate signed URLs on-demand)
  return key;
}

/**
 * Delete file from R2 storage
 * @param {string} key - File key in R2 (not full URL)
 * @returns {Promise<void>}
 */
async function deleteFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  await r2Client.send(command);
}

/**
 * Get temporary signed URL for private files (optional)
 * @param {string} key - File key in R2
 * @param {number} expiresIn - Expiration time in seconds (default 3600)
 * @returns {Promise<string>} - Signed URL
 */
async function getSignedFileUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

module.exports = {
  uploadFile,
  deleteFile,
  getSignedFileUrl
};
