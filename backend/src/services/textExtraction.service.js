const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Initialize R2 client for downloading files
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});

/**
 * Download file from R2 as buffer
 * @param {string} key - File key in R2
 * @returns {Promise<Buffer>}
 */
async function downloadFileFromR2(key) {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key
  });

  const response = await r2Client.send(command);

  // Convert stream to buffer
  const chunks = [];
  for await (const chunk of response.Body) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Extract text from PDF
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>}
 */
async function extractFromPDF(buffer) {
  const data = await pdf(buffer);
  return data.text;
}

/**
 * Extract text from DOCX
 * @param {Buffer} buffer - DOCX file buffer
 * @returns {Promise<string>}
 */
async function extractFromDOCX(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

/**
 * Extract text from TXT
 * @param {Buffer} buffer - TXT file buffer
 * @returns {Promise<string>}
 */
function extractFromTXT(buffer) {
  return buffer.toString('utf-8');
}

/**
 * Extract text from any supported file type
 * @param {string} fileKey - R2 file key
 * @param {string} fileType - File extension (pdf, docx, txt)
 * @returns {Promise<string>} - Extracted text
 */
async function extractText(fileKey, fileType) {
  try {
    // Download file from R2
    const buffer = await downloadFileFromR2(fileKey);

    // Extract based on file type
    let text;
    switch (fileType.toLowerCase()) {
      case 'pdf':
        text = await extractFromPDF(buffer);
        break;
      case 'docx':
      case 'doc':
        text = await extractFromDOCX(buffer);
        break;
      case 'txt':
        text = extractFromTXT(buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Clean up text: remove excessive whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error(`Failed to extract text from ${fileType}: ${error.message}`);
  }
}

module.exports = {
  extractText
};
