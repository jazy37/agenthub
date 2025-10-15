const OpenAI = require('openai');

/**
 * Get OpenAI client (uses default or custom LLM config)
 * @param {string|null} apiKey - Optional custom API key
 * @returns {OpenAI}
 */
function getOpenAIClient(apiKey = null) {
  return new OpenAI({
    apiKey: apiKey || process.env.DEFAULT_LLM_API_KEY
  });
}

/**
 * Generate embeddings for text using OpenAI
 * @param {string} text - Text to embed
 * @param {string|null} apiKey - Optional custom API key
 * @returns {Promise<Array<number>>} - Embedding vector
 */
async function generateEmbedding(text, apiKey = null) {
  try {
    const openai = getOpenAIClient(apiKey);

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 1536 dimensions, cheaper
      input: text
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts (batch)
 * @param {Array<string>} texts - Array of texts to embed
 * @param {string|null} apiKey - Optional custom API key
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
async function generateEmbeddings(texts, apiKey = null) {
  try {
    const openai = getOpenAIClient(apiKey);

    // OpenAI allows up to 2048 inputs per request
    const batchSize = 2048;
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch
      });

      const embeddings = response.data.map(item => item.embedding);
      allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

module.exports = {
  generateEmbedding,
  generateEmbeddings
};
