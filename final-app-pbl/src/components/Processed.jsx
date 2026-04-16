import { useState, useEffect } from "react";
import "./Processed.css";

function getLeads() {
  return JSON.parse(localStorage.getItem("ae_leads") || "[]");
}

function saveLeads(leads) {
  localStorage.setItem("ae_leads", JSON.stringify(leads));
}

export default function Processed() {
  const [leads, setLeads] = useState(getLeads);

  useEffect(() => {
    const sync = () => setLeads(getLeads());
    window.addEventListener("ae_leads_update", sync);
    return () => window.removeEventListener("ae_leads_update", sync);
  }, []);

  const accepted = leads.filter((l) => l.accepted);

  const markComplete = (id) => {
    const updated = leads.map((l) =>
      l.id === id ? { ...l, completed: true, completedAt: new Date().toISOString() } : l
    );
    setLeads(updated);
    saveLeads(updated);
    window.dispatchEvent(new Event("ae_leads_update"));
  };

  return (
    <div className="pp-root">
      <div className="pp-header">
        <div>
          <h1 className="pp-title">Processed</h1>
          <p className="pp-subtitle">Leads that have been accepted by the team</p>
        </div>
        <div className="pp-count-pill">{accepted.length} Lead{accepted.length !== 1 ? "s" : ""}</div>
      </div>

      {accepted.length === 0 ? (
        <div className="pp-empty">
          <div className="pp-empty-icon">⊙</div>
          <p>No accepted leads yet. Accept leads from the Dashboard to see them here.</p>
        </div>
      ) : (
        <div className="pp-list">
          {accepted.map((lead) => (
            <ProcessedCard key={lead.id} lead={lead} onComplete={markComplete} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProcessedCard({ lead, onComplete }) {
  const isCompleted = lead.completed;

  return (
    <div className={`pp-card ${isCompleted ? "pp-card-complete" : ""}`}>
      <div className="pp-person-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width="20" height="20">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>

      <div className="pp-info">
        <div className="pp-name">{lead.name}</div>
        <div className="pp-phone">{lead.phone}</div>
      </div>

      <div className="pp-mid">
        <div className="pp-detail-row">
          <span className="pp-label">Showroom</span>
          <span className="pp-val">{lead.showroom}</span>
        </div>
        <div className="pp-detail-row">
          <span className="pp-label">Slot</span>
          <span className="pp-val pp-slot-val">{lead.slot}</span>
        </div>
      </div>

      <div className="pp-status-col">
        <div className={`pp-status ${isCompleted ? "pp-status-done" : "pp-status-pending"}`}>
          {isCompleted ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="12" height="12">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Complete
            </>
          ) : (
            <>
              <span className="pp-dot" />
              Not Done
            </>
          )}
        </div>
        {isCompleted && lead.completedAt && (
          <div className="pp-timestamp">
            {new Date(lead.completedAt).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>

      <div className="pp-action">
        {!isCompleted ? (
          <button className="pp-btn-complete" onClick={() => onComplete(lead.id)}>
            Complete
          </button>
        ) : (
          <div className="pp-done-check">✓</div>
        )}
      </div>
    </div>
  );
}
