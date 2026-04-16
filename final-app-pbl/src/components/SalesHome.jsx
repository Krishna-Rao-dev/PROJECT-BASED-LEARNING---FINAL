import { useState } from "react";
import Dashboard from "./Dashboard";
import Processed from "./Processed";
import "./SalesHome.css";

export default function SalesHome({ onLogout }) {
  const [page, setPage] = useState("dashboard");

  return (
    <div className="sh-root">
      {/* Sidebar */}
      <aside className="sh-sidebar">
        <div className="sh-sidebar-top">
          <div className="sh-logo">
            <span className="sh-logo-icon">◈</span>
            <div>
              <div className="sh-logo-name">AutoElite</div>
              <div className="sh-logo-sub">CRM Portal</div>
            </div>
          </div>

          <nav className="sh-nav">
            <button
              className={`sh-nav-item ${page === "dashboard" ? "sh-nav-active" : ""}`}
              onClick={() => setPage("dashboard")}
            >
              <svg className="sh-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
              </svg>
              Dashboard
            </button>
            <button
              className={`sh-nav-item ${page === "processed" ? "sh-nav-active" : ""}`}
              onClick={() => setPage("processed")}
            >
              <svg className="sh-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Processed
            </button>
          </nav>
        </div>

        <div className="sh-sidebar-bottom">
          <div className="sh-exec-badge">
            <div className="sh-exec-avatar">SE</div>
            <div>
              <div className="sh-exec-name">Sales Executive</div>
              <div className="sh-exec-email">exec@autoelite.in</div>
            </div>
          </div>
          <button className="sh-logout" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
              <path d="M17 16l4-4m0 0l-4-4m4 4H7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 12V7a2 2 0 012-2h6" strokeLinecap="round" />
              <path d="M3 12v5a2 2 0 002 2h6" strokeLinecap="round" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="sh-content">
        {page === "dashboard" ? <Dashboard /> : <Processed />}
      </main>
    </div>
  );
}
