/**
 * Eye Bot & AI Assistant UI Controller
 * Mistral-powered AI COP website assistant.
 * Uses intent-engine.js (Fuzzy Matching, Levenshtein Typo Tolerance, Synonyms, Context Memory, Confidence System).
 * Handles Navigation Actions, Typing Animations, Quick Action Chips, and LocalStorage Persistence.
 */

import { intentEngine } from './intent-engine.js';

const CHAT_STORAGE_KEY = 'aicop_chat_history_v2';
const SCHOOL_MAP_ACTION = {
  type: 'url',
  url: 'https://maps.app.goo.gl/LP9qMhsvuQrmXQzVA',
  label: '📍 View on Maps',
};

function getLocationAction(query, fallbackAction = null) {
  const isLocationQuery = /\b(map|maps|location|located|address|directions|where\s+(is|are)|how\s+to\s+get)\b/i.test(query);
  return isLocationQuery ? SCHOOL_MAP_ACTION : fallbackAction;
}

export function initEyeBot() {
  const canvas = document.getElementById('hero-character-canvas');
  const stage = document.querySelector('.hero-eye-stage');
  const anchor = document.getElementById('hero-eye-anchor');
  const ctaButtons = document.querySelector('.hero-cta-eye');

  if (!canvas || !stage) return () => {};

  // Create Chat Modal HTML container dynamically if not existing
  let chatModal = document.getElementById('ai-chat-modal');
  if (!chatModal) {
    chatModal = document.createElement('div');
    chatModal.id = 'ai-chat-modal';
    chatModal.className = 'ai-chat-modal';
    chatModal.innerHTML = `
      <div class="chat-header">
        <div class="chat-header-info">
          <span class="chat-status-dot"></span>
          <div>
            <div class="chat-title">AI COP Assistant</div>
          </div>
        </div>
        <button class="chat-close-btn" id="chat-close-btn" aria-label="Close Chat">&times;</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <!-- Messages rendered dynamically -->
      </div>
      <div class="chat-pills" id="chat-pills-container">
        <!-- Quick action chips rendered dynamically -->
      </div>
      <form class="chat-input-row" id="chat-form">
        <input type="text" id="chat-input" placeholder="Ask about events, registration, rules..." autocomplete="off" />
        <button type="submit" class="chat-send-btn" aria-label="Send Message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    `;
    document.body.appendChild(chatModal);
  }

  // Create floating badge indicator
  let botBadge = document.getElementById('eye-bot-badge');
  if (!botBadge) {
    botBadge = document.createElement('div');
    botBadge.id = 'eye-bot-badge';
    botBadge.className = 'eye-bot-badge';
    botBadge.innerHTML = `<span>AI Helper</span>`;
    document.body.appendChild(botBadge);
  }

  let isDocked = false;
  let isOpen = false;
  let animTimeout = null;
  const conversation = [];

  // Load chat history from LocalStorage
  function loadSavedHistory() {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;

    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const history = JSON.parse(saved);
        if (Array.isArray(history) && history.length > 0) {
          messagesEl.innerHTML = '';
          history.forEach(msg => renderMessageBubble(msg.text, msg.isUser, getLocationAction(msg.text, msg.navAction), false));
          renderQuickChips(history[history.length - 1].quickChips || ["Registration", "5 Events", "Rulebook"]);
          messagesEl.scrollTop = messagesEl.scrollHeight;
          return;
        }
      }
    } catch (e) {
      console.warn("LocalStorage read error", e);
    }

    // Default welcome message if no history
    messagesEl.innerHTML = '';
    renderMessageBubble("👋 Hi! I'm your **AI COP Website Assistant**. How can I help you explore the competition, registration, schedule, or rules today?", false, null, false);
    renderQuickChips(["Registration", "5 Events", "Rulebook", "Venue"]);
  }

  function saveHistory(text, isUser, navAction = null, quickChips = []) {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      let history = saved ? JSON.parse(saved) : [];
      history.push({ text, isUser, navAction, quickChips, timestamp: Date.now() });
      if (history.length > 30) history = history.slice(history.length - 30);
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("LocalStorage save error", e);
    }
  }

  function renderQuickChips(chips) {
    const pillsContainer = document.getElementById('chat-pills-container');
    if (!pillsContainer || !Array.isArray(chips)) return;

    pillsContainer.innerHTML = '';
    chips.forEach(chip => {
      const btn = document.createElement('button');
      btn.className = 'chat-pill';
      btn.textContent = chip;
      btn.onclick = () => handleUserMessage(chip);
      pillsContainer.appendChild(btn);
    });
  }

  function executeNavAction(action) {
    if (!action) return;
    if (action.type === 'url' && action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
    } else if (action.type === 'navigate' && action.route) {
      window.location.hash = action.route;
    } else if (action.type === 'scroll' && action.target) {
      const el = document.querySelector(action.target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function renderMessageBubble(text, isUser, navAction = null, shouldAnimate = true) {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return;

    const div = document.createElement('div');
    div.className = `chat-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}${shouldAnimate ? ' animated-bubble' : ''}`;

    // Escape user/model content before applying the small supported Markdown subset.
    const escapedText = String(text).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
    const formattedText = escapedText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');

    div.innerHTML = formattedText;

    // Attach Navigation Action Button if present
    if (!isUser && navAction && navAction.label) {
      const navBtn = document.createElement('button');
      navBtn.className = 'chat-nav-action-btn';
      navBtn.textContent = navAction.label;
      navBtn.onclick = (e) => {
        e.stopPropagation();
        executeNavAction(navAction);
      };
      div.appendChild(navBtn);
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  // Render typing animation indicator (...)
  function showTypingIndicator() {
    const messagesEl = document.getElementById('chat-messages');
    if (!messagesEl) return null;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-bubble bot-bubble typing-indicator';
    typingDiv.id = 'chat-typing-indicator';
    typingDiv.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return typingDiv;
  }

  function removeTypingIndicator() {
    const typingDiv = document.getElementById('chat-typing-indicator');
    if (typingDiv) typingDiv.remove();
  }

  function handleUserMessage(userText) {
    const trimmed = userText.trim();
    if (!trimmed) return;

    // 1. Render User Bubble
    renderMessageBubble(trimmed, true);
    saveHistory(trimmed, true);

    // 2. Show Typing Animation
    const indicator = showTypingIndicator();

    conversation.push({ role: 'user', content: trimmed });

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversation }),
    }).then(async (response) => {
      if (!response.ok) throw new Error('Mistral request failed');
      return response.json();
    }).then((result) => {
      removeTypingIndicator();
      conversation.push({ role: 'assistant', content: result.answer });
      const navAction = getLocationAction(trimmed, result.navAction);

      // Render Bot Bubble & Update Chips
      renderMessageBubble(result.answer, false, navAction, true);
      renderQuickChips(result.quickChips);
      saveHistory(result.answer, false, navAction, result.quickChips);
    }).catch(() => {
      removeTypingIndicator();
      const fallback = intentEngine.classify(trimmed);
      conversation.push({ role: 'assistant', content: fallback.answer });
      const navAction = getLocationAction(trimmed, fallback.navAction);
      renderMessageBubble('The AI assistant is temporarily unavailable.\n\n' + fallback.answer, false, navAction, true);
      renderQuickChips(fallback.quickChips);
      saveHistory(fallback.answer, false, navAction, fallback.quickChips);
    });
  }

  function resetToHeroLayout() {
    canvas.classList.remove('is-flying', 'is-docked-bot');
    canvas.style.position = '';
    canvas.style.top = '';
    canvas.style.left = '';
    canvas.style.width = '';
    canvas.style.height = '';
    canvas.style.transform = '';
    canvas.style.zIndex = '';
    canvas.style.transition = '';
    if (canvas.parentElement !== stage) {
      stage.appendChild(canvas);
    }
  }

  function handleScroll() {
    if (!ctaButtons) return;
    const rect = ctaButtons.getBoundingClientRect();
    const shouldDock = rect.top < window.innerHeight * 0.45;

    if (shouldDock !== isDocked) {
      isDocked = shouldDock;

      if (animTimeout) clearTimeout(animTimeout);

      if (isDocked) {
        const firstRect = canvas.getBoundingClientRect();

        if (canvas.parentElement !== document.body) {
          document.body.appendChild(canvas);
        }

        canvas.style.transition = 'none';
        canvas.style.position = 'fixed';
        canvas.style.top = firstRect.top + 'px';
        canvas.style.left = firstRect.left + 'px';
        canvas.style.width = firstRect.width + 'px';
        canvas.style.height = firstRect.height + 'px';
        canvas.style.transform = 'none';
        canvas.style.zIndex = '1000';
        canvas.classList.add('is-flying');

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            canvas.style.transition = 'all 0.85s cubic-bezier(0.08, 0.85, 0.15, 1)';
            canvas.style.top = (window.innerHeight - 218) + 'px';
            canvas.style.left = (window.innerWidth - 200) + 'px';
            canvas.style.width = '240px';
            canvas.style.height = '240px';
            canvas.classList.add('is-docked-bot');
            if (!isOpen) botBadge.classList.add('visible');
          });
        });
      } else {
        botBadge.classList.remove('visible');
        if (isOpen) toggleChat(false);

        canvas.style.transition = 'all 0.85s cubic-bezier(0.08, 0.85, 0.15, 1)';
        canvas.style.top = '43.5vh';
        canvas.style.left = '49.2vw';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.width = 'min(720px, 90vw)';
        canvas.style.height = 'min(720px, 90vh)';
        canvas.classList.remove('is-docked-bot');

        animTimeout = setTimeout(() => {
          if (!isDocked) {
            resetToHeroLayout();
          }
        }, 860);
      }
    }
  }

  function toggleChat(state) {
    isOpen = state !== undefined ? state : !isOpen;
    if (isOpen) {
      chatModal.classList.add('open');
      botBadge.classList.remove('visible');
      const input = document.getElementById('chat-input');
      if (input) setTimeout(() => input.focus(), 150);
    } else {
      chatModal.classList.remove('open');
      if (isDocked) botBadge.classList.add('visible');
    }
  }

  // Click event on docked Eye bot canvas & badge
  function onBotClick(e) {
    if (isDocked) {
      e.stopPropagation();
      toggleChat();
    }
  }

  canvas.addEventListener('click', onBotClick);
  botBadge.addEventListener('click', onBotClick);

  const closeBtn = document.getElementById('chat-close-btn');
  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      toggleChat(false);
    };
  }

  const chatForm = document.getElementById('chat-form');
  if (chatForm) {
    chatForm.onsubmit = (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      if (input && input.value.trim()) {
        const val = input.value;
        input.value = '';
        handleUserMessage(val);
      }
    };
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check keeps the eye between the title words.
  loadSavedHistory(); // Restore history from LocalStorage

  return () => {
    window.removeEventListener('scroll', handleScroll);
    canvas.removeEventListener('click', onBotClick);
    botBadge.removeEventListener('click', onBotClick);
    chatModal.remove();
    botBadge.remove();
    resetToHeroLayout();
  };
}
