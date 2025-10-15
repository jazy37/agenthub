import React, { useState, useRef, useEffect } from 'react';
import useChat from '../hooks/useChat';

const ChatInterface = ({ agentId, agent }) => {
  const { messages, isTyping, isConnected, error, sendMessage, clearError, clearConversation } = useChat(agentId);
  const [inputValue, setInputValue] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    sendMessage(inputValue);
    setInputValue('');
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Simple markdown parser for bot messages
  const parseMarkdown = (text) => {
    return text
      // Bold: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="underline hover:text-gray-700">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
  };

  const handleClearConversation = () => {
    clearConversation();
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col h-[600px] relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            {agent?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-medium text-gray-950">{agent?.name}</h3>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`}
              ></span>
              <span className="text-xs text-gray-500">
                {isConnected ? 'Połączony' : 'Rozłączony'}
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-sm text-gray-600 hover:text-red-600 transition-colors flex items-center gap-1"
            title="Wyczyść konwersację"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Wyczyść
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-400">Łączenie z agentem...</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.sender === 'user'
                  ? 'bg-gray-950 text-white'
                  : 'bg-white text-gray-950 border border-gray-200'
              }`}
            >
              {msg.sender === 'bot' ? (
                <div
                  className="whitespace-pre-wrap break-words"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
                />
              ) : (
                <p className="whitespace-pre-wrap break-words">{msg.text}</p>
              )}
              <p
                className={`text-xs mt-1 ${
                  msg.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                }`}
              >
                {formatTime(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={clearError}
            className="text-red-700 hover:text-red-900"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Napisz wiadomość..."
            disabled={!isConnected}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:border-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-opacity-10 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputValue.trim()}
            className="bg-gray-950 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Wyślij
          </button>
        </form>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-950 mb-2">Wyczyść konwersację?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ta akcja usunie wszystkie wiadomości z obecnej konwersacji i rozpocznie nową sesję.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleClearConversation}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Wyczyść
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
