// utils/persistentSessionStore.js
// MongoDB-based persistent storage for chat sessions

import mongoose from "mongoose";

const MONGODB_URI = "mongodb://localhost:27017/Tata-Motors";

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log(`[MongoDB] Connected to ${MONGODB_URI}`))
  .catch(err => console.error(`[MongoDB] Connection error:`, err));

const SessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
  userState: { type: mongoose.Schema.Types.Mixed, default: {} },
  lastAgentOutput: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: String },
  updatedAt: { type: String },
}, { collection: 'sales_assistant', strict: false });

const Session = mongoose.model('Session', SessionSchema);

/**
 * Default UserState — mirrors the Python Pydantic model / original defaults.
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
 * Load session from DB
 */
export async function getSession(sessionId) {
  try {
    let session = await Session.findOne({ id: sessionId }).lean();
    
    if (!session) {
      console.log(`[getSession] Session ${sessionId} not found. Creating fresh session.`);
      const now = new Date().toISOString();
      const newSession = new Session({
        id: sessionId,
        messages: [],
        userState: defaultUserState(),
        lastAgentOutput: null,
        createdAt: now,
        updatedAt: now,
      });
      await newSession.save();
      return newSession.toObject();
    }
    
    return session;
  } catch (err) {
    console.error(`[getSession] Error loading session ${sessionId}:`, err);
    throw err;
  }
}

/**
 * Update session and persist to DB
 */
export async function updateSession(sessionId, patch) {
  try {
    const updated = await Session.findOneAndUpdate(
      { id: sessionId },
      { 
        $set: {
          ...patch,
          updatedAt: new Date().toISOString()
        }
      },
      { new: true, lean: true }
    );
    return updated;
  } catch (err) {
    console.error(`[updateSession] Error updating session ${sessionId}:`, err);
    throw err;
  }
}

/**
 * Append a message to the session and persist
 * @param {string} sessionId
 * @param {string} role - "human" or "assistant"
 * @param {string} content - message text
 * @param {object} metadata - optional {component, follow_up} for assistant messages
 */
export async function appendMessage(sessionId, role, content, metadata = {}) {
  try {
    const newMsg = {
      role,
      content,
      timestamp: new Date().toISOString(),
      ...metadata, // Include component, follow_up, etc. if provided
    };
    
    await Session.findOneAndUpdate(
      { id: sessionId },
      { 
        $push: { messages: newMsg },
        $set: { updatedAt: new Date().toISOString() }
      }
    );
  } catch (err) {
    console.error(`[appendMessage] Error appending to session ${sessionId}:`, err);
    throw err;
  }
}

/**
 * List all active session IDs
 */
export async function listSessions() {
  try {
    const sessions = await Session.find({}, { id: 1 }).lean();
    return sessions.map(s => s.id);
  } catch (err) {
    console.error("Failed to list sessions:", err);
    return [];
  }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId) {
  try {
    await Session.deleteOne({ id: sessionId });
  } catch (err) {
    console.error(`Failed to delete session ${sessionId}:`, err);
  }
}

/**
 * Clear all messages in a session (keep metadata)
 */
export async function clearSessionMessages(sessionId) {
  try {
    await Session.findOneAndUpdate(
      { id: sessionId },
      { 
        $set: {
          messages: [],
          userState: defaultUserState(),
          updatedAt: new Date().toISOString()
        } 
      }
    );
  } catch (err) {
    console.error(`Failed to clear session ${sessionId}:`, err);
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats(sessionId) {
  try {
    const session = await getSession(sessionId);
    return {
      sessionId,
      messageCount: session.messages ? session.messages.length : 0,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      userState: session.userState,
    };
  } catch (err) {
    console.error(`Failed to get session stats for ${sessionId}:`, err);
    throw err;
  }
}
