const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Provider Initialization ─────────────────────────────────────────────────

// Gemini (Google)
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// OpenAI — lazy-load to avoid crash if SDK missing
let openaiClient = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch { /* openai package may not be installed yet */ }

// Anthropic Claude — lazy-load
let anthropicClient = null;
try {
  if (process.env.ANTHROPIC_API_KEY) {
    const Anthropic = require('@anthropic-ai/sdk');
    anthropicClient = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
} catch { /* anthropic package may not be installed yet */ }

// ─── Provider Router ─────────────────────────────────────────────────────────

/**
 * Resolve the best available provider.
 * Priority: requested provider → first available → demo fallback.
 */
const resolveProvider = (requested = 'auto') => {
  const available = [];
  if (geminiClient) available.push('gemini');
  if (openaiClient) available.push('openai');
  if (anthropicClient) available.push('claude');

  if (requested !== 'auto' && available.includes(requested)) return requested;
  return available[0] || 'demo';
};

/**
 * Call the AI provider with a given system prompt + user prompt.
 */
const callAI = async (provider, systemPrompt, userPrompt, model = null) => {
  switch (provider) {
    case 'gemini': {
      const geminiModel = geminiClient.getGenerativeModel({ model: model || 'gemini-1.5-flash' });
      const result = await geminiModel.generateContent(`${systemPrompt}\n\nUser: ${userPrompt}`);
      return result.response.text();
    }

    case 'openai': {
      const completion = await openaiClient.chat.completions.create({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2048,
      });
      return completion.choices[0].message.content;
    }

    case 'claude': {
      const message = await anthropicClient.messages.create({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      return message.content[0].text;
    }

    case 'demo':
    default:
      return `🤖 **Gravity AI — Demo Mode**\n\nI'm running without a live API key. Add \`GEMINI_API_KEY\`, \`OPENAI_API_KEY\`, or \`ANTHROPIC_API_KEY\` to your \`.env\` to unlock full AI capabilities.\n\n*Your question was:* "${userPrompt}"`;
  }
};

// ─── Gravity AI System Identity ───────────────────────────────────────────────

const GRAVITY_SYSTEM = (context = {}) => `
You are **Gravity AI**, the intelligent core of the Anti Gravity developer platform.
You are embedded inside a collaborative developer OS that combines Discord-style communication,
VS Code-style coding, and GitHub collaboration.

Your personality: sharp, concise, professional, developer-friendly. Avoid over-explaining.
Format code blocks in markdown. Be direct and action-oriented.

Workspace Context:
- Workspace: ${context.workspaceName || 'Unknown'}
- User: ${context.username || 'Developer'}
- Active Module: ${context.module || 'General'}
`.trim();

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/ai/query — General chat with provider selection
router.post('/query', async (req, res) => {
  try {
    const { prompt, context = {}, provider: requestedProvider = 'auto', model } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ message: 'Prompt is required.' });
    }

    const provider = resolveProvider(requestedProvider);
    const response = await callAI(provider, GRAVITY_SYSTEM(context), prompt, model);

    res.json({
      response,
      role: 'assistant',
      provider,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('AI Query Error:', error?.message || error);
    res.status(500).json({ message: 'Gravity AI encountered an error. Please try again.' });
  }
});

// POST /api/ai/analyze-code — Code review & bug detection
router.post('/analyze-code', async (req, res) => {
  try {
    const { code, filename = 'file', language = 'javascript', provider: requestedProvider = 'auto', model } = req.body;
    const provider = resolveProvider(requestedProvider);

    const systemPrompt = `${GRAVITY_SYSTEM()}

You are in Code Analysis mode. Review code for:
1. Bugs and logic errors
2. Security vulnerabilities
3. Performance issues
4. Code quality and readability
Format your response with clear sections and inline code.`;

    const userPrompt = `Analyze this ${language} file "${filename}":\n\`\`\`${language}\n${code}\n\`\`\``;
    const analysis = await callAI(provider, systemPrompt, userPrompt, model);

    res.json({ analysis, provider, timestamp: new Date() });
  } catch (error) {
    console.error('Code Analysis Error:', error?.message);
    res.status(500).json({ message: 'Failed to analyze code.' });
  }
});

// POST /api/ai/pair-program — AI pair programming assistant
router.post('/pair-program', async (req, res) => {
  try {
    const { code, task, language = 'javascript', context = {}, provider: requestedProvider = 'auto', model } = req.body;
    const provider = resolveProvider(requestedProvider);

    const systemPrompt = `${GRAVITY_SYSTEM(context)}

You are in Pair Programming mode. The developer needs help implementing a feature.
- Provide complete, working code
- Explain key decisions briefly
- Use the same language/framework as the existing code
- Follow best practices for ${language}`;

    const userPrompt = `Task: ${task}\n\nExisting code:\n\`\`\`${language}\n${code || '// Empty file'}\n\`\`\``;
    const response = await callAI(provider, systemPrompt, userPrompt, model);

    res.json({ response, provider, timestamp: new Date() });
  } catch (error) {
    console.error('Pair Program Error:', error?.message);
    res.status(500).json({ message: 'Pair programming session failed.' });
  }
});

// POST /api/ai/workspace-health — AI workspace analytics
router.post('/workspace-health', async (req, res) => {
  try {
    const { tasks = [], members = [], deployments = [], context = {}, provider: requestedProvider = 'auto' } = req.body;
    const provider = resolveProvider(requestedProvider);

    const systemPrompt = `${GRAVITY_SYSTEM(context)}

You are in Workspace Health Analysis mode. Analyze the workspace metrics and provide:
1. Overall productivity score (0-100)
2. Key bottlenecks
3. Team velocity assessment
4. Actionable recommendations
Be specific and data-driven.`;

    const userPrompt = `
Workspace metrics:
- Total tasks: ${tasks.length}
- Pending/blocked tasks: ${tasks.filter(t => t.columnId !== 'Done').length}
- Team members: ${members.length}
- Recent deployments: ${deployments.length}
- Failed deployments: ${deployments.filter(d => d.status === 'failed').length}

Provide a comprehensive workspace health report.`;

    const response = await callAI(provider, systemPrompt, userPrompt);
    res.json({ response, provider, timestamp: new Date() });
  } catch (error) {
    console.error('Workspace Health Error:', error?.message);
    res.status(500).json({ message: 'Failed to generate workspace health report.' });
  }
});

// POST /api/ai/summarize-meeting — Voice/meeting transcript summarization
router.post('/summarize-meeting', async (req, res) => {
  try {
    const { transcript, participants = [], duration = 0, context = {}, provider: requestedProvider = 'auto' } = req.body;
    const provider = resolveProvider(requestedProvider);

    const systemPrompt = `${GRAVITY_SYSTEM(context)}

You are in Meeting Summarization mode. Generate:
1. TL;DR (2-3 sentences)
2. Key decisions made
3. Action items (with assignees if mentioned)
4. Follow-up questions
Format as clean markdown.`;

    const userPrompt = `Meeting transcript (${duration} mins, ${participants.length} participants):\n\n${transcript}`;
    const response = await callAI(provider, systemPrompt, userPrompt);

    res.json({ response, provider, timestamp: new Date() });
  } catch (error) {
    console.error('Meeting Summary Error:', error?.message);
    res.status(500).json({ message: 'Failed to summarize meeting.' });
  }
});

// GET /api/ai/providers — Returns which AI providers are available
router.get('/providers', (req, res) => {
  res.json({
    available: [
      { id: 'gemini', name: 'Gemini (Google)', active: !!geminiClient, models: ['gemini-1.5-flash', 'gemini-1.5-pro'] },
      { id: 'openai', name: 'OpenAI', active: !!openaiClient, models: ['gpt-4o-mini', 'gpt-4o'] },
      { id: 'claude', name: 'Claude (Anthropic)', active: !!anthropicClient, models: ['claude-3-haiku-20240307', 'claude-3-5-sonnet-20241022'] },
    ],
    default: resolveProvider('auto'),
  });
});

module.exports = router;
