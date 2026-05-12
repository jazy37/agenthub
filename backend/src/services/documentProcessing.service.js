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
  const t0 = Date.now();
  const ts = () => `${Date.now() - t0}ms`;
  console.log(`📄 [0ms] Starting processing for document ${documentId}`);

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
    console.log(`  📖 [${ts()}] Step 1: Extracting text from R2...`);
    const t1 = Date.now();
    const text = await extractText(document.fileUrl, document.fileType);

    if (!text || text.length < 50) {
      throw new Error('Extracted text is too short or empty');
    }

    console.log(`  ✓ [${ts()}] Extracted ${text.length} characters (took ${Date.now() - t1}ms)`);

    // Step 2: Chunk text
    console.log(`  ✂️ [${ts()}] Step 2: Chunking text...`);
    const t2 = Date.now();
    const chunks = createChunksWithMetadata(text, {
      documentId: document.id,
      agentId: document.agent.id,
      filename: document.filename,
      fileType: document.fileType
    });

    console.log(`  ✓ [${ts()}] Created ${chunks.length} chunks (took ${Date.now() - t2}ms)`);

    // Step 3: Prepare text records for Pinecone (with integrated embeddings)
    console.log(`  💾 [${ts()}] Step 3: Upserting ${chunks.length} records to Pinecone...`);
    const t3 = Date.now();
    const textRecords = chunks.map((chunk, index) => ({
      id: `${document.id}_chunk_${index}`,
      text: chunk.text,
      metadata: chunk.metadata
    }));

    // Upsert to Pinecone (namespace = agentId)
    // Pinecone will automatically generate embeddings using its hosted model
    await upsertTextRecords(textRecords, document.agent.id);

    console.log(`  ✓ [${ts()}] Pinecone upsert done (took ${Date.now() - t3}ms)`);

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

    // Step 5: Ensure RAG is enabled for this agent
    await prisma.agent.update({
      where: { id: document.agent.id },
      data: { ragEnabled: true }
    });

    console.log(`✅ Document ${documentId} processed successfully! Total time: ${ts()}`);
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
