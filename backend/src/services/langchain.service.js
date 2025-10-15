const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { Document } = require('@langchain/core/documents');
const { ConversationChain } = require('langchain/chains');
const { createStuffDocumentsChain } = require('langchain/chains/combine_documents');
const { createRetrievalChain } = require('langchain/chains/retrieval');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { PromptTemplate } = require('@langchain/core/prompts');
const { HumanMessage, AIMessage } = require('@langchain/core/messages');
const { Pinecone } = require('@pinecone-database/pinecone');
const { decrypt } = require('./encryption.service');

// Cache ONLY for simple conversation chains
const conversationChainCache = new Map();
const CACHE_TTL = 30 * 60 * 1000;

/**
 * Get LLM instance based on agent configuration
 */
function getLLM(agent) {
  let apiKey = process.env.DEFAULT_LLM_API_KEY;
  if (agent.llmConfig && agent.llmConfig.apiKeyEncrypted) {
    apiKey = decrypt(agent.llmConfig.apiKeyEncrypted);
  }

  const provider = agent.llmProvider.toLowerCase();
  const model = agent.llmModel;

  const baseConfig = {
    temperature: 0.7,
    maxTokens: 500,
  };

  switch (provider) {
    case 'openai':
      return new ChatOpenAI({
        ...baseConfig,
        model: model,
        apiKey: apiKey,
      });

    case 'anthropic':
      return new ChatAnthropic({
        ...baseConfig,
        model: model,
        apiKey: apiKey,
      });

    case 'custom':
      if (!agent.llmConfig || !agent.llmConfig.baseUrl) {
        throw new Error('Custom LLM requires baseUrl in configuration');
      }
      return new ChatOpenAI({
        ...baseConfig,
        model: model,
        apiKey: apiKey,
        configuration: {
          baseURL: agent.llmConfig.baseUrl,
        },
      });

    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

/**
 * Get Pinecone retriever - POPRAWIONA WERSJA
 */
async function getRetriever(agent) {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const index = pinecone.index('agent-hub', process.env.PINECONE_HOST);
  const namespace = index.namespace(agent.id);

  // Funkcja do pobierania dokumentów
  async function searchDocuments(query) {
    try {
      const response = await namespace.searchRecords({
        query: {
          topK: 3,
          inputs: { text: query },
        },
        fields: ['text', 'chunk_text'],
        filter: { agentId: agent.id },
      });

      const hits = response.result?.hits || [];
      console.log(`🔍 Found ${hits.length} documents from knowledge base`);

      if (!Array.isArray(hits)) {
        console.error(`❌ Pinecone returned invalid format`);
        return [];
      }

      const documents = hits.map((hit) => {
        const text = hit.fields?.text || hit.fields?.chunk_text || 'No content found';
        return new Document({
          pageContent: text,
          metadata: {
            id: hit._id,
            score: hit._score,
            source: hit.fields?.source || 'unknown',
          }
        });
      });

      return documents;
    } catch (error) {
      console.error('❌ Error searching knowledge base:', error.message);
      return [];
    }
  }

  // Utwórz retriever z OBYDWOMA metodami (invoke + getRelevantDocuments)
  const retriever = {
    async invoke(query) {
      return await searchDocuments(query);
    },
    async getRelevantDocuments(query) {
      return await searchDocuments(query);
    }
  };

  return retriever;
}

/**
 * Create RAG chain - NAJPROSTSZA WERSJA (manual)
 */
async function createRAGChain(agent) {
  const llm = getLLM(agent);
  const retriever = await getRetriever(agent);

  // Zwracamy prosty obiekt z metodą invoke
  return {
    async invoke({ input }) {
      try {
        // Pobierz dokumenty
        const docs = await retriever.getRelevantDocuments(input);

        if (!Array.isArray(docs)) {
          console.error(`❌ Retriever returned invalid format`);
          throw new Error('Retriever did not return an array');
        }

        // Połącz dokumenty w context
        const context = docs.map(doc => doc.pageContent).join('\n\n---\n\n');

        // Stwórz prompt
        const prompt = `You are a helpful AI assistant. Use the following context to answer the question.

IMPORTANT:
- If the user is just greeting you, respond naturally and friendly.
- For specific questions, use the provided context to answer accurately.
- If the context doesn't contain the answer, say "Nie mam informacji na ten temat w mojej bazie wiedzy."
- Always respond in the same language as the user's question.

Context:
${context}

Question: ${input}

Answer:`;

        const response = await llm.invoke(prompt);

        return {
          answer: response.content || response.text || response,
          context: docs,
        };
      } catch (error) {
        console.error(`❌ Error in RAG chain:`, error.message);
        throw error;
      }
    }
  };
}

/**
 * Create simple conversation chain
 */
async function createConversationChain(agent) {
  const llm = getLLM(agent);

  const prompt = PromptTemplate.fromTemplate(
    `You are a helpful AI assistant. Have a natural conversation with the user.

Current conversation:
{history}

User: {input}
Assistant:`
  );

  return new ConversationChain({
    llm,
    prompt,
    memory: {
      history: [],
      async loadMemoryVariables() {
        return { 
          history: this.history.slice(-6).join('\n') // Ostatnie 3 wymiany
        };
      },
      async saveContext(input, output) {
        this.history.push(`User: ${input.input}`);
        this.history.push(`Assistant: ${output.response}`);
        // Ogranicz do ostatnich 20 linii
        if (this.history.length > 20) {
          this.history = this.history.slice(-20);
        }
      }
    }
  });
}

/**
 * Get cached chain - TYLKO dla conversation chains
 */
async function getCachedChain(agent) {
  // Dla RAG - zawsze nowy łańcuch
  if (agent.ragEnabled && agent.documents && agent.documents.length > 0) {
    return await createRAGChain(agent);
  }

  // Dla conversation - użyj cache
  const cacheKey = agent.id;
  
  if (conversationChainCache.has(cacheKey)) {
    const cached = conversationChainCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`✓ Using cached conversation chain`);
      return cached.chain;
    }
    conversationChainCache.delete(cacheKey);
  }

  console.log(`🔨 Creating new conversation chain`);
  const chain = await createConversationChain(agent);
  
  conversationChainCache.set(cacheKey, {
    chain,
    timestamp: Date.now(),
  });

  return chain;
}

/**
 * Process message - POPRAWIONA WERSJA
 */
async function processMessage(agent, conversationId, message, history = []) {
  const maxRetries = 2;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const chain = await getCachedChain(agent);

      if (agent.ragEnabled && agent.documents && agent.documents.length > 0) {
        
        const result = await chain.invoke({
          input: message
          // Nie przekazuj chat_history - powoduje problemy
        });

        
        return {
          reply: result.answer,
          sourceDocuments: Array.isArray(result.context) ? result.context : []
        };
      } else {
        console.log(`💬 Calling conversation chain`);
        const result = await chain.call({ 
          input: message 
        });

        console.log(`✅ Conversation response received`);
        
        return {
          reply: result.response,
          sourceDocuments: [],
        };
      }
    } catch (error) {
      console.error(`❌ Error (attempt ${attempt + 1}/${maxRetries}):`, error.message);
      
      // Jeśli to błąd związany z dokumentami, spróbuj bez RAG
      if (error.message.includes('documents.map') || error.message.includes('documents') && attempt === 0) {
        const tempAgent = { ...agent, ragEnabled: false };
        const chain = await getCachedChain(tempAgent);
        const result = await chain.call({ input: message });
        return {
          reply: result.response,
          sourceDocuments: [],
        };
      }

      if (attempt === maxRetries - 1) {
        throw new Error('Przepraszam, wystąpił problem. Spróbuj ponownie.');
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

/**
 * Fallback method for simple response without LangChain
 */
async function processMessageSimple(agent, message) {
  const llm = getLLM(agent);
  
  try {
    const response = await llm.invoke([
      new HumanMessage(`Odpowiedz naturalnie na wiadomość użytkownika: "${message}"`)
    ]);
    
    return {
      reply: response.content,
      sourceDocuments: []
    };
  } catch (error) {
    console.error('Error in simple message processing:', error);
    return {
      reply: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.',
      sourceDocuments: []
    };
  }
}

// Cleanup
let cleanupExecuted = false;
function cleanup() {
  if (cleanupExecuted) return;
  cleanupExecuted = true;
  console.log('🧹 Cleaning up chain cache...');
  conversationChainCache.clear();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

module.exports = {
  getLLM,
  getRetriever,
  createRAGChain,
  createConversationChain,
  getCachedChain,
  invalidateChainCache: (agentId) => {
    conversationChainCache.delete(agentId);
  },
  processMessage,
  processMessageSimple,
  cleanup,
};