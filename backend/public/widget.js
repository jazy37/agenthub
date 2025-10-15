(function() {
  'use strict';

  // Get config from global variable
  const config = window.AgentHubConfig || {};
  const agentId = config.agentId;
  const serverUrl = config.serverUrl || 'http://localhost:5000';

  if (!agentId) {
    console.error('AgentHub: agentId is required');
    return;
  }

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'agenthub-widget';
  widgetContainer.innerHTML = `
    <style>
      #agenthub-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }

      #agenthub-bubble {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      }

      #agenthub-bubble:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }

      #agenthub-bubble svg {
        width: 28px;
        height: 28px;
        fill: white;
      }

      #agenthub-chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 380px;
        height: 600px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.3s ease-out;
      }

      #agenthub-chat-window.open {
        display: flex;
      }

      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      #agenthub-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 16px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      #agenthub-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }

      #agenthub-close {
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.8;
        transition: opacity 0.2s;
      }

      #agenthub-close:hover {
        opacity: 1;
      }

      #agenthub-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: white;
      }

      .agenthub-message {
        margin-bottom: 12px;
        display: flex;
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .agenthub-message.user {
        justify-content: flex-end;
      }

      .agenthub-message.bot {
        justify-content: flex-start;
      }

      .agenthub-message-content {
        max-width: 75%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }

      .agenthub-message.user .agenthub-message-content {
        background: #667eea;
        color: white;
        border-bottom-right-radius: 4px;
      }

      .agenthub-message.bot .agenthub-message-content {
        background: white;
        color: #1f2937;
        border: 1px solid #e5e7eb;
        border-bottom-left-radius: 4px;
      }

      .agenthub-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
      }

      .agenthub-typing span {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #9ca3af;
        animation: typing 1.4s infinite;
      }

      .agenthub-typing span:nth-child(2) {
        animation-delay: 0.2s;
      }

      .agenthub-typing span:nth-child(3) {
        animation-delay: 0.4s;
      }

      @keyframes typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-10px); }
      }

      #agenthub-input-container {
        padding: 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }

      #agenthub-input {
        flex: 1;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }

      #agenthub-input:focus {
        border-color: #667eea;
      }

      #agenthub-send {
        background: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.2s;
      }

      #agenthub-send:hover {
        background: #5568d3;
      }

      #agenthub-send:disabled {
        background: #d1d5db;
        cursor: not-allowed;
      }

      @media (max-width: 480px) {
        #agenthub-chat-window {
          width: calc(100vw - 40px);
          right: 20px;
        }
      }
    </style>

    <!-- Chat Bubble -->
    <div id="agenthub-bubble">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
      </svg>
    </div>

    <!-- Chat Window -->
    <div id="agenthub-chat-window">
      <div id="agenthub-header">
        <h3>Chat z Agentem</h3>
        <button type="button" id="agenthub-close">×</button>
      </div>
      <div id="agenthub-messages"></div>
      <div id="agenthub-input-container">
        <input type="text" id="agenthub-input" placeholder="Napisz wiadomość..." />
        <button type="button" id="agenthub-send">Wyślij</button>
      </div>
    </div>
  `;

  document.body.appendChild(widgetContainer);

  // Widget state
  let isOpen = false;
  let socket = null;
  let conversationId = null;
  let brandColor = '#667eea'; // Default color, will be updated from server
  let userPlan = 'free'; // Default plan, will be updated from server
  let sessionId = localStorage.getItem(`agenthub_session_${agentId}`) ||
                  `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  localStorage.setItem(`agenthub_session_${agentId}`, sessionId);

  // Elements
  const bubble = document.getElementById('agenthub-bubble');
  const chatWindow = document.getElementById('agenthub-chat-window');
  const closeBtn = document.getElementById('agenthub-close');
  const messagesContainer = document.getElementById('agenthub-messages');
  const input = document.getElementById('agenthub-input');
  const sendBtn = document.getElementById('agenthub-send');

  // Fetch branding on load (only brandColor, userPlan comes later via WebSocket)
  fetch(`${serverUrl}/api/widget/branding/${agentId}`)
    .then(res => res.json())
    .then(data => {
      brandColor = data.brandColor || '#667eea';
      updateWidgetColors(brandColor);
    })
    .catch(err => {
      console.error('Failed to fetch branding:', err);
      // Use default colors if fetch fails
      updateWidgetColors(brandColor);
    });

  // Update widget colors dynamically
  function updateWidgetColors(color) {
    // Update bubble background
    bubble.style.background = color;

    // Update header background
    const header = document.getElementById('agenthub-header');
    header.style.background = color;

    // Update send button background
    sendBtn.style.background = color;

    // Update input focus color
    const style = document.createElement('style');
    style.innerHTML = `
      #agenthub-input:focus {
        border-color: ${color} !important;
      }
      .agenthub-message.user .agenthub-message-content {
        background: ${color} !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Add "Powered by AgentHub" footer
  function addPoweredByFooter() {
    const inputContainer = document.getElementById('agenthub-input-container');

    // Check if footer already exists
    if (document.getElementById('agenthub-footer')) return;

    const footer = document.createElement('div');
    footer.id = 'agenthub-footer';
    footer.style.cssText = `
      padding: 8px 16px;
      background: white;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #6b7280;
    `;
    footer.innerHTML = 'Powered by <a href="https://agenthub.com" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 500;">AgentHub</a>';

    // Insert footer before input container
    inputContainer.parentNode.insertBefore(footer, inputContainer.nextSibling);
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      chatWindow.classList.add('open');
      connectSocket();
      input.focus();
    } else {
      chatWindow.classList.remove('open');
    }
  }

  bubble.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChat();
  });

  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleChat();
  });

  // Prevent clicks inside chat window from closing it
  chatWindow.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Connect to Socket.io
  function connectSocket() {
    if (socket && socket.connected) return;

    // Load socket.io client
    const script = document.createElement('script');
    script.src = `${serverUrl}/socket.io/socket.io.js`;
    script.onload = () => {
      socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
      });

      socket.on('connect', () => {
        console.log('Connected to AgentHub');
        socket.emit('join_conversation', { agentId, sessionId });
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from AgentHub:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected, reconnect manually
          socket.connect();
        }
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to AgentHub after', attemptNumber, 'attempts');
        socket.emit('join_conversation', { agentId, sessionId });
      });

      socket.on('conversation_joined', (data) => {
        conversationId = data.conversationId;

        // Update userPlan and add footer if free plan
        if (data.userPlan) {
          userPlan = data.userPlan;
          if (userPlan === 'free') {
            addPoweredByFooter();
          }
        }

        messagesContainer.innerHTML = '';
        data.history.forEach(msg => addMessage(msg.text, msg.sender));
      });

      socket.on('bot_reply', (data) => {
        removeTypingIndicator();
        addMessage(data.message.text, 'bot');
      });

      socket.on('bot_typing', (data) => {
        if (data.typing) {
          showTypingIndicator();
        } else {
          removeTypingIndicator();
        }
      });

      socket.on('error', (data) => {
        console.error('Chat error:', data.message);
        removeTypingIndicator();
      });
    };
    document.head.appendChild(script);
  }

  // Simple markdown parser for messages
  function parseMarkdown(text) {
    return text
      // Bold: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Links: [text](url)
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color: inherit; text-decoration: underline;">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');
  }

  // Add message to chat
  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `agenthub-message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'agenthub-message-content';

    // Parse markdown for bot messages, plain text for user
    if (sender === 'bot') {
      contentDiv.innerHTML = parseMarkdown(text);
    } else {
      contentDiv.textContent = text;
    }

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Show typing indicator
  function showTypingIndicator() {
    if (document.getElementById('agenthub-typing-indicator')) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'agenthub-typing-indicator';
    typingDiv.className = 'agenthub-message bot';
    typingDiv.innerHTML = `
      <div class="agenthub-message-content">
        <div class="agenthub-typing">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const indicator = document.getElementById('agenthub-typing-indicator');
    if (indicator) indicator.remove();
  }

  // Send message
  function sendMessage() {
    const text = input.value.trim();
    if (!text || !socket || !conversationId) return;

    addMessage(text, 'user');
    socket.emit('send_message', { conversationId, message: text });
    input.value = '';
  }

  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      sendMessage();
    }
  });
})();
