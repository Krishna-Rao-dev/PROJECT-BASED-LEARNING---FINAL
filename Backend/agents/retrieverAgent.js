// agents/retrieverAgent.js
// Mirrors: retriver_and_component(state: GraphState) in the notebook.
//
// Responsibilities:
//   • Retrieves relevant knowledge-base chunks via vector search
//   • Builds the full sales-assistant prompt
//   • Calls component_llm and parses the structured AgentOutput JSON
//   • Returns { text, component, follow_up }

import { chatComplete } from "../config/llm.js";
import { retrieve } from "../config/vectorStore.js";
import {
  getComponentFormat,
  EXAMPLES,
  CALCULATION_EXAMPLES,
} from "../utils/prompts.js";

/**
 * Format chat history for prompt injection (last 6 messages, excluding current).
 * Mirrors: history = state['messages'][-6:] ... chat_history = "\n".join(...)
 *
 * @param {Array<{role:string, content:string}>} messages
 * @returns {string}
 */
function formatChatHistory(messages) {
  if (!Array.isArray(messages)) return "";

  let recent = [];

  if (messages.length > 1) {
    recent = messages.slice(-7, -1); // last 6 turns excluding current
  } else {
    recent = messages;
  }

  return recent
    .map((m) => {
      if (m.role === "human") {
        return `User Said: ${m.content}`;
      } else {
        let text = `Assistant: ${m.content}`;
        if (m.follow_up) {
          text += `\nAssistant Asked Follow Up: ${m.follow_up}`;
        }
        return text;
      }
    })
    .join("\n");
}
/**
 * Build the main RAG + sales prompt.
 * Mirrors the large ChatPromptTemplate inside retriver_and_component.
 * When usingFallback=true, instructs the LLM to rely on its own knowledge
 * instead of injecting empty/missing context.
 */
function buildComponentPrompt({
  message,
  userState,
  context,
  componentFormat,
  chatHistory,
  usingFallback = false,
  formatHint
}) {
  const contextBlock = usingFallback
    ? `No specific documents were found in the knowledge base for this query. Use your own general knowledge about TATA Motors, its vehicles, features, pricing, and the Indian automotive market to answer accurately.`
    : `Context from knowledge base that you can use to answer the query: ${context}`;

  return `User Query: ${message}
The user has the following profile: ${JSON.stringify(userState)}
See if is_hinglish_speaker is set True, then respond in Hinglish but maintain professionalism and clarity.
${contextBlock}
Please also refer the past history to answer the query.
You are an AI sales assistant working for TATA Motors


Here are your CORE responsibilities as far tone is concerned must revolve around:

1. Selling cars,
2. Negotiating - *NOT* *Related* to prices - You must negotiate like a real car dealer - YOU MUST SOMEHOW CONVINCE PERSON TO BUY THE CAR,
3. Upselling opportunities,
4. Help user showing:
   a. EMI options & offers by elaborating the calculations step-by-step
   b. RTO Calculations - by elaborating the calculations step-by-step
   c. Trade-in value calculations - by elaborating the calculations step-by-step


${formatHint}

However, you have to Output only a JSON object, for various types of query:
Component format to follow: ${componentFormat}
Here are some examples to learn from: ${EXAMPLES}
For Calculation related queries, here are some more detailed examples to learn from: ${CALCULATION_EXAMPLES}
Chat History: ${chatHistory}
Always ask user about a test drive seems more than just interested.
DONT SEEM PUSHY, MAKE USER FEEL IT NATURAL AND NOT FORCED.
RETURN ONLY A VALID JSON OBJECT ONLY, FOLLOW THE ABOVE FORMAT VERY STRICTLY, "NO" MARKDOWNS`;
}

/**
 * Run the retriever + component generation pipeline.
 *
 * @param {string}                          message    - Latest user message
 * @param {object}                          userState  - Classified UserState
 * @param {Array<{role:string,content:string}>} messages - Full conversation history
 * @returns {Promise<{text:string, component:object|null, follow_up:string|null}>}
 */
export async function retrieverAndComponent(message, userState, messages) {
  // 1. Retrieve relevant knowledge base chunks
  let docs = [];
  try {
    docs = await retrieve(message, 4);
  } catch (err) {
    console.warn("[retrieverAgent] Vector retrieval failed, proceeding without context:", err.message);
  }

  // Filter out empty/whitespace-only chunks to detect true fallback
  const validDocs = docs.filter((d) => d && d.trim().length > 0);
  const usingFallback = validDocs.length === 0;
  const context = validDocs.join("\n\n");

  if (usingFallback) {
    console.log("[retrieverAgent] No docs retrieved — falling back to LLM general knowledge.");
  } else {
    console.log(`[retrieverAgent] Retrieved ${validDocs.length} doc chunk(s) from knowledge base.`);
  }

  // 2. Build prompt parts
  const componentFormat = getComponentFormat(userState.query_type);
  const chatHistory = formatChatHistory(messages);
  const formatHint = usingFallback
    ? `Since this answer comes from general knowledge, format the "text" field clearly using markdown: bullet points for features/specs, use break line tags wherever required,\\n\\n between sections, **bold** for car model names and prices.`
    : `Keep the "text" field concise and conversational.`;

  const promptContent = buildComponentPrompt({
    message,
    userState,
    context,
    componentFormat,
    chatHistory,
    usingFallback,
    formatHint
  });

  // 3. Call LLM
  const rawJson = await chatComplete([
    { role: "user", content: promptContent },
  ]);

  // 4. Parse AgentOutput
  const clean = rawJson
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  console.log(`[retrieverAgent] Raw LLM response length: ${rawJson.length}`);
  console.log(`[retrieverAgent] Clean JSON response: ${clean.substring(0, 200)}...`);

  let agentOutput;
  try {
    agentOutput = JSON.parse(clean);
    console.log(`[retrieverAgent] Parsed agentOutput keys: ${Object.keys(agentOutput).join(', ')}`);
    console.log(`[retrieverAgent] Has text: ${!!agentOutput.text}`);
    console.log(`[retrieverAgent] Has component: ${!!agentOutput.component}`);
    console.log(`[retrieverAgent] Has follow_up: ${!!agentOutput.follow_up}`);
  } catch (err) {
    console.error("[retrieverAgent] Failed to parse AgentOutput JSON. Error:", err.message);
    console.error("[retrieverAgent] Raw response was:", rawJson.substring(0, 500));
    // Graceful fallback
    agentOutput = {
      text: "I encountered an issue processing your request. Could you rephrase?",
      component: { required: false, name: null, content: null },
      follow_up: "What else would you like to know about Tata Motors?",
    };
  }

  // Normalise — ensure all three keys are always present
  return {
    text: agentOutput.text ?? "",
    component: agentOutput.component ?? null,
    follow_up: agentOutput.follow_up ?? null,
  };
}