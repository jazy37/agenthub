/**
 * Split text into chunks with overlap
 * @param {string} text - Full text to split
 * @param {number} chunkSize - Maximum chunk size in characters (default: 1000)
 * @param {number} overlap - Overlap between chunks in characters (default: 200)
 * @returns {Array<string>} - Array of text chunks
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
  if (!text || text.length === 0) {
    return [];
  }

  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    // Get chunk of text
    let endIndex = startIndex + chunkSize;

    // If this is not the last chunk, try to break at sentence end
    if (endIndex < text.length) {
      // Look for sentence endings (. ! ?) near the chunk boundary
      const searchText = text.substring(endIndex - 100, endIndex + 100);
      const sentenceEndings = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];

      let bestBreakPoint = -1;
      let minDistance = Infinity;

      for (const ending of sentenceEndings) {
        const index = searchText.lastIndexOf(ending);
        if (index !== -1) {
          const distance = Math.abs(100 - index);
          if (distance < minDistance) {
            minDistance = distance;
            bestBreakPoint = (endIndex - 100) + index + ending.length;
          }
        }
      }

      // If found a good break point, use it
      if (bestBreakPoint !== -1) {
        endIndex = bestBreakPoint;
      }
    } else {
      // Last chunk - take everything
      endIndex = text.length;
    }

    // Extract chunk
    const chunk = text.substring(startIndex, endIndex).trim();

    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start index forward, with overlap
    startIndex = endIndex - overlap;

    // Avoid infinite loop
    if (startIndex <= chunks[chunks.length - 1]?.length + (chunks.length - 1) * (chunkSize - overlap)) {
      startIndex = endIndex;
    }
  }

  return chunks;
}

/**
 * Create chunks with metadata
 * @param {string} text - Full text
 * @param {Object} metadata - Metadata for all chunks
 * @returns {Array<Object>} - Array of {text, metadata} objects
 */
function createChunksWithMetadata(text, metadata = {}) {
  const textChunks = chunkText(text);

  return textChunks.map((chunk, index) => ({
    text: chunk,
    metadata: {
      ...metadata,
      chunkIndex: index,
      totalChunks: textChunks.length
    }
  }));
}

module.exports = {
  chunkText,
  createChunksWithMetadata
};
