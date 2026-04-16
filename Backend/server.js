// server.js
// Express backend for the Tata Motors AI Sales Assistant.
//
// POST /chat-web         — main agentic chat endpoint
// GET  /health           — liveness probe
// POST /session/clear    — clear a session's history
// GET  /leads            — fetch all leads from DB
// POST /leads/:id/accept — atomic accept (race-condition safe)
// POST /leads/:id/complete — atomic complete
// WS   ws://localhost:PORT — real-time lead broadcasting

import http from "http";
import { WebSocketServer } from "ws";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

import { runPipeline } from "./agents/pipeline.js";
import { chatComplete } from "./config/llm.js";
import TestDriveRequest from "./models/TestDriveRequest.js";
import {
  listSessions,
  getSession,
  clearSessionMessages,
  deleteSession,
} from "./utils/persistentSessionStore.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── HTTP + WebSocket server ──────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

/** Broadcast a JSON event to every connected WebSocket client. */
function broadcast(event, payload) {
  const msg = JSON.stringify({ event, payload });
  for (const ws of wss.clients) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

wss.on("connection", (ws) => {
  console.log(`[WS] Client connected (total: ${wss.clients.size})`);
  ws.on("close", () => console.log(`[WS] Client disconnected (total: ${wss.clients.size})`));
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── POST /chat-web ─────────────────────────────────────────────────────────────
/**
 * Main chat endpoint.
 *
 * Request Body:
 * {
 *   "message"   : string,           // required — user's message
 *   "session_id": string (optional) // if omitted, a new session is created
 * }
 *
 * Response:
 * {
 *   "session_id"          : string,
 *   "text"                : string,   // assistant's natural-language reply
 *   "component"           : object | null,  // UI component payload
 *   "follow_up"           : string | null,  // suggested follow-up question
 *   "needs_interruption"  : boolean,  // true → user wants test drive / booking
 *   "user_state"          : object    // updated user profile
 * }
 */
app.post("/chat-web", async (req, res) => {
  const { message, session_id } = req.body;

  // Validate
  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({
      error: "Bad Request",
      detail: "`message` is required and must be a non-empty string.",
    });
  }

  // Use provided session_id or mint a new one
  const sessionId = (session_id && session_id.trim()) || uuidv4();

  try {
    const result = await runPipeline(sessionId, message.trim());

    return res.status(200).json({
      session_id: sessionId,
      text: result.text,
      component: result.component ?? null,
      follow_up: result.follow_up ?? null,
      needs_interruption: result.needs_interruption ?? false,
      user_state: result.userState,
    });
  } catch (err) {
    console.error(`[/chat-web] Unhandled error for session ${sessionId}:`, err);
    return res.status(500).json({
      error: "Internal Server Error",
      detail: err.message,
    });
  }
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  const sessions = await listSessions();
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    active_sessions: sessions.length,
  });
});

// ── GET /sessions ──────────────────────────────────────────────────────────────
// List all sessions with metadata (for sidebar chat history)
app.get("/sessions", async (_req, res) => {
  try {
    const sessionIds = await listSessions();
    const sessionsWithMetadata = [];

    for (const sessionId of sessionIds) {
      try {
        const session = await getSession(sessionId);
        sessionsWithMetadata.push({
          id: sessionId,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messages?.length || 0,
        });
      } catch (err) {
        console.warn(`Failed to load metadata for session ${sessionId}:`, err.message);
      }
    }

    // Sort by most recent first
    sessionsWithMetadata.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json(sessionsWithMetadata);
  } catch (err) {
    console.error("[/sessions] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /session/:id ──────────────────────────────────────────────────────────
// Get full session state with message history
app.get("/session/:id", async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /session/:id/messages ────────────────────────────────────────────────
// Get just the message history for a session (for frontend recovery)
app.get("/session/:id/messages", async (req, res) => {
  try {
    const session = await getSession(req.params.id);
    res.json({
      session_id: req.params.id,
      messages: session.messages,
      user_state: session.userState,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /session/clear ───────────────────────────────────────────────────────
// Clear chat history for a session
app.post("/session/clear", async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: "session_id required" });
  }

  try {
    await clearSessionMessages(session_id);
    res.json({ success: true, message: "Chat history cleared" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /session/delete ──────────────────────────────────────────────────────
// Delete entire session
app.post("/session/delete", async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: "session_id required" });
  }

  try {
    await deleteSession(session_id);
    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /summarize-chat ─────────────────────────────────────────────────────
// Fetches session messages and returns a 5-line LLM summary string
app.post("/summarize-chat", async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: "session_id is required" });
  }

  try {
    const session = await getSession(session_id);
    const messages = session.messages || [];

    if (messages.length === 0) {
      return res.status(400).json({ error: "No messages found for this session" });
    }

    // Format messages into a readable string for the LLM
    const formattedMessages = messages
      .map((m) => `${m.role === "human" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt = `You are a specialist in summarising messages of a chat. You would see 'User' & 'Assistant' messages, analyse in such a way that it tells : what user needs, what user knows, what user tends to feel,what are his/her interests, what are the user's preferences - inshort sixty percent user centric and forty percent Assistant message centric. The entire use of Assistant message is to let know what user knows now.
     If user message was "tell me about nexon" then the summary must be include the fact about user's interest of tata nexon.  SUMMARY MUST BE USER CENTRIC. MEANING ABOUT WHAT USER NEEDS, HAS INTEREST IN, WANTS, DEMANDS, KNOWS.
     Here are some good examples to understand from:
     1.(Given an unique set of Messages - conversation between Assistant and Human):
     "The user was exploring which SUV—Tata Harrier or Tata Safari—would better suit their needs.\n
    Their priority shifted toward family trips, indicating a need for more seating and practicality.\n
    While both vehicles offer similar performance and safety, space and flexibility became the deciding factors.\n
    The Safari aligns more closely with the user’s requirements due to its 6–7 seating configuration.\n
    Overall, the recommendation naturally leaned toward Safari as a better fit for their usage."

    2.(Given another unique set of Messages - conversation between Assistant and Human):
    "The user showed interest in financing options for the Tata Nexon Diesel variant.\n
    They were presented with an EMI plan based on a standard 60-month tenure.\n
    The user then expressed a preference for a shorter loan duration to repay faster.\n
    A revised 48-month EMI plan was shared, resulting in a higher monthly installment.\n
    Overall, the user appears focused on reducing loan tenure even at the cost of increased EMI."

    Now, Summarise the following ${formattedMessages} into the most simple words. Format of output must be 5 unique lines of summary seperated by "\n" (next line) - VERY IMPORTANT, 
RETURN STRICTLY  ONLY 5 LINES OF SUMMARY SEPERATED BY "\n" `;

    const summary = await chatComplete([
      { role: "user", content: prompt },
    ], { temperature: 0.4, max_tokens: 512 });

    return res.status(200).json({ summary: summary.trim() });
  } catch (err) {
    console.error(`[/summarize-chat] Error for session ${session_id}:`, err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /send-form ───────────────────────────────────────────────────────────
// Receives test drive form data + summary_chat, persists to MongoDB, broadcasts
app.post("/send-form", async (req, res) => {
  const { formData, summary_chat } = req.body;

  if (!formData) {
    return res.status(400).json({ error: "formData is required" });
  }

  try {
    console.log("[/send-form] New test drive booking received:");
    console.log("  Form Data:", JSON.stringify(formData, null, 2));
    console.log("  Chat Summary:\n", summary_chat || "(none)");

    const request = new TestDriveRequest({
      name:         formData.name,
      email:        formData.email || "",
      phone:        formData.phone,
      date:         formData.date,
      time:         formData.time,
      showroom:     formData.showroom,
      car:          formData.car,
      summary_chat: summary_chat || null,
    });

    const saved = await request.save();
    console.log(`[/send-form] Saved to DB with _id: ${saved._id}`);

    // Broadcast to all connected dashboards
    broadcast("new_lead", saved.toObject());

    return res.status(201).json({
      success: true,
      message: "Test drive request saved successfully",
      id: saved._id,
    });
  } catch (err) {
    console.error("[/send-form] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /leads ────────────────────────────────────────────────────────────────
// Fetch all leads from MongoDB, most recent first
app.get("/leads", async (_req, res) => {
  try {
    const leads = await TestDriveRequest.find({}).sort({ createdAt: -1 }).lean();
    return res.json(leads);
  } catch (err) {
    console.error("[/leads] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /leads/:id/accept ────────────────────────────────────────────────────
// Atomic accept — prevents race condition where two salespersons click Accept
app.post("/leads/:id/accept", async (req, res) => {
  try {
    const updated = await TestDriveRequest.findOneAndUpdate(
      { _id: req.params.id, accepted: false, completed: false },
      { $set: { accepted: true, status: "accepted", acceptedAt: new Date().toISOString() } },
      { new: true, lean: true }
    );

    if (!updated) {
      return res.status(409).json({
        error: "Lead already accepted or completed by another salesperson.",
      });
    }

    broadcast("lead_updated", updated);
    return res.json(updated);
  } catch (err) {
    console.error("[/leads/:id/accept] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /leads/:id/complete ──────────────────────────────────────────────────
// Atomic complete — only accepted leads can be completed
app.post("/leads/:id/complete", async (req, res) => {
  try {
    const updated = await TestDriveRequest.findOneAndUpdate(
      { _id: req.params.id, accepted: true, completed: false },
      { $set: { completed: true, completedAt: new Date().toISOString(), status: "completed" } },
      { new: true, lean: true }
    );

    if (!updated) {
      return res.status(409).json({
        error: "Lead cannot be completed — it may not be accepted yet or is already done.",
      });
    }

    broadcast("lead_updated", updated);
    return res.json(updated);
  } catch (err) {
    console.error("[/leads/:id/complete] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚗  Tata Motors AI Sales Backend`);
  console.log(`    HTTP  → http://localhost:${PORT}`);
  console.log(`    WS    → ws://localhost:${PORT}`);
  console.log(`    POST  /chat-web        — main chat endpoint`);
  console.log(`    GET   /leads           — all leads from DB`);
  console.log(`    POST  /leads/:id/accept  — atomic accept`);
  console.log(`    POST  /leads/:id/complete — atomic complete`);
  console.log(`    GET   /health          — liveness probe\n`);
});

export default app;
