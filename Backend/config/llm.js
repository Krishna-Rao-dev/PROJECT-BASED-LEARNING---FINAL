// config/llm.js
// Initialises two Groq chat clients mirroring the notebook's intent_llm & component_llm

import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = "openai/gpt-oss-120b"; // same model used in notebook

/**
 * Thin wrapper around groq chat completions.
 * @param {Array<{role:string, content:string}>} messages
 * @param {object} [opts]  extra options (temperature, max_tokens …)
 * @returns {Promise<string>} the assistant text content
 */
export async function chatComplete(messages, opts = {}) {
  const response = await groqClient.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    temperature: 0.3,
    ...opts,
    messages,
  });
  return response.choices[0].message.content;
}

export default groqClient;
