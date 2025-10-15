import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

/**
 * Custom hook for real-time chat with Socket.io
 * @param {string} agentId - Agent ID to chat with
 * @returns {Object} Chat state and functions
 */
function useChat(agentId) {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const socketRef = useRef(null);
  const sessionIdRef = useRef(null);

  // Generate or reuse session ID
  useEffect(() => {
    if (!sessionIdRef.current) {
      // Try to get from localStorage or generate new
      const stored = localStorage.getItem(`chat_session_${agentId}`);
      if (stored) {
        sessionIdRef.current = stored;
      } else {
        sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(`chat_session_${agentId}`, sessionIdRef.current);
      }
    }
  }, [agentId]);

  // Initialize socket connection
  useEffect(() => {
    if (!agentId || !sessionIdRef.current) return;

    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    // Connection handlers
    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      setIsConnected(true);
      setError(null);

      // Join conversation (admin panel channel)
      socket.emit('join_conversation', {
        agentId,
        sessionId: sessionIdRef.current,
        channel: 'webchat-admin-panel',
      });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      setIsConnected(false);
    });

    // Conversation joined - load history
    socket.on('conversation_joined', (data) => {
      console.log('💬 Joined conversation:', data.conversationId);
      setConversationId(data.conversationId);
      setMessages(data.history || []);
    });

    // Bot typing indicator
    socket.on('bot_typing', (data) => {
      setIsTyping(data.typing);
    });

    // Bot reply
    socket.on('bot_reply', (data) => {
      setMessages((prev) => [...prev, data.message]);
      setIsTyping(false);
    });

    // Error handling
    socket.on('error', (data) => {
      console.error('❌ Chat error:', data.message);
      setError(data.message);
      setIsTyping(false);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [agentId]);

  // Send message function
  const sendMessage = useCallback(
    (text) => {
      if (!socketRef.current || !conversationId || !text.trim()) {
        return;
      }

      const userMessage = {
        id: `temp_${Date.now()}`,
        sender: 'user',
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };

      // Optimistically add user message to UI
      setMessages((prev) => [...prev, userMessage]);
      setError(null);

      // Emit to server
      socketRef.current.emit('send_message', {
        conversationId,
        message: text.trim(),
      });
    },
    [conversationId]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear conversation - creates new session
  const clearConversation = useCallback(() => {
    // Generate new session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionIdRef.current = newSessionId;
    localStorage.setItem(`chat_session_${agentId}`, newSessionId);

    // Clear local messages
    setMessages([]);
    setConversationId(null);
    setError(null);

    // Reconnect with new session
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join_conversation', {
        agentId,
        sessionId: newSessionId,
      });
    }
  }, [agentId]);

  return {
    messages,
    isTyping,
    isConnected,
    error,
    sendMessage,
    clearError,
    clearConversation,
  };
}

export default useChat;
