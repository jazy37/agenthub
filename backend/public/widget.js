(function () {
  'use strict';

  if (window.initAgentHub) return;

  let isInitialized = false;

  window.initAgentHub = function (customConfig = {}) {
    if (isInitialized) {
      console.warn('AgentHub is already initialized.');
      return;
    }

    const config = { ...(window.AgentHubConfig || {}), ...customConfig };
    const agentId = config.agentId;
    const serverUrl = config.serverUrl || 'http://localhost:5000';

    if (!agentId) {
      console.error('AgentHub: agentId is required');
      return;
    }

    isInitialized = true;

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

      .agenthub-message.system {
        justify-content: center;
      }

      .agenthub-message.system .agenthub-message-content {
        max-width: 90%;
        background: #fff8e1;
        color: #92400e;
        border: 1px solid #fcd34d;
        border-radius: 8px;
        font-size: 0.8rem;
        text-align: center;
        padding: 6px 12px;
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
    let brandColor = '#667eea';
    let userPlan = 'free';
    let quickReplies = [];
    let conversationIsNew = false; // true when conversation has no user messages yet
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
        // If limit reached or agent is disabled/deleted, hide widget immediately
        if (data.limitReached || data.disabled) {
          widgetContainer.style.display = 'none';
          return;
        }

        brandColor = data.brandColor || '#667eea';
        quickReplies = Array.isArray(data.quickReplies) ? data.quickReplies : [];
        updateWidgetColors(brandColor);
        // If conversation_joined already fired before branding loaded, show QR now
        if (conversationIsNew && quickReplies.length > 0) {
          showQuickReplies();
        }
      })
      .catch(err => {
        console.error('Failed to fetch branding:', err);
        // Use default colors if fetch fails
        updateWidgetColors(brandColor);
      });

    // Determine if color is light or dark
    function isLightColor(color) {
      // Convert hex to RGB
      let r, g, b;
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        r = parseInt(hex.substr(0, 2), 16);
        g = parseInt(hex.substr(2, 2), 16);
        b = parseInt(hex.substr(4, 2), 16);
      } else if (color.startsWith('rgb')) {
        const matches = color.match(/\d+/g);
        r = parseInt(matches[0]);
        g = parseInt(matches[1]);
        b = parseInt(matches[2]);
      } else {
        return false; // Default to dark text if color format is unknown
      }

      // Calculate relative luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5; // If > 0.5, it's a light color
    }

    // Update widget colors dynamically
    function updateWidgetColors(color) {
      const textColor = isLightColor(color) ? '#1f2937' : '#ffffff';

      // Update bubble background
      bubble.style.background = color;

      // Update header background and text color
      const header = document.getElementById('agenthub-header');
      header.style.background = color;
      header.style.color = textColor;

      // Update close button text color
      const closeBtn = document.getElementById('agenthub-close');
      closeBtn.style.color = textColor;

      // Update send button background and text color
      sendBtn.style.background = color;
      sendBtn.style.color = textColor;

      // Update bubble icon color
      const bubbleSvg = bubble.querySelector('svg');
      if (bubbleSvg) {
        bubbleSvg.style.fill = textColor;
      }

      // Update input focus color and user message styles
      const style = document.createElement('style');
      style.innerHTML = `
      #agenthub-input:focus {
        border-color: ${color} !important;
      }
      .agenthub-message.user .agenthub-message-content {
        background: ${color} !important;
        color: ${textColor} !important;
      }
      #agenthub-send:hover {
        opacity: 0.9;
      }
      .agenthub-quick-reply-btn {
        display: inline-block;
        padding: 6px 14px;
        margin: 4px 4px 4px 0;
        border: 1.5px solid ${color};
        border-radius: 20px;
        background: white;
        color: ${color};
        font-size: 13px;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
        white-space: nowrap;
      }
      .agenthub-quick-reply-btn:hover {
        background: ${color};
        color: ${textColor};
      }
      #agenthub-quick-replies {
        padding: 4px 16px 8px 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        border-top: 1px solid #f3f4f6;
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
      showCloseConfirmation();
    });

    function showCloseConfirmation() {
      if (document.getElementById('agenthub-close-confirm')) return;

      const confirmDiv = document.createElement('div');
      confirmDiv.id = 'agenthub-close-confirm';
      confirmDiv.className = 'agenthub-message bot';
      confirmDiv.style.width = '100%';
      confirmDiv.innerHTML = `
      <div class="agenthub-message-content" style="background-color: #f8fafc; color: #334155; border: 1px solid #e2e8f0; width: 100%;">
        <div style="margin-bottom: 12px; font-weight: 500; text-align: center; font-size: 14px;">Czy na pewno chcesz zakończyć połączenie?</div>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <button id="agenthub-confirm-yes" style="flex: 1; padding: 6px 12px; background-color: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background-color 0.2s;">Zakończ</button>
          <button id="agenthub-confirm-no" style="flex: 1; padding: 6px 12px; background-color: #e2e8f0; color: #475569; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; transition: background-color 0.2s;">Anuluj</button>
        </div>
      </div>
    `;

      messagesContainer.appendChild(confirmDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      document.getElementById('agenthub-confirm-yes').addEventListener('click', () => {
        if (socket) {
          if (conversationId) {
            socket.emit('leave_conversation', { conversationId });
          }
          socket.disconnect();
          socket = null; // Clean up so reconnect spawns fresh
        }

        // Wipe the session to start a brand new conversation
        localStorage.removeItem(`agenthub_session_${agentId}`);
        sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
        localStorage.setItem(`agenthub_session_${agentId}`, sessionId);

        confirmDiv.innerHTML = '<div class="agenthub-message-content" style="background-color: #f8fafc; color: #64748b; text-align: center; width: 100%; font-size: 13px;">Połączenie zostało zakończone.</div>';
        setTimeout(() => {
          toggleChat();
          confirmDiv.remove();
          messagesContainer.innerHTML = ''; // Wipe UI
        }, 1500);
      });

      document.getElementById('agenthub-confirm-no').addEventListener('click', () => {
        confirmDiv.remove();
      });
    }

    // Prevent clicks inside chat window from closing it
    chatWindow.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    function initSocketEvents() {
      socket = window.io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        forceNew: true
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

        // Check if limit reached
        if (data.limitReached) {
          // Hide widget completely
          widgetContainer.style.display = 'none';
          return;
        }

        // Update userPlan and add footer if free plan
        if (data.userPlan) {
          userPlan = data.userPlan;
          if (userPlan === 'free') {
            addPoweredByFooter();
          }
        }

        messagesContainer.innerHTML = '';
        data.history.forEach(msg => addMessage(msg.text, msg.sender));

        // Show quick replies when the conversation has no user messages yet
        // (either brand new, or only has the initial bot welcome message)
        const userMessages = data.history.filter(m => m.sender === 'user');
        conversationIsNew = userMessages.length === 0;

        if (conversationIsNew && quickReplies.length > 0) {
          showQuickReplies();
        }
      });

      socket.on('conversation_started', (data) => {
        conversationId = data.conversationId;
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

        if (data.limitReached) {
          widgetContainer.style.display = 'none';
        } else if (data.rateLimited) {
          addMessage(data.message, 'system');
        }
      });
    }

    // Connect to Socket.io
    function connectSocket() {
      if (socket && socket.connected) return;

      if (window.io) {
        initSocketEvents();
        return;
      }

      // Load socket.io client
      const script = document.createElement('script');
      script.src = `${serverUrl}/socket.io/socket.io.js`;
      script.onload = () => {
        initSocketEvents();
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

    // Show quick reply buttons (only on new conversation)
    function showQuickReplies() {
      if (!quickReplies.length) return;
      hideQuickReplies(); // clear existing

      const container = document.createElement('div');
      container.id = 'agenthub-quick-replies';

      quickReplies.forEach(qr => {
        const btn = document.createElement('button');
        btn.className = 'agenthub-quick-reply-btn';
        btn.textContent = qr.label;
        btn.addEventListener('click', () => {
          hideQuickReplies();
          input.value = qr.label;
          sendMessage();
        });
        container.appendChild(btn);
      });

      // Insert before the input container
      const inputContainer = document.getElementById('agenthub-input-container');
      inputContainer.parentNode.insertBefore(container, inputContainer);
    }

    // Remove quick reply buttons
    function hideQuickReplies() {
      const existing = document.getElementById('agenthub-quick-replies');
      if (existing) existing.remove();
    }

    // Send message
    function sendMessage() {
      const text = input.value.trim();
      if (!text || !socket) return;

      hideQuickReplies(); // hide on any manual send too
      addMessage(text, 'user');
      socket.emit('send_message', { conversationId, agentId, sessionId, message: text });
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

  }; // End of window.initAgentHub

  // Expose API for external control (even before init, they can theoretically exist, but methods will just prompt init if used)
  window.AgentHub = {
    init: window.initAgentHub,
    open: () => {
      const el = document.getElementById('agenthub-chat-window');
      const toggleBtn = document.getElementById('agenthub-bubble');
      if (el && !el.classList.contains('open') && toggleBtn) {
        toggleBtn.click();
      }
    },
    close: () => {
      const el = document.getElementById('agenthub-chat-window');
      const toggleBtn = document.getElementById('agenthub-bubble');
      if (el && el.classList.contains('open') && toggleBtn) {
        toggleBtn.click();
      }
    },
    sendMessage: (text) => {
      const inputField = document.getElementById('agenthub-input');
      const sendButton = document.getElementById('agenthub-send');
      if (inputField && sendButton) {
        window.AgentHub.open();
        inputField.value = text;
        sendButton.click();
      } else {
        console.error('AgentHub: not initialized or UI not found');
      }
    }
  };

  // Backward compatibility: Auto-init if global config is already present
  setTimeout(() => {
    if (window.AgentHubConfig && typeof window.initAgentHub === 'function') {
      window.initAgentHub(window.AgentHubConfig);
    }
  }, 100);

})();
