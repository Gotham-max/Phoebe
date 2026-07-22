/**
 * script.js — Phoebe's frontend chat logic.
 * Talks to POST /api/chat and renders the conversation. No frameworks.
 */

(function () {
  'use strict';

  const chatWindow = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-btn');

  const GREETING =
    "Hi, I'm Phoebe — your FUPRE information assistant. I can help you with registration, the academic calendar, exams, clearance, hostel accommodation, fees, results, and finding departments or contacts. What would you like to know?";

  function addMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = 'message ' + sender;
    bubble.textContent = text; // textContent, never innerHTML — avoids XSS from user or bot text
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return bubble;
  }

  function showTyping() {
    const bubble = document.createElement('div');
    bubble.className = 'message typing';
    bubble.innerHTML = '<span class="typing-dots"><span></span><span></span><span></span></span>';
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return bubble;
  }

  async function sendMessage(text) {
    addMessage(text, 'user');
    chatInput.value = '';
    sendBtn.disabled = true;

    const typingBubble = showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error('Server responded with status ' + res.status);
      }

      const data = await res.json();
      typingBubble.remove();
      addMessage(data.response, 'bot');
    } catch (err) {
      typingBubble.remove();
      addMessage(
        "Sorry, I can't reach the server right now. Please check your connection and try again.",
        'error'
      );
    } finally {
      sendBtn.disabled = false;
      chatInput.focus();
    }
  }

  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    sendMessage(text);
  });

  addMessage(GREETING, 'bot');
})();
