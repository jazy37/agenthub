/**
 * LangGraph MVP – AgentHub
 *
 * Graf stanów dla przetwarzania wiadomości chatbota:
 *
 *   [START]
 *      ↓
 *   [classifyIntent]  ← LLM klasyfikuje intencję: "greeting" | "rag" | "escalate"
 *      ↓ (conditional edge)
 *      ├─ "rag"                   → [ragSearch] → [generateResponse]
 *      └─ "greeting"/"escalate"  →              → [generateResponse]
 *                                                       ↓
 *                                                     [END]
 */

const { StateGraph, Annotation, END, START } = require('@langchain/langgraph');
const { Document } = require('@langchain/core/documents');
const { HumanMessage, AIMessage, SystemMessage } = require('@langchain/core/messages');
const logger = require('../utils/logger').child({ module: 'langgraph' });

// ── State schema ────────────────────────────────────────────────────────────
const AgentState = Annotation.Root({
    input: Annotation({ reducer: (_, b) => b, default: () => '' }),
    history: Annotation({ reducer: (_, b) => b, default: () => [] }),
    agent: Annotation({ reducer: (_, b) => b, default: () => null }),
    getLLMFn: Annotation({ reducer: (_, b) => b, default: () => null }),
    getRetrieverFn: Annotation({ reducer: (_, b) => b, default: () => null }),
    intent: Annotation({ reducer: (_, b) => b, default: () => 'rag' }),
    docs: Annotation({ reducer: (_, b) => b, default: () => [] }),
    reply: Annotation({ reducer: (_, b) => b, default: () => '' }),
    escalate: Annotation({ reducer: (_, b) => b, default: () => false }),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build LangChain-compatible message history from stored messages
 */
function buildMessageHistory(history) {
    return history.flatMap(msg => {
        if (msg.sender === 'user') return [new HumanMessage(msg.text)];
        if (msg.sender === 'bot') return [new AIMessage(msg.text)];
        return [];
    });
}

// ── Node 1: Classify Intent ──────────────────────────────────────────────────
/**
 * Uses a fast LLM call to decide:
 *   "greeting"  – casual/social message, no knowledge needed
 *   "rag"       – requires knowledge base search
 *   "escalate"  – user wants human support
 *
 * Falls back to "rag" if LLM produces unexpected output or agent has no RAG.
 */
async function classifyIntent(state) {
    const { input, agent, getLLMFn } = state;

    // If the agent has no documents, skip RAG entirely
    if (!agent.ragEnabled || !agent.documents || agent.documents.length === 0) {
        logger.info({ agentId: agent.id }, 'RAG disabled or no documents – skipping classification');
        return { intent: 'greeting' }; // will go straight to generateResponse without RAG
    }

    try {
        const llm = getLLMFn(agent);
        const systemPrompt = `You are an intent classifier. Given a user message, reply with EXACTLY ONE of these labels – nothing else:
- "greeting"  – if the message is a greeting, small talk, or simple social exchange
- "escalate"  – if the user explicitly wants to speak with a human agent
- "rag"       – for ALL other messages that require knowledge or information

Examples:
"Cześć!" → greeting
"Hello, how are you?" → greeting
"chcę rozmawiać z człowiekiem" → escalate
"I want to talk to a human" → escalate
"What is your return policy?" → rag
"How do I reset my password?" → rag`;

        const response = await llm.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(input),
        ]);

        const raw = (response.content || '').trim().toLowerCase();
        const intent = ['greeting', 'escalate', 'rag'].includes(raw) ? raw : 'rag';

        logger.info({ agentId: agent.id, intent, raw }, 'Intent classified');
        return { intent };
    } catch (err) {
        logger.error({ err }, 'Intent classification failed – defaulting to rag');
        return { intent: 'rag' };
    }
}

// ── Node 2: RAG Search ───────────────────────────────────────────────────────
async function ragSearch(state) {
    const { input, agent, getRetrieverFn } = state;

    try {
        const retriever = await getRetrieverFn(agent);
        const docs = await retriever.getRelevantDocuments(input);
        logger.info({ agentId: agent.id, docsFound: docs.length }, 'RAG search completed');
        return { docs: Array.isArray(docs) ? docs : [] };
    } catch (err) {
        logger.error({ err, agentId: agent.id }, 'RAG search failed – continuing without context');
        return { docs: [] };
    }
}

// ── Node 3: Generate Response ────────────────────────────────────────────────
async function generateResponse(state) {
    const { input, history, agent, intent, docs, getLLMFn } = state;

    if (intent === 'escalate') {
        logger.info({ agentId: agent.id }, 'Escalate intent – returning handover message');
        return {
            reply: 'Rozumiem, że chcesz porozmawiać z naszym konsultantem. Łączę Cię z zespołem obsługi – odezwiemy się wkrótce.',
            escalate: true,
        };
    }

    try {
        const llm = getLLMFn(agent);
        const messages = [];

        // System message for the agent
        const systemContent = agent.systemPrompt
            ? agent.systemPrompt
            : 'You are a helpful AI assistant. Be concise and friendly. Always respond in the same language as the user.';

        // Add RAG context if available
        const contextSection = docs.length > 0
            ? `\n\nKnowledge Base Context (use this to answer accurately):\n${docs.map(d => d.pageContent).join('\n\n---\n\n')}\n\nAnswer ONLY based on the context above. If the context doesn't contain the answer, reply that you don't have information on that topic and do NOT use your general knowledge.`
            : `\n\nIMPORTANT: You have no knowledge base context available for this question. Do NOT answer from your general knowledge. Inform the user that you don't have information on that topic and can only help with subjects covered in your knowledge base.`;

        messages.push(new SystemMessage(systemContent + contextSection));

        // Add conversation history (last 6 exchanges max)
        const messageHistory = buildMessageHistory(history.slice(-12));
        messages.push(...messageHistory);

        // Current user message
        messages.push(new HumanMessage(input));

        const response = await llm.invoke(messages);
        const reply = response.content || response.text || 'Przepraszam, nie udało mi się wygenerować odpowiedzi.';

        logger.info({ agentId: agent.id, intent, docsUsed: docs.length }, 'Response generated');
        return { reply, escalate: false };
    } catch (err) {
        logger.error({ err, agentId: agent.id }, 'Response generation failed');
        return {
            reply: 'Przepraszam, wystąpił problem. Spróbuj ponownie za chwilę.',
            escalate: false,
        };
    }
}

// ── Conditional routing ──────────────────────────────────────────────────────
function routeByIntent(state) {
    return state.intent === 'rag' ? 'ragSearch' : 'generateResponse';
}

// ── Build and compile graph ──────────────────────────────────────────────────
const workflow = new StateGraph(AgentState)
    .addNode('classifyIntent', classifyIntent)
    .addNode('ragSearch', ragSearch)
    .addNode('generateResponse', generateResponse)
    .addEdge(START, 'classifyIntent')
    .addConditionalEdges('classifyIntent', routeByIntent, {
        ragSearch: 'ragSearch',
        generateResponse: 'generateResponse',
    })
    .addEdge('ragSearch', 'generateResponse')
    .addEdge('generateResponse', END);

const graph = workflow.compile();

// ── Public API ───────────────────────────────────────────────────────────────
/**
 * Process a message using the LangGraph state machine.
 *
 * @param {Object} agent      - Agent object from prisma (with documents, llmConfig etc.)
 * @param {string} message    - User message
 * @param {Array}  history    - Conversation history [{sender, text}]
 * @param {Function} getLLMFn - getLLM function from langchain.service.js
 * @param {Function} getRetrieverFn - getRetriever function from langchain.service.js
 * @returns {{ reply: string, sourceDocuments: Document[], escalate: boolean }}
 */
async function processMessageGraph(agent, message, history, getLLMFn, getRetrieverFn) {
    logger.info({ agentId: agent.id, messagePreview: message.substring(0, 60) }, 'LangGraph processing started');

    const result = await graph.invoke({
        input: message,
        history,
        agent,
        getLLMFn,
        getRetrieverFn,
        intent: 'rag',
        docs: [],
        reply: '',
        escalate: false,
    });

    return {
        reply: result.reply,
        sourceDocuments: result.docs,
        escalate: result.escalate,
    };
}

module.exports = { processMessageGraph };
