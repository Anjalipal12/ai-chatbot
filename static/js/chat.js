// ── State ──────────────────────────────────────────────
let conversationHistory = [];
let totalTokens = 0;
let isLoading = false;

// ── DOM references ──────────────────────────────────────
const messagesContainer = document.getElementById('messagesContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const tokenCount = document.getElementById('tokenCount');
const modelSelect = document.getElementById('modelSelect');
const streamToggle = document.getElementById('streamToggle');
const activeBadge = document.getElementById('activeBadge');
const statusDot = document.getElementById('statusDot');

// ── Initialization ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  modelSelect.addEventListener('change', () => {
    activeBadge.textContent = modelSelect.options[modelSelect.selectedIndex].text.split('(')[0].trim();
  });
});

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (!data.api_key_configured) {
      statusDot.classList.add('error');
      statusDot.title = 'API key not configured';
    }
  } catch {
    statusDot.classList.add('error');
  }
}

// ── Sending messages ────────────────────────────────────
async function sendMessage() {
  const text = userInput.value.trim();
  if (!text || isLoading) return;

  hideWelcome();
  appendMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });

  userInput.value = '';
  autoResize(userInput);
  setLoading(true);

  const useStream = streamToggle.checked;
  useStream ? await sendStreaming() : await sendNormal();
}

async function sendNormal() {
  const typingId = showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        model: modelSelect.value,
        stream: false,
      }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();

    removeTyping(typingId);
    appendMessage('ai', data.reply);
    conversationHistory.push({ role: 'assistant', content: data.reply });

    totalTokens += data.tokens_used;
    tokenCount.textContent = totalTokens.toLocaleString();

  } catch (err) {
    removeTyping(typingId);
    appendMessage('ai', `⚠️ Error: ${err.message}. Please check your API key and try again.`);
  } finally {
    setLoading(false);
  }
}

async function sendStreaming() {
  const aiMsgEl = appendMessage('ai', '');
  const bubbleEl = aiMsgEl.querySelector('.bubble');
  let fullText = '';

  try {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: conversationHistory,
        model: modelSelect.value,
        stream: true,
      }),
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') break;

        try {
          const parsed = JSON.parse(raw);
          if (parsed.token) {
            fullText += parsed.token;
            bubbleEl.innerHTML = formatMarkdown(fullText) + '<span class="cursor">▌</span>';
            scrollToBottom();
          }
          if (parsed.error) throw new Error(parsed.error);
        } catch { /* partial JSON chunk, continue */ }
      }
    }

    // Finalise — remove cursor
    bubbleEl.innerHTML = formatMarkdown(fullText);
    conversationHistory.push({ role: 'assistant', content: fullText });

  } catch (err) {
    bubbleEl.innerHTML = `⚠️ Error: ${err.message}`;
  } finally {
    setLoading(false);
  }
}

function sendSuggestion(text) {
  userInput.value = text;
  sendMessage();
}

// ── UI helpers ──────────────────────────────────────────
function appendMessage(role, content) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;
  wrapper.innerHTML = `
    <div class="avatar ${role}">${role === 'ai' ? '✦' : '👤'}</div>
    <div class="bubble">${role === 'ai' ? formatMarkdown(content) : escapeHtml(content)}</div>
  `;
  messagesContainer.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

function showTyping() {
  const id = 'typing-' + Date.now();
  const el = document.createElement('div');
  el.className = 'message ai';
  el.id = id;
  el.innerHTML = `
    <div class="avatar ai">✦</div>
    <div class="bubble">
      <div class="typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  messagesContainer.appendChild(el);
  scrollToBottom();
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

function hideWelcome() {
  document.getElementById('welcomeScreen')?.remove();
}

function setLoading(state) {
  isLoading = state;
  sendBtn.disabled = state;
  userInput.disabled = state;
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function newChat() {
  conversationHistory = [];
  totalTokens = 0;
  tokenCount.textContent = '0';
  messagesContainer.innerHTML = `
    <div class="welcome" id="welcomeScreen">
      <div class="welcome-icon">✦</div>
      <h2>How can I help you today?</h2>
      <p>Ask me anything — code, concepts, creative writing, analysis.</p>
      <div class="suggestions">
        <button class="suggestion-chip" onclick="sendSuggestion('Explain how FastAPI works with a simple example')">Explain FastAPI with an example</button>
        <button class="suggestion-chip" onclick="sendSuggestion('What is prompt engineering and how do I get better at it?')">What is prompt engineering?</button>
        <button class="suggestion-chip" onclick="sendSuggestion('Write a Python function to call the OpenAI API')">Write an OpenAI API function</button>
        <button class="suggestion-chip" onclick="sendSuggestion('What skills do I need to become a Full Stack AI Engineer?')">Skills for Full Stack AI Engineer</button>
      </div>
    </div>
  `;
}

// ── Keyboard handling ───────────────────────────────────
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
}

// ── Text formatting ─────────────────────────────────────
function formatMarkdown(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // Code blocks
    .replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    // Paragraphs (blank lines)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}
