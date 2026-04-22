# Tata Motors AI Sales Assistant 🚗

A next-generation, agentic AI-powered sales assistant designed to revolutionize the car buying experience. Built with a multi-agent pipeline and generative UI, this assistant provides personalized responses, real-time comparisons, and seamless lead generation for Tata Motors.

---

## 🌟 Key Features

### 🧠 Agentic AI Pipeline
The system utilizes a sophisticated multi-agent architecture to process user queries:
- **Intent Agent**: Detects user goals (e.g., info retrieval, comparison, financial calculation, or test drive booking).
- **Retriever Agent**: Fetches precise technical specifications and pricing from a dedicated knowledge base.
- **Pipeline Orchestrator**: Synchronizes agents to deliver a coherent, context-aware response.

### 🎨 Generative UI
Unlike static chatbots, this assistant generates dynamic UI components in real-time. Based on the conversation context, the backend returns structured JSON that renders into:
- **3D Car Cards**: Interactive cards with Sketchfab 3D model integration.
- **Technical Spec Tables**: Clean, categorized specification highlights.
- **Comparison Tables**: Side-by-side vehicle comparisons with "Winner" highlights.
- **EMI Calculators**: Transparent financial breakdowns with formula transparency.

### 👤 Personalized Responses
The system tracks user preferences throughout the session. Using the `/summarize-chat` endpoint, it generates a user-centric 5-line summary that captures:
- Specific car models of interest.
- Priority factors (e.g., safety, seating capacity, fuel efficiency).
- Financial preferences (e.g., tenure-focused vs. EMI-focused).

### ⚡ Executive Interruption
When the agent detects high-intent actions—such as a request for a test drive—it triggers an **Executive Interruption**. This signals the frontend to transition from a conversational state to a transactional state (e.g., redirecting to a booking form), ensuring a frictionless user journey from inquiry to lead.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, React Markdown, CSS Modules, Lucide Icons |
| **Backend** | Node.js, Express, WebSocket (ws) |
| **AI / LLM** | OpenAI API / LangChain Patterns, Custom Multi-Agent Pipeline |
| **Database** | MongoDB (Mongoose) |
| **Real-time** | WebSocket for instant Lead Broadcasting to Sales Dashboards |

---

## 📡 API Reference

The backend exposes a robust REST API to power the AI assistant and sales dashboard.

### 🤖 AI & Chat Endpoints
- **`POST /chat-web`**: The core endpoint for the **Agentic AI**. It processes user messages through the multi-agent pipeline and returns natural language responses along with **Generative UI** payloads.
- **`POST /summarize-chat`**: Analyzes session history to generate a 5-line user-centric summary. Powers the **Personalized Responses** feature.
- **`GET /session/:id/messages`**: Retrieves historical messages for a session, enabling persistent chat experiences.
- **`POST /session/clear`**: Wipes the message history for a specific session while maintaining user state.

### 🏎️ Lead & Booking Endpoints (Executive Interruption)
- **`POST /send-form`**: Persists test drive bookings and chat summaries to MongoDB. Triggers the transition from chat to lead.
- **`GET /leads`**: Fetches all generated leads for the sales dashboard, sorted by recency.
- **`POST /leads/:id/accept`**: Atomic endpoint for salespersons to claim a lead, preventing race conditions.
- **`POST /leads/:id/complete`**: Marks a test drive or inquiry as successfully handled.

### ⚙️ System Endpoints
- **`GET /health`**: Returns system uptime and the count of active AI sessions.
- **`GET /sessions`**: Lists all active sessions with metadata for administrative overview.

---

## 📋 JSON Component Structures

The Generative UI relies on a strict JSON schema returned by the `/chat-web` endpoint.

### 📇 Car Card
Renders an interactive card with a 3D model viewer.
```json
{
  "name": "car_card",
  "content": {
    "model": "Nexon"
  }
}
```

### 📊 Specification Table
Displays technical details with optional highlights.
```json
{
  "name": "spec_table",
  "content": {
    "columns": [{"label": "Feature"}, {"label": "Tata Nexon"}],
    "rows": [
      { "feature": "Engine", "value": "1.2L Turbocharged" },
      { "feature": "Safety", "value": "5-Star GNCAP", "highlight": "green" }
    ]
  }
}
```

### ⚖️ Comparison Table
Compares multiple vehicles side-by-side.
```json
{
  "name": "comparison_table",
  "content": {
    "columns": [
      {"label": "Feature", "key": "feature"},
      {"label": "Harrier", "key": "car1"},
      {"label": "Safari", "key": "car2"}
    ],
    "rows": [
      { "feature": "Seating", "car1": "5", "car2": "7", "winner": 1 },
      { "feature": "Engine", "car1": "2.0L", "car2": "2.0L", "winner": null }
    ]
  }
}
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- OpenAI API Key

### Backend Setup
1. Navigate to the `Backend` directory.
2. Install dependencies: `npm install`
3. Create a `.env` file:
   ```env
   GROQ_API_KEY = YOUR_API_KEY
   ```
4. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the `final-app-pbl` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
### Backend Setup :
1. Navigate to the `Backend` directory.
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

---

## 📈 Impact
- **Enhanced Conversion**: Personalized summaries allow sales teams to understand lead intent before the first call.
- **Improved UX**: Generative UI provides "at-a-glance" clarity for complex technical and financial data.
- **Operational Efficiency**: Real-time Lead Dashboards (via WebSockets) ensure zero delay between user intent and sales response.

---

## 🏁 Conclusion
The Tata Motors AI Sales Assistant is more than a chatbot; it's a digital showroom experience. By combining **Agentic AI** for reasoning and **Generative UI** for presentation, it sets a new standard for how automotive brands engage with modern, tech-savvy customers.
