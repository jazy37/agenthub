const { PrismaClient } = require('@prisma/client');
const { extractText } = require('./textExtraction.service');
const { createChunksWithMetadata } = require('./chunking.service');
const { upsertTextRecords, deleteVectorsByDocument } = require('./pinecone.service');

const prisma = new PrismaClient();

/**
 * Process a document: extract text, chunk, embed, and store in Pinecone
 * @param {string} documentId - Document ID from database
 * @returns {Promise<void>}
 */
async function processDocument(documentId) {
  console.log(`📄 Starting processing for document ${documentId}`);

  try {
    // Get document and agent info
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        agent: {
          include: {
            llmConfig: true
          }
        }
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Mark as processing (update later)
    await prisma.document.update({
      where: { id: documentId },
      data: { error: null }
    });

    // Step 1: Extract text from file
    console.log('  📖 Step 1: Extracting text...');
    const text = await extractText(document.fileUrl, document.fileType);

    if (!text || text.length < 50) {
      throw new Error('Extracted text is too short or empty');
    }

    console.log(`  ✓ Extracted ${text.length} characters`);

    // Step 2: Chunk text
    console.log('  ✂️ Step 2: Chunking text...');
    const chunks = createChunksWithMetadata(text, {
      documentId: document.id,
      agentId: document.agent.id,
      filename: document.filename,
      fileType: document.fileType
    });

    console.log(`  ✓ Created ${chunks.length} chunks`);

    // Step 3: Prepare text records for Pinecone (with integrated embeddings)
    console.log('  💾 Step 3: Upserting text records to Pinecone...');
    const textRecords = chunks.map((chunk, index) => ({
      id: `${document.id}_chunk_${index}`,
      text: chunk.text,
      metadata: chunk.metadata
    }));

    // Upsert to Pinecone (namespace = agentId)
    // Pinecone will automatically generate embeddings using its hosted model
    await upsertTextRecords(textRecords, document.agent.id);

    console.log(`  ✓ Upserted ${textRecords.length} text records to Pinecone (integrated embeddings)`);

    // Step 4: Update document in database
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processed: true,
        chunksCount: chunks.length,
        processedAt: new Date(),
        error: null
      }
    });

    console.log(`✅ Document ${documentId} processed successfully!`);
  } catch (error) {
    console.error(`❌ Error processing document ${documentId}:`, error);

    // Update document with error
    await prisma.document.update({
      where: { id: documentId },
      data: {
        processed: false,
        error: error.message
      }
    });

    throw error;
  }
}

/**
 * Delete document vectors from Pinecone
 * @param {string} documentId - Document ID
 * @param {string} agentId - Agent ID (used as namespace)
 * @returns {Promise<void>}
 */
async function deleteDocumentVectors(documentId, agentId) {
  try {
    await deleteVectorsByDocument(documentId, agentId);
    console.log(`✅ Deleted vectors for document ${documentId}`);
  } catch (error) {
    console.error(`❌ Error deleting vectors for document ${documentId}:`, error);
    // Don't throw - allow deletion to continue even if Pinecone fails
  }
}

module.exports = {
  processDocument,
  deleteDocumentVectors
};
