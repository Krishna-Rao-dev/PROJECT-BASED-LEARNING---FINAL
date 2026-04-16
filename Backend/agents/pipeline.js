// agents/pipeline.js
// Mirrors the LangGraph StateGraph:
//   START → intent_node → retriever_component_node → END
//
// Orchestrates both agents and manages state updates via sessionStore.

import { classifyUserIntent } from "./intentAgent.js";
import { retrieverAndComponent } from "./retrieverAgent.js";
import {
  getSession,
  updateSession,
  appendMessage,
} from "../utils/persistentSessionStore.js";

/**
 * Run the full agentic pipeline for a single user turn.
 *
 * @param {string} sessionId  - Unique session / thread identifier
 * @param {string} userMessage - Raw user input
 * @returns {Promise<{
 *   text: string,
 *   component: object|null,
 *   follow_up: string|null,
 *   userState: object,
 *   needs_interruption: boolean
 * }>}
 */
export async function runPipeline(sessionId, userMessage) {
  console.log(`\n================================================`);
  console.log(`[pipeline] START: sessionId=${sessionId}`);
  console.log(`[pipeline] User message: "${userMessage.substring(0, 100)}..."`);
  
  // ── Load session (mirrors graph.get_state / MemorySaver) ──────────────────
  const session = await getSession(sessionId);
  console.log(`[pipeline] Loaded session with ${session.messages?.length || 0} messages`);

  // Append the new human message to history
  console.log(`[pipeline] Appending human message...`);
  await appendMessage(sessionId, "human", userMessage);
  const checkSession1 = await getSession(sessionId);
  console.log(`[pipeline] After append: session now has ${checkSession1.messages?.length} messages`);
  
  // Re-fetch with updated messages
  const updatedSession = await getSession(sessionId);

  // ── Node 1: intent_node ───────────────────────────────────────────────────
  console.log(`[pipeline] [${sessionId}] Running intentAgent…`);
  const newUserState = await classifyUserIntent(
    userMessage,
    updatedSession.userState
  );
  await updateSession(sessionId, { userState: newUserState });

  // ── Node 2: retriever_component_node ──────────────────────────────────────
  console.log(`[pipeline] [${sessionId}] Running retrieverAgent (query_type=${newUserState.query_type})…`);
  const agentOutput = await retrieverAndComponent(
    userMessage,
    newUserState,
    (await getSession(sessionId)).messages
  );

  // Append assistant response to history (mirrors AIMessage append)
  console.log(`[pipeline] [${sessionId}] Appending assistant message...`);
  await appendMessage(sessionId, "assistant", agentOutput.text, {
    component: agentOutput.component,
    follow_up: agentOutput.follow_up,
  });
  const checkSession2 = await getSession(sessionId);
  console.log(`[pipeline] [${sessionId}] After append assistant: ${checkSession2.messages?.length} messages`);

  // Persist agent output
  console.log(`[pipeline] [${sessionId}] Updating session with agent output...`);
  await updateSession(sessionId, { lastAgentOutput: agentOutput });

  console.log(`[pipeline] END: Returning result\n================================================\n`);

  // ── Return structured response ────────────────────────────────────────────
  return {
    text: agentOutput.text,
    component: agentOutput.component,
    follow_up: agentOutput.follow_up,
    userState: newUserState,
    needs_interruption: newUserState.needs_interruption,
  };
}
