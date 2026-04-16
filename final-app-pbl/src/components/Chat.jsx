import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import CarCard from "./CarCard";
import { SpecTable, ComparisonTable, CalculationTable } from "./TableComponents";
import ReactMarkdown from 'react-markdown';

// ─── COMPONENT RENDERER ──────────────────────────────────────────────────────
const ComponentRenderer = ({ component }) => {
    if (!component?.required || !component?.name || !component?.content) return null;
    const c = component.content;

    switch (component.name) {
        case "car_card":
            let model_name = c.model
                ?.replace(/tata/gi, '')   // remove "tata" (any case)
                .trim()                   // remove extra spaces
                .toLowerCase();           // convert to lowercase

            return <CarCard model={model_name} />;

        case "spec_table":
            return (
                <SpecTable
                    model={c.columns?.[1]?.label || "Model"}
                    rows={(c.rows || []).map((r) => ({
                        label: r.feature,
                        value: r.value,
                        highlight: r.highlight,
                    }))}
                />
            );

        case "comparison_table": {
            const carCols = (c.columns || []).slice(1);
            return (
                <ComparisonTable
                    cars={carCols.map((col) => col.label)}
                    rows={(c.rows || []).map((row) => {
                        const vals = carCols.map((col) => row[col.key] || "—");
                        return { feature: row.feature, values: vals, winner: row.winner ?? null };
                    })}
                />
            );
        }

        case "show_calculation":
            return (
                <CalculationTable
                    title={c.title}
                    inputs={c.inputs || []}
                    steps={(c.steps || []).map((s) => ({
                        label: s.step,
                        formula: s.formula,
                        result: s.result,
                    }))}
                    total={c.result ? { label: c.result.label, value: c.result.value } : null}
                    summary={c.summary || []}
                />
            );

        default:
            return null;
    }
};

// ─── TYPING INDICATOR ────────────────────────────────────────────────────────
const TypingDots = () => (
    <div className="typing-dots">
        <span /><span /><span />
    </div>
);

// ─── FOLLOW UP PILL ──────────────────────────────────────────────────────────
const FollowUpPill = ({ text, onSend }) => (
    <button className="followup-text" onClick={() => onSend(text)}>
        {text}
    </button>
);

// ─── MESSAGE BUBBLE ──────────────────────────────────────────────────────────
const Message = ({ msg, onSend }) => {
    const isUser = msg.role === "user";

    if (isUser) {
        return (
            <div className="msg-row msg-row--user">
                <div className="msg-bubble msg-bubble--user">{msg.content}</div>
            </div>
        );
    }

    return (
        <div className="msg-row msg-row--bot">
            {/* bot avatar */}
            <div className="bot-avatar">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1L10 6H15L11 9.5L12.5 15L8 11.5L3.5 15L5 9.5L1 6H6L8 1Z" fill="currentColor" />
                </svg>
            </div>

            <div className="msg-bot-content">
                {/* text */}
                {msg.content && (
                    <p className="msg-text"><ReactMarkdown>{msg.content}</ReactMarkdown></p>
                )}

                {/* generative component */}
                {msg.component && (
                    <div className="msg-component">
                        <ComponentRenderer component={msg.component} />
                    </div>
                )}

                {/* follow up */}
                {msg.follow_up && (
                    <div className="msg-followups">
                        <FollowUpPill text={msg.follow_up} onSend={onSend} />
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
const EmptyState = ({ onSend }) => {
    const suggestions = [
        "Tell me about Tata Nexon",
        "Compare Harrier and Safari",
        "Calculate EMI for Nexon Diesel",
        "What is the mileage of Punch?",
    ];
    return (
        <div className="empty-state">
            <div className="empty-logo">
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                    <path d="M18 3L22 14H33L24 21L27 33L18 26L9 33L12 21L3 14H14L18 3Z" fill="currentColor" opacity="0.9" />
                </svg>
            </div>
            <h2 className="empty-title">Tata Motors Assistant</h2>
            <p className="empty-sub">Ask me anything about our cars, pricing, EMI, or features.</p>
            <div className="empty-suggestions">
                {suggestions.map((s, i) => (
                    <button key={i} className="suggestion-chip" onClick={() => onSend(s)}>
                        {s}
                    </button>
                ))}
            </div>
        </div>
    );
};

// ─── MAIN CHAT ────────────────────────────────────────────────────────────────
const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const { id: urlSessionId } = useParams();
    const navigate = useNavigate();

    // Track last bot follow_up to detect test drive intent
    const lastFollowUpRef = useRef(null);
    const testDriveKeywords = [
        "test drive", "test-drive", "testdrive",
        "schedule a drive", "book a drive", "try the car",
        "experience the car", "take it for a ride", "go for a drive",
    ];
    const yesKeywords = ["yes", "sure", "yeah", "yep", "absolutely",
        "of course", "definitely", "ok", "okay", "why not", "sounds good",
        "let's do it", "lets do it", "please", "go ahead", "alright",
        "interested", "book it"];

    const containsTestDriveIntent = (text) => {
        if (!text) return false;
        const lower = text.toLowerCase();
        return testDriveKeywords.some((kw) => lower.includes(kw));
    };

    const containsYes = (text) => {
        if (!text) return false;
        const lower = text.toLowerCase().trim();
        return yesKeywords.some((kw) => lower.includes(kw));
    };
    
    // Backend API URL - use env variable or default to localhost:3000
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
    console.log(`[Chat] Using API URL: ${API_URL}`);
    
    // Initialize sessionId from URL param, then localStorage, then create new one
    const [sessionId, setSessionId] = useState(() => {
        if (urlSessionId) {
            console.log(`[Chat] Loading session from URL: ${urlSessionId}`);
            localStorage.setItem("tata_session_id", urlSessionId);
            return urlSessionId;
        }
        const stored = localStorage.getItem("tata_session_id");
        return stored || uuidv4();
    });

    // Save sessionId to localStorage when it changes (or on first load)
    useEffect(() => {
        localStorage.setItem("tata_session_id", sessionId);
    }, [sessionId]);

    // Load chat history from backend on mount or when sessionId changes
    useEffect(() => {
        const loadChatHistory = async () => {
            try {
                const res = await fetch(`${API_URL}/session/${sessionId}/messages`);
                if (res.ok) {
                    const data = await res.json();
                    // Convert backend format to frontend format
                    const formattedMessages = data.messages.map((msg, idx) => ({
                        role: msg.role === "human" ? "user" : "assistant",
                        content: msg.content,
                        id: idx,
                        // Restore component and follow_up if present (they were saved with the message)
                        component: msg.component || null,
                        follow_up: msg.follow_up || null,
                    }));
                    setMessages(formattedMessages);
                    console.log(`[Chat] Loaded ${formattedMessages.length} messages from history`);
                }
            } catch (err) {
                console.warn("[Chat] Could not load chat history:", err.message);
                // Silently fail — don't break if backend is down
            }
        };

        loadChatHistory();
    }, [sessionId, API_URL]); // Reload when sessionId or API_URL changes

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const sendMessage = async (text) => {
        const userText = (text || input).trim();
        if (!userText || loading) return;
        setInput("");

        const userMsg = { role: "user", content: userText, id: Date.now() };
        setMessages((prev) => [...prev, userMsg]);
        setLoading(true);

        // ── Test-drive intent detection ──────────────────────────────────────
        // If the last bot follow_up suggested a test drive AND user said yes,
        // trigger the summarize + redirect flow.
        if (lastFollowUpRef.current && containsTestDriveIntent(lastFollowUpRef.current) && containsYes(userText)) {
            try {
                console.log("[Chat] Test-drive intent detected — calling /summarize-chat");
                const summaryRes = await fetch(`${API_URL}/summarize-chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: sessionId }),
                });
                if (summaryRes.ok) {
                    const { summary } = await summaryRes.json();
                    localStorage.setItem("summary_chat", summary);
                    console.log("[Chat] summary_chat saved to localStorage");
                } else {
                    console.warn("[Chat] /summarize-chat returned error:", summaryRes.status);
                }
            } catch (err) {
                console.warn("[Chat] Failed to summarize chat:", err.message);
            }

            // Set test_drive_request flag and navigate
            localStorage.setItem("test_drive_request", "true");
            setLoading(false);
            navigate("/test-drive");
            return;
        }
        // ─────────────────────────────────────────────────────────────────────

        try {
            const res = await fetch(`${API_URL}/chat-web`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userText,
                    session_id: sessionId,
                }),
            });

            const data = await res.json();
            console.log("Bot response:", data);

            // parse — your backend returns AgentOutput: { text, component, follow_up }
            const botMsg = {
                role: "bot",
                id: Date.now() + 1,
                content: data.text || data.response || "",
                component: data.component || null,
                needs_interruption: data.user_state?.needs_interruption || false,
                follow_up: data.follow_up || null,
            };

            setMessages((prev) => [...prev, botMsg]);

            // Store the latest follow_up for next-message detection
            lastFollowUpRef.current = botMsg.follow_up || null;

            // Update backend with new session_id if returned
            if (data.session_id && data.session_id !== sessionId) {
                setSessionId(data.session_id);
            }
        } catch (err) {
            console.error("[Chat] Send message error:", err);
            setMessages((prev) => [
                ...prev,
                {
                    role: "bot",
                    id: Date.now() + 1,
                    content: "Something went wrong. Please try again.",
                    component: null,
                    follow_up: null,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleClearHistory = async () => {
        if (confirm("Clear all chat history?")) {
            try {
                await fetch(`${API_URL}/session/clear`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ session_id: sessionId }),
                });
                setMessages([]);
                console.log("[Chat] History cleared");
            } catch (err) {
                console.error("[Chat] Clear history failed:", err);
            }
        }
    };

    const handleNewChat = () => {
        if (confirm("Start a new chat session?")) {
            const newSessionId = uuidv4();
            setSessionId(newSessionId);
            setMessages([]);
            console.log(`[Chat] New session: ${newSessionId}`);
        }
    };

    const handleKey = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:           #0b0c10;
          --surface:      #13141a;
          --surface2:     #1a1b23;
          --border:       rgba(255,255,255,0.07);
          --border2:      rgba(255,255,255,0.12);
          --accent:       #c8a96e;
          --accent-dim:   rgba(200,169,110,0.12);
          --text:         #edeae3;
          --text-muted:   rgba(237,234,227,0.45);
          --text-subtle:  rgba(237,234,227,0.25);
          --user-bubble:  #1e2030;
          --radius:       14px;
          --font:         'DM Sans', sans-serif;
          --font-display: 'Bebas Neue', sans-serif;
        }

        /* ── LAYOUT ──────────────────────────────────────────── */
        .chat-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
          max-width: 100%;
          margin: 0;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font);
          overflow: hidden;
        }

        /* ── TOPBAR ──────────────────────────────────────────── */
        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          height: 56px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          flex-shrink: 0;
          z-index: 10;
          width: min(760px, 100%);
          margin: 0 auto;
        }

        .topbar-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .topbar-icon {
          width: 28px; height: 28px;
          background: var(--accent);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #0b0c10;
          flex-shrink: 0;
        }

        .topbar-name {
          font-family: var(--font-display);
          font-size: 1.1rem;
          letter-spacing: 0.1em;
          color: var(--text);
        }

        .topbar-badge {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.08em;
          color: var(--accent);
          background: var(--accent-dim);
          padding: 2px 8px;
          border-radius: 20px;
          border: 1px solid rgba(200,169,110,0.2);
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .topbar-btn {
          padding: 6px 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-muted);
          font-family: var(--font);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .topbar-btn:hover {
          background: var(--accent-dim);
          border-color: var(--accent);
          color: var(--accent);
        }

        .topbar-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 6px #4ade80;
        }

        .topbar-status {
          font-size: 11px;
          color: var(--text-muted);
          letter-spacing: 0.04em;
        }

        /* ── MESSAGES AREA ───────────────────────────────────── */
        .messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 0 0 120px;
          scroll-behavior: smooth;
          width: 100%;
        }

        .messages-area::-webkit-scrollbar { width: 4px; }
        .messages-area::-webkit-scrollbar-track { background: transparent; }
        .messages-area::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }

        .messages-inner {
          width: 100%;
          max-width: 760px;
          margin: 0 auto;
          padding: 0 16px;
        }

        /* ── EMPTY STATE ─────────────────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 80px 24px 40px;
          text-align: center;
        }

        .empty-logo {
          width: 60px; height: 60px;
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          margin-bottom: 20px;
        }

        .empty-title {
          font-family: var(--font-display);
          font-size: 2rem;
          letter-spacing: 0.06em;
          color: var(--text);
          margin-bottom: 8px;
        }

        .empty-sub {
          font-size: 14px;
          color: var(--text-muted);
          max-width: 380px;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .empty-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          max-width: 520px;
        }

        .suggestion-chip {
          padding: 8px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          color: var(--text-muted);
          font-family: var(--font);
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }

        .suggestion-chip:hover {
          border-color: var(--border2);
          color: var(--text);
          background: var(--surface2);
        }

        /* ── MESSAGE ROWS ────────────────────────────────────── */
        .msg-row {
          display: flex;
          padding: 20px 0;
          border-bottom: 1px solid var(--border);
          animation: msgIn 0.22s ease;
        }

        .msg-row:last-child { border-bottom: none; }

        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* user */
        .msg-row--user { justify-content: flex-end; }

        .msg-bubble--user {
          max-width: 72%;
          background: var(--user-bubble);
          border: 1px solid var(--border2);
          border-radius: var(--radius);
          border-top-right-radius: 4px;
          padding: 12px 18px;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text);
        }

        /* bot */
        .msg-row--bot {
          gap: 14px;
          align-items: flex-start;
        }

        .bot-avatar {
          width: 28px; height: 28px;
          border-radius: 8px;
          background: var(--accent-dim);
          border: 1px solid rgba(200,169,110,0.2);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .msg-bot-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .msg-text {
          font-size: 18px;
          line-height: 1.75;
          color: var(--text);
        }

        .msg-component {
          width: 100%;
        }

        /* ── FOLLOW UP ───────────────────────────────────────── */
        .msg-followups {
          display: block;
          margin-top: 8px;
        }

        .followup-text {
          background: none;
          border: none;
          color: var(--text);
          font-family: var(--font);
          font-size: 14px;
          line-height: 1.75;
          cursor: pointer;
          padding: 0;
          text-align: left;
          text-decoration: underline;
          text-decoration-color: var(--accent);
          text-underline-offset: 2px;
          transition: color 0.2s;
        }

        .followup-text:hover {
          color: var(--accent);
        }

        /* ── TYPING ──────────────────────────────────────────── */
        .typing-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 20px 0;
          animation: msgIn 0.2s ease;
        }

        .typing-dots {
          display: flex;
          gap: 5px;
          align-items: center;
          padding: 4px 0;
        }

        .typing-dots span {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--text-subtle);
          animation: blink 1.4s ease-in-out infinite;
        }

        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0%, 80%, 100% { opacity: 0.3; transform: scale(1); }
          40%           { opacity: 1;   transform: scale(1.2); }
        }

        /* ── INPUT BAR ───────────────────────────────────────── */
        .input-bar {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: min(760px, calc(100% - 40px));
          padding: 16px 0 24px;
          background: linear-gradient(to top, var(--bg) 70%, transparent);
          z-index: 20;
        }

        .input-inner {
          width: 100%;
          display: flex;
          align-items: flex-end;
          gap: 10px;
          background: var(--surface);
          border: 1px solid var(--border2);
          border-radius: 16px;
          padding: 10px 10px 10px 18px;
          transition: border-color 0.2s;
        }

        .input-inner:focus-within {
          border-color: rgba(200,169,110,0.35);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text);
          font-family: var(--font);
          font-size: 14px;
          line-height: 1.5;
          resize: none;
          max-height: 120px;
          padding: 4px 0;
          caret-color: var(--accent);
        }

        .chat-input::placeholder { color: var(--text-subtle); }

        .send-btn {
          width: 36px; height: 36px;
          border-radius: 10px;
          border: none;
          background: var(--accent);
          color: #0b0c10;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.15s;
        }

        .send-btn:hover { opacity: 0.85; transform: scale(1.04); }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

        .input-hint {
          text-align: center;
          font-size: 11px;
          color: var(--text-subtle);
          margin-top: 8px;
          letter-spacing: 0.03em;
        }
      `}</style>

            <div className="chat-root">
                {/* topbar */}
                <header className="topbar">
                    <div className="topbar-brand">
                        <div className="topbar-icon">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M7 1L8.8 5.5H13.5L9.8 8.3L11.1 13L7 10.2L2.9 13L4.2 8.3L0.5 5.5H5.2L7 1Z" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="topbar-name">TATA MOTORS</span>
                        <span className="topbar-badge">AI Assistant</span>
                    </div>
                    <div className="topbar-right">
                        <button 
                            className="topbar-btn" 
                            onClick={handleClearHistory}
                            title="Clear chat history"
                        >
                            🗑️ Clear
                        </button>
                        <button 
                            className="topbar-btn" 
                            onClick={handleNewChat}
                            title="Start new chat"
                        >
                            ➕ New
                        </button>
                        <div className="topbar-dot" />
                        <span className="topbar-status">Online</span>
                    </div>
                </header>

                {/* messages */}
                <main className="messages-area">
                    <div className="messages-inner">
                        {messages.length === 0 ? (
                            <EmptyState onSend={sendMessage} />
                        ) : (
                            <>
                                {messages.map((msg) => (
                                    <Message key={msg.id} msg={msg} onSend={sendMessage} />
                                ))}
                                {loading && (
                                    <div className="typing-row">
                                        <div className="bot-avatar">
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 1L10 6H15L11 9.5L12.5 15L8 11.5L3.5 15L5 9.5L1 6H6L8 1Z" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <TypingDots />
                                    </div>
                                )}
                            </>
                        )}
                        <div ref={bottomRef} />
                    </div>
                </main>

                {/* input bar */}
                <div className="input-bar">
                    <div className="input-inner">
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            rows={1}
                            placeholder="Ask about cars, pricing, EMI, features…"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                e.target.style.height = "auto";
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                            }}
                            onKeyDown={handleKey}
                        />
                        <button
                            className="send-btn"
                            onClick={() => sendMessage()}
                            disabled={!input.trim() || loading}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                    <p className="input-hint">Enter to send · Shift+Enter for new line</p>
                </div>
            </div>
        </>
    );
};

export default Chat;