const { Pinecone } = require('@pinecone-database/pinecone');

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});

const INDEX_NAME = 'agent-hub'; // Your Pinecone index name

/**
 * Get Pinecone index
 * @returns {Promise<Index>}
 */
async function getIndex() {
  return pinecone.index(INDEX_NAME, process.env.PINECONE_HOST);
}

/**
 * Upsert vectors to Pinecone (legacy method with pre-computed embeddings)
 * @param {Array<Object>} vectors - Array of {id, values, metadata}
 * @param {string} namespace - Namespace (e.g., agentId)
 * @returns {Promise<void>}
 */
async function upsertVectors(vectors, namespace) {
  try {
    const index = await getIndex();

    // Pinecone accepts batches of up to 100 vectors
    const batchSize = 100;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      await index.namespace(namespace).upsert(batch);
    }

    console.log(`✅ Upserted ${vectors.length} vectors to namespace ${namespace}`);
  } catch (error) {
    console.error('Error upserting vectors to Pinecone:', error);
    throw new Error(`Failed to upsert vectors: ${error.message}`);
  }
}

/**
 * Upsert text records to Pinecone with integrated embeddings
 * Pinecone automatically converts text to vectors using hosted embedding model
 * @param {Array<Object>} records - Array of {id, text, metadata}
 * @param {string} namespace - Namespace (e.g., agentId)
 * @returns {Promise<void>}
 */
async function upsertTextRecords(records, namespace) {
  try {
    const index = await getIndex();

    // Prepare records for Pinecone's integrated embedding format
    // The 'text' field is required for Pinecone to generate embeddings
    const formattedRecords = records.map(record => ({
      id: record.id,
      text: record.text,
      ...record.metadata
    }));

    // Pinecone upsertRecords accepts batches
    const batchSize = 100;

    for (let i = 0; i < formattedRecords.length; i += batchSize) {
      const batch = formattedRecords.slice(i, i + batchSize);

      await index.namespace(namespace).upsertRecords(batch);
    }

    console.log(`✅ Upserted ${formattedRecords.length} text records to namespace ${namespace} (with integrated embeddings)`);
  } catch (error) {
    console.error('Error upserting text records to Pinecone:', error);
    throw new Error(`Failed to upsert text records: ${error.message}`);
  }
}

/**
 * Delete vectors by document ID
 * @param {string} documentId - Document ID
 * @param {string} namespace - Namespace (agentId)
 * @returns {Promise<void>}
 */
async function deleteVectorsByDocument(documentId, namespace) {
  try {
    const index = await getIndex();

    // Delete all vectors with matching documentId in metadata
    await index.namespace(namespace).deleteMany({
      documentId
    });

    console.log(`✅ Deleted vectors for document ${documentId} from namespace ${namespace}`);
  } catch (error) {
    console.error('Error deleting vectors from Pinecone:', error);
    throw new Error(`Failed to delete vectors: ${error.message}`);
  }
}

/**
 * Query similar vectors
 * @param {Array<number>} queryVector - Query embedding
 * @param {string} namespace - Namespace (agentId)
 * @param {number} topK - Number of results (default: 5)
 * @param {Object} filter - Metadata filter (optional)
 * @returns {Promise<Array>} - Array of matches
 */
async function querySimilar(queryVector, namespace, topK = 5, filter = {}) {
  try {
    const index = await getIndex();

    const queryResponse = await index.namespace(namespace).query({
      vector: queryVector,
      topK,
      includeMetadata: true,
      filter
    });

    return queryResponse.matches || [];
  } catch (error) {
    console.error('Error querying Pinecone:', error);
    throw new Error(`Failed to query vectors: ${error.message}`);
  }
}

/**
 * Delete entire namespace (all vectors for an agent)
 * @param {string} namespace - Namespace (agentId)
 * @returns {Promise<void>}
 */
async function deleteNamespace(namespace) {
  try {
    const index = await getIndex();

    await index.namespace(namespace).deleteAll();

    console.log(`✅ Deleted entire namespace ${namespace}`);
  } catch (error) {
    console.error('Error deleting namespace from Pinecone:', error);
    throw new Error(`Failed to delete namespace: ${error.message}`);
  }
}

module.exports = {
  upsertVectors,
  upsertTextRecords,
  deleteVectorsByDocument,
  querySimilar,
  deleteNamespace
};
