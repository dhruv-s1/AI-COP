import { createServer as createViteServer, loadEnv } from 'vite';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const port = Number(process.env.PORT || 5173);
const root = process.cwd();
const env = loadEnv('development', root, '');
const groqApiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY;
const groqModel = process.env.GROQ_MODEL || env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const requestCounts = new Map();
const MAX_BODY_SIZE = 256 * 1024;
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 30;
const VALID_EVENTS = new Set(['event1', 'event2', 'event3', 'event4']);
const PARTICIPANT_COUNTS = {
  event1: Number(env.VITE_ETHICAL_CONFERENCE_PARTICIPANTS) || 1,
  event2: Number(env.VITE_HACKATHON_PARTICIPANTS) || 1,
  event3: Number(env.VITE_AI_STUDIO_PARTICIPANTS) || 1,
  event4: Number(env.VITE_ROUNDTABLE_CONFERENCE_PARTICIPANTS) || 1,
};
const firebaseConfigured = Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);
const firebaseApp = firebaseConfigured
  ? (getApps()[0] || initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  }))
  : null;
const firestore = firebaseApp ? getFirestore(firebaseApp) : null;

const knowledgeBase = `
AICon is an interschool artificial intelligence competition hosted by GEMS Our Own Indian School (GEMS OIS), Al Quoz 1, Dubai, UAE.
Host school website: https://www.gemsoo-alquoz.com/
Contact: info_ois@gemsedu.com, +971 4 3391188. Venue: GEMS Our Own Indian School, Al Quoz, Dubai, UAE.
Registration is free. The registration page is #/register. Users select events, then enter school details and coordinator details in the form wizard.
The all-events page is #/events. The four event detail routes are #/event/1 through #/event/4.
Event 1: Ethical Conference. Case study and conference presentation. Team: 2-4 members. Download brief: /downloads/ethical-conference.txt.
Event 2: Hackathon. 3-hour build sprint and demo. Team: 2-4 members. Download brief: /downloads/hackathon.txt.
Event 3: AI Studio. Structured debate and rebuttal. Team: 2 members. Download brief: /downloads/ai-studio.txt.
Event 4: Roundtable Conference. Roundtable pitch and open discussion. Team: 3-5 members. Download brief: /downloads/roundtable-conference.txt.
Website navigation: Home is #/. Events is #/events. Registration is #/register. A section scroll to the home events deck uses #section-events-deck-section.
When guiding a user, use navigate for internal hash routes, scroll for the home events section, and url only for the school website. Never invent dates, prices, rules, contacts, or routes.
`;

const systemPrompt = `You are the official AICon website assistant. Answer using only the knowledge base below. Be warm, concise, and helpful. You can explain the website UI when asked.

Return ONLY valid JSON with this exact shape:
{"answer":"string with optional Markdown","quickChips":["string"],"navAction":null|{"type":"navigate"|"scroll"|"url","route":"string","target":"string","url":"string","label":"string"}}
For navigate, include route and label. For scroll, include target and label. For url, include url and label. Omit irrelevant fields. Use at most 4 quickChips. If the answer is not in the knowledge base, say that you do not have confirmed information and suggest a relevant page. Do not claim to have performed an action.

KNOWLEDGE BASE:
${knowledgeBase}`;

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

function isRateLimited(request) {
  const now = Date.now();
  const address = request.socket.remoteAddress || 'unknown';
  const current = requestCounts.get(address);
  if (!current || now - current.startedAt >= RATE_WINDOW_MS) {
    requestCounts.set(address, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT;
}

async function readJsonBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_SIZE) {
      throw new Error('Request body is too large');
    }
  }
  return JSON.parse(body || '{}');
}

function validateRegistration(payload) {
  const selectedEvents = payload?.selectedEvents;
  const data = payload?.data;
  if (!Array.isArray(selectedEvents) || selectedEvents.length === 0 || new Set(selectedEvents).size !== selectedEvents.length || selectedEvents.some((event) => !VALID_EVENTS.has(event))) {
    return 'Select at least one valid event.';
  }
  if (!data || typeof data !== 'object' || Array.isArray(data) || Object.keys(data).length > 200) {
    return 'Registration data is invalid.';
  }

  const requiredFields = ['schoolName', 'city', 'coordinatorName', 'coordinatorEmail', 'coordinatorPhone'];
  if (requiredFields.some((field) => typeof data[field] !== 'string' || !data[field].trim())) {
    return 'Complete all school and coordinator details.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.coordinatorEmail)) {
    return 'Enter a valid coordinator email address.';
  }

  const participantFields = Object.entries(data).filter(([key]) => /_participant\d+_(name|email|phone|grade)$/.test(key));
  for (const eventId of selectedEvents) {
    for (let participantIndex = 1; participantIndex <= PARTICIPANT_COUNTS[eventId]; participantIndex++) {
      for (const field of ['name', 'email', 'phone', 'grade']) {
        const key = `${eventId}_participant${participantIndex}_${field}`;
        if (typeof data[key] !== 'string' || !data[key].trim()) return 'Complete all participant details.';
      }
    }
  }
  if (participantFields.length === 0) return 'Complete all participant details.';
  for (const [key, value] of participantFields) {
    if (key.endsWith('_email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter valid participant email addresses.';
    if (key.endsWith('_phone') && !/^[+\d][\d\s().-]{6,}$/.test(value)) return 'Enter valid participant phone numbers.';
  }
  return null;
}

function parseModelResponse(content) {
  const cleaned = content.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  const parsed = JSON.parse(cleaned);
  if (typeof parsed.answer !== 'string') throw new Error('Groq response missing answer');
  return {
    answer: parsed.answer,
    quickChips: Array.isArray(parsed.quickChips) ? parsed.quickChips.slice(0, 4).map(String) : ['Registration', '4 Events', 'Venue'],
    navAction: parsed.navAction && typeof parsed.navAction === 'object' ? parsed.navAction : null,
  };
}

async function handleChat(request, response) {
  if (isRateLimited(request)) {
    sendJson(response, 429, { error: 'Too many requests. Please try again later.' });
    return;
  }
  if (!groqApiKey) {
    sendJson(response, 503, { error: 'Groq is not configured. Add GROQ_API_KEY to your environment.' });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    const safeMessages = messages
      .filter((message) => message && (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
      .slice(-12)
      .map((message) => ({ role: message.role, content: message.content.slice(0, 2000) }));

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqApiKey}` },
      body: JSON.stringify({ model: groqModel, temperature: 0.2, max_tokens: 500, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: systemPrompt }, ...safeMessages] }),
    });

    if (!groqResponse.ok) {
      const detail = await groqResponse.text();
      throw new Error(`Groq request failed (${groqResponse.status}): ${detail.slice(0, 300)}`);
    }

    const result = await groqResponse.json();
    sendJson(response, 200, parseModelResponse(result.choices?.[0]?.message?.content || '{}'));
  } catch (error) {
    console.error(error);
    sendJson(response, 502, { error: 'The AI assistant could not respond right now.' });
  }
}

async function handleRegistration(request, response) {
  if (isRateLimited(request)) {
    sendJson(response, 429, { error: 'Too many requests. Please try again later.' });
    return;
  }

  if (!firestore) {
    sendJson(response, 503, { error: 'Registration is not configured. Add the Firebase server credentials.' });
    return;
  }

  try {
    const payload = await readJsonBody(request);
    const validationError = validateRegistration(payload);
    if (validationError) {
      sendJson(response, 400, { error: validationError });
      return;
    }
    const normalizedSchool = data.schoolName.trim().toLowerCase().replace(/\s+/g, ' ');
    const normalizedEmail = data.coordinatorEmail.trim().toLowerCase();
    const registrationKey = createHash('sha256')
      .update(`${normalizedSchool}:${normalizedEmail}`)
      .digest('hex');
    const registrationRef = firestore.collection('registrations').doc(registrationKey);

    await firestore.runTransaction(async (transaction) => {
      const existing = await transaction.get(registrationRef);
      if (existing.exists) throw new Error('REGISTRATION_ALREADY_EXISTS');
      transaction.set(registrationRef, {
        ...payload,
        schoolNameNormalized: normalizedSchool,
        coordinatorEmailNormalized: normalizedEmail,
        submittedAt: FieldValue.serverTimestamp(),
        status: 'submitted',
      });
    });
    sendJson(response, 201, { ok: true, registrationId: registrationKey });
  } catch (error) {
    if (error.message === 'REGISTRATION_ALREADY_EXISTS') {
      sendJson(response, 409, { error: 'This school has already registered with this coordinator email.' });
      return;
    }
    const status = error.message === 'Request body is too large' || error instanceof SyntaxError ? 400 : 500;
    console.error(error);
    sendJson(response, status, { error: status === 400 ? 'Invalid registration request.' : 'Registration could not be saved.' });
  }
}

const vite = await createViteServer({ root, server: { middlewareMode: true }, appType: 'spa' });
const server = createServer((request, response) => {
  if (request.url === '/api/chat' && request.method === 'POST') {
    handleChat(request, response);
    return;
  }
  if (request.url === '/api/registrations' && request.method === 'POST') {
    handleRegistration(request, response);
    return;
  }
  vite.middlewares(request, response, () => {
    response.statusCode = 404;
    response.end('Not found');
  });
});

server.listen(port, () => console.log(`AICon running at http://localhost:${port}`));
