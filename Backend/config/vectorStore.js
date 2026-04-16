// config/vectorStore.js
// Connects to a local Chroma instance and exposes a retriever
// Mirrors: Chroma(persist_directory=..., embedding_function=OllamaEmbeddings)

import { ChromaClient } from "chromadb";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = "tata_motors_knowledge_base";
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || "llama3.2:3b";

let _collection = null;

// ── Ollama embeddings ─────────────────────────────────────────────────────────
async function getEmbedding(text) {
  const res = await fetch(`${OLLAMA_BASE}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text }),
  });
  if (!res.ok) throw new Error(`Ollama embed error: ${res.statusText}`);
  const data = await res.json();
  return data.embedding; // float[]
}

// ── Chroma collection ─────────────────────────────────────────────────────────
async function getCollection() {
  if (_collection) return _collection;
  const client = new ChromaClient({ path: CHROMA_URL });
  // getOrCreate so repeated server restarts are safe
  _collection = await client.getOrCreateCollection({ name: COLLECTION_NAME });
  return _collection;
}

// ── Public: retriever ─────────────────────────────────────────────────────────
/**
 * Retrieves the top-k most relevant document chunks for a query.
 * @param {string} query
 * @param {number} [k=4]
 * @returns {Promise<string[]>} array of page-content strings
 */
export async function retrieve(query, k = 4) {
  const embedding = await getEmbedding(query);
  const collection = await getCollection();
  const results = await collection.query({
    queryEmbeddings: [embedding],
    nResults: k,
  });
  // results.documents is Array<Array<string|null>>
  return (results.documents[0] ?? []).filter(Boolean);
}

export { getEmbedding, getCollection };
