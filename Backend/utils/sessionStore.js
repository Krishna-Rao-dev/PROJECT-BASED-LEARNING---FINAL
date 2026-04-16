// utils/sessionStore.js
// In-memory store keyed by sessionId.
// Mirrors: MemorySaver + GraphState (messages, user_state, last_agent_output)

const sessions = new Map();

/**
 * Default UserState — mirrors the Python Pydantic model.
 */
function defaultUserState() {
  return {
    budget: null,
    family_size: null,
    fuel_preference: null,
    usage_pattern: null,
    location: null,
    needs_interruption: false,
    is_hinglish_speaker: false,
    query_type: "general",
  };
}

/**
 * Retrieve or initialise a session.
 * @param {string} sessionId
 * @returns {{ messages: Array, userState: object, lastAgentOutput: object|null }}
 */
export function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      messages: [],          // { role: 'human'|'assistant', content: string }[]
      userState: defaultUserState(),
      lastAgentOutput: null,
    });
  }
  return sessions.get(sessionId);
}

/**
 * Persist updated session fields back to the store.
 */
export function updateSession(sessionId, patch) {
  const session = getSession(sessionId);
  Object.assign(session, patch);
  sessions.set(sessionId, session);
}

/**
 * Append a message to the session's message list.
 */
export function appendMessage(sessionId, role, content) {
  const session = getSession(sessionId);
  session.messages.push({ role, content });
}

/**
 * List all active session IDs.
 */
export function listSessions() {
  return [...sessions.keys()];
}
