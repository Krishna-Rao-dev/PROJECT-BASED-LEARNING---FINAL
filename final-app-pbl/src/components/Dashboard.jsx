import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const WS_URL = API_URL.replace(/^http/, "ws");

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(iso) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m ago`;
  if (m > 0) return `${m}m ${s}s ago`;
  return `${s}s ago`;
}

// Queue time: counts only while lead is PENDING (not yet accepted)
function queueTime(lead) {
  const createdAt = lead.createdAt || lead.submittedAt;
  if (!createdAt) return "—";
  // Once accepted, show time from submission to acceptance (frozen)
  if (lead.accepted && lead.acceptedAt) {
    const diff = new Date(lead.acceptedAt).getTime() - new Date(createdAt).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (h > 0) return `${h}h ${m}m ✓`;
    if (m > 0) return `${m}m ${s}s ✓`;
    return `${s}s ✓`;
  }
  if (lead.accepted) return "Taken";
  // Still pending — live counting
  const diff = Date.now() - new Date(createdAt).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [, setTick] = useState(0);
  const wsRef = useRef(null);
  const navigate = useNavigate();

  // Current user from localStorage
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("ae_user")); }
    catch { return null; }
  })();

  const handleSignOut = () => {
    localStorage.removeItem("ae_user");
    navigate("/login");
  };

  // ── Fetch all leads from DB on mount ──────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/leads`)
      .then((r) => r.json())
      .then((data) => {
        setLeads(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Dashboard] Failed to fetch leads:", err);
        setLoading(false);
      });
  }, []);

  // ── WebSocket — real-time updates ─────────────────────────────────────
  useEffect(() => {
    let ws;
    let reconnectTimer;

    function connect() {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => { console.log("[Dashboard WS] Connected"); setWsConnected(true); };

      ws.onmessage = (evt) => {
        try {
          const { event, payload } = JSON.parse(evt.data);
          if (event === "new_lead") {
            setLeads((prev) => [payload, ...prev]);
          }
          if (event === "lead_updated") {
            setLeads((prev) =>
              prev.map((l) =>
                String(l._id) === String(payload._id) ? payload : l
              )
            );
          }
        } catch (err) {
          console.warn("[Dashboard WS] Parse error:", err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
    }

    connect();
    return () => { clearTimeout(reconnectTimer); if (ws) ws.close(); };
  }, []);

  // ── Live tick — only matters for pending leads ────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────
  const acceptLead = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/leads/${id}/accept`, { method: "POST" });
      if (res.status === 409) { const { error } = await res.json(); alert(error); return; }
      if (!res.ok) throw new Error("Server error");
    } catch (err) {
      console.error("[Dashboard] Accept failed:", err);
      alert("Failed to accept lead. Please try again.");
    }
  }, []);

  const completeLead = useCallback(async (id) => {
    try {
      const res = await fetch(`${API_URL}/leads/${id}/complete`, { method: "POST" });
      if (res.status === 409) { const { error } = await res.json(); alert(error); return; }
      if (!res.ok) throw new Error("Server error");
    } catch (err) {
      console.error("[Dashboard] Complete failed:", err);
      alert("Failed to complete lead. Please try again.");
    }
  }, []);

  const active = leads.filter((l) => !l.completed);
  const completed = leads.filter((l) => l.completed);

  if (loading) {
    return (
      <div className="db-root">
        <div className="db-loading">Loading leads from database…</div>
      </div>
    );
  }

  return (
    <div className="db-root">
      {/* ── Header ── */}
      <div className="db-header">
        <div>
          <h1 className="db-title">Dashboard</h1>
          <p className="db-subtitle">
            All incoming test-drive requests
            {user && <span className="db-user-chip"> · {user.name} ({user.id})</span>}
          </p>
        </div>
        <div className="db-header-right">
          <div className={`db-ws-pill ${wsConnected ? "db-ws-pill--on" : "db-ws-pill--off"}`}>
            <span className="db-ws-dot" />
            {wsConnected ? "Live" : "Reconnecting…"}
          </div>
          <div className="db-stat-pill">
            <span className="db-stat-dot" />
            {active.length} Active Lead{active.length !== 1 ? "s" : ""}
          </div>
          <button className="db-signout-btn" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      {/* ── Active Leads ── */}
      {active.length === 0 ? (
        <div className="db-empty">No active leads. New test-drive submissions will appear here instantly.</div>
      ) : (
        <div className="db-grid">
          {active.map((lead) => (
            <LeadCard
              key={lead._id || lead.id}
              lead={lead}
              onAccept={acceptLead}
              onComplete={completeLead}
            />
          ))}
        </div>
      )}

      {/* ── Completed Leads ── */}
      {completed.length > 0 && (
        <>
          <div className="db-section-label">
            <span>✓ Processed ({completed.length})</span>
          </div>
          <div className="db-grid db-grid--completed">
            {completed.map((lead) => (
              <LeadCard
                key={lead._id || lead.id}
                lead={lead}
                onAccept={acceptLead}
                onComplete={completeLead}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Lead Card ──────────────────────────────────────────────────────────────
function LeadCard({ lead, onAccept, onComplete }) {
  const isAccepted = lead.accepted;
  const isCompleted = lead.completed;
  const [insightOpen, setInsightOpen] = useState(false);
  const leadId = lead._id || lead.id;
  const summaryLines = lead.summary_chat
    ? lead.summary_chat.split("\n").filter(Boolean)
    : [];
  const createdAt = lead.createdAt || lead.submittedAt;

  return (
    <div className={`db-card ${isAccepted ? "db-card-accepted" : ""} ${isCompleted ? "db-card-done" : ""}`}>
      <div className="db-card-header">
        <div className="db-card-avatar">
          {(lead.name || "??").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="db-card-title-group">
          <div className="db-card-name">{lead.name}</div>
          <div className="db-card-time">{timeAgo(createdAt)}</div>
        </div>
        <div className={`db-badge ${isCompleted ? "db-badge-done" : isAccepted ? "db-badge-accepted" : "db-badge-new"}`}>
          {isCompleted ? "Done" : isAccepted ? "Accepted" : "New"}
        </div>
      </div>

      <div className="db-card-body">
        <div className="db-info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" /></svg>
          {lead.email || "—"}
        </div>
        <div className="db-info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeLinecap="round" /></svg>
          {lead.phone}
        </div>
        <div className="db-info-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="13" height="13"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {lead.showroom || "—"}
        </div>

        <div className="db-divider" />

        <div className="db-meta-grid">
          <div className="db-meta-item">
            <span className="db-meta-label">Vehicle</span>
            <span className="db-meta-val">{lead.car || "—"}</span>
          </div>
          <div className="db-meta-item">
            <span className="db-meta-label">Date / Time</span>
            <span className="db-meta-val">{lead.date || "—"} · {lead.time || "—"}</span>
          </div>
          <div className="db-meta-item db-meta-full">
            <span className="db-meta-label">
              {isCompleted ? "Processed After" : isAccepted ? "Wait Time (Frozen)" : "In Queue"}
            </span>
            <span className="db-meta-val db-slot">
              {isCompleted ? "—" : queueTime(lead)}
            </span>
          </div>
        </div>

        {/* ── Chat Insights ── */}
        {summaryLines.length > 0 && (
          <div className="db-insight-wrap">
            <button className="db-insight-toggle" onClick={() => setInsightOpen((o) => !o)}>
              <span className="db-insight-toggle-left">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Chat Insights
              </span>
              <span className={`db-insight-chevron ${insightOpen ? "db-insight-chevron--open" : ""}`}>▾</span>
            </button>
            {insightOpen && (
              <ul className="db-insight-list">
                {summaryLines.map((line, i) => (
                  <li key={i} className="db-insight-line">
                    <span className="db-insight-dot" />
                    {line}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isCompleted && lead.completedAt && (
          <div className="db-completed-bar">
            ✓ Completed · {new Date(lead.completedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>

      {!isCompleted && (
        <div className="db-card-actions">
          {!isAccepted ? (
            <button className="db-btn-accept" onClick={() => onAccept(leadId)}>Accept Lead</button>
          ) : (
            <button className="db-btn-done" onClick={() => onComplete(leadId)}>✓ Mark Done</button>
          )}
        </div>
      )}
    </div>
  );
}