/**
 * server.js — Phoebe's Node.js/Express backend.
 *
 * Loads the static knowledge base once at startup, exposes POST /api/chat,
 * and serves the frontend from /public. All response text comes from
 * phoebe_knowledge_base.json via nlp.js — no generative logic lives here.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const { classify } = require('./nlp.js');

const PORT = process.env.PORT || 3000;
const KB_PATH = path.join(__dirname, 'phoebe_knowledge_base.json');

const knowledgeBase = JSON.parse(fs.readFileSync(KB_PATH, 'utf8'));

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/chat', (req, res) => {
  const message = req.body && typeof req.body.message === 'string' ? req.body.message : '';

  if (!message.trim()) {
    return res.status(400).json({
      response: "I didn't receive any message — could you type something?",
      intent: 'error',
    });
  }

  const { intent, response } = classify(message, knowledgeBase);
  res.json({ response, intent });
});

app.listen(PORT, () => {
  console.log(`Phoebe is listening on http://localhost:${PORT}`);
});
