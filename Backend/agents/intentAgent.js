// agents/intentAgent.js
// Mirrors: classify_user_intent(state: GraphState) in the notebook.
//
// Responsibilities:
//   • Receives the latest user message + current UserState
//   • Calls intent_llm to classify query and update user profile
//   • Returns an updated UserState object

import { chatComplete } from "../config/llm.js";

/**
 * Build the intent classification prompt.
 * Mirrors the intent_prompt ChatPromptTemplate from the notebook.
 */
function buildIntentPrompt(message, userState) {
  return `You are analyzing a user message in a Tata Motors car sales conversation.
The user may speak in English, Hindi, or Hinglish (mix of both).

User Message: ${message}
Current Profile: ${JSON.stringify(userState)}

Your job is to update the user profile based ONLY on what is explicitly stated in the message.

Output ONLY a raw JSON object — no markdown, no \`\`\`json, no explanation.
First character must be { and last must be }

{
  "budget": <integer in rupees or null>,
  "family_size": <integer or null>,
  "fuel_preference": <"petrol" | "diesel" | "cng" | "electric" | null>,
  "usage_pattern": <"city" | "highway" | "mixed" | null>,
  "location": <city name as string or null>,
  "needs_interruption": <true if user wants Test Drive or Booking, else false>,
  "is_hinglish_speaker": <true if message contains Hindi or Hinglish, else false>,
  "query_type": <"general" | "comparison_table" | "car_card" | "spec_table" | "show_calculation">
}

Rules:
- Do NOT assume anything not explicitly stated. If unsure, keep existing value or null.
- needs_interruption → true only if user explicitly says "test drive", "booking", "book karo", "test drive chahiye", "i want to speak to a human", "connect me to sales","contact me to sales person", "i wanna speak to manager", "i want to talk to a salesperson", "i want to speak to manager" etc - OR RELATED CONTEXT - PLEASE UNDERSTAND THAT. DO NOT set to true for vague interest like "I want to buy", "I am interested", etc.
- is_hinglish_speaker → true if message has ANY Hindi or Hinglish words
- query_type rules:
  * "comparison_table" → comparing 2+ cars: "Nexon vs Safari", "Harrier aur Safari mein fark", "which is better Punch or Altroz"
  * "car_card"         → asking about one specific car: "Nexon dikhao", "tell me about Harrier", "Safari kaisi hai"
  * "spec_table"       → specific specs of one car: "Nexon ka mileage", "Safari boot space", "Harrier engine"
  * "show_calculation" → any calculation: "EMI nikalo", "on-road price", "trade in value", "kitna EMI hoga"
  * "general"          → everything else: greetings, vague questions, recommendations, "kaunsi car leni chahiye"`;
}

/**
 * Classify user intent and update the user profile.
 *
 * @param {string} message        - Latest user message
 * @param {object} currentState   - Current UserState object
 * @returns {Promise<object>}     - Updated UserState
 */
export async function classifyUserIntent(message, currentState) {
  const systemPrompt = buildIntentPrompt(message, currentState);

  const rawJson = await chatComplete([
    { role: "user", content: systemPrompt },
  ]);

  // Strip any accidental markdown fences
  const clean = rawJson.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  let updated;
  try {
    updated = JSON.parse(clean);
  } catch {
    // If parsing fails, fall back to keeping the old state but still mark is_hinglish
    console.warn("[intentAgent] JSON parse failed, keeping previous state. Raw:", rawJson);
    updated = { ...currentState };
  }

  // Merge: prefer new non-null values, keep existing non-null values
  return mergeUserState(currentState, updated);
}

/**
 * Merge strategy: new values override only if they are non-null / non-undefined.
 * Booleans always take the new value (false is a valid update).
 */
function mergeUserState(existing, incoming) {
  const merged = { ...existing };
  for (const key of Object.keys(incoming)) {
    const val = incoming[key];
    if (typeof val === "boolean") {
      merged[key] = val; // always update booleans
    } else if (val !== null && val !== undefined) {
      merged[key] = val;
    }
  }
  return merged;
}
