import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SalesLogin.css";

const USERS = [
  { id: "xyz", password: "pass1", name: "Arjun Mehta" },
  { id: "abc", password: "pass2", name: "Priya Singh" },
];

export default function SalesLogin() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    setError("");
    if (!userId || !password) { setError("Please enter your credentials."); return; }
    setLoading(true);
    setTimeout(() => {
      const user = USERS.find((u) => u.id === userId && u.password === password);
      if (user) {
        localStorage.setItem("ae_user", JSON.stringify({ id: user.id, name: user.name }));
        navigate("/sales");
      } else {
        setError("Invalid ID or password. Check your credentials.");
      }
      setLoading(false);
    }, 500);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="sl-root">
      <div className="sl-bg-lines" />
      <div className="sl-panel">
        <div className="sl-brand">
          <span className="sl-brand-icon">◈</span>
          <div>
            <div className="sl-brand-name">AutoElite</div>
            <div className="sl-brand-sub">Sales Executive Portal</div>
          </div>
        </div>

        <h2 className="sl-heading">Welcome back</h2>
        <p className="sl-para">Sign in to access your leads dashboard.</p>

        <div className="sl-form">
          <div className="sl-field">
            <label>Sales ID</label>
            <input
              type="text"
              placeholder="Enter your ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="sl-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          {error && <div className="sl-error">{error}</div>}
          <button className="sl-btn" onClick={handleLogin} disabled={loading}>
            {loading ? <span className="sl-spinner" /> : "Sign In →"}
          </button>
        </div>

        <div className="sl-demo-hint">
          IDs: <strong>xyz</strong> / pass1 &nbsp;·&nbsp; <strong>abc</strong> / pass2
        </div>
      </div>

      <div className="sl-visual">
        <div className="sl-visual-content">
          <div className="sl-stat-card">
            <div className="sl-stat-num">24</div>
            <div className="sl-stat-label">Active Leads</div>
          </div>
          <div className="sl-stat-card sl-stat-gold">
            <div className="sl-stat-num">9</div>
            <div className="sl-stat-label">Drives Today</div>
          </div>
          <div className="sl-tagline">
            <span>Turn every lead into a handshake.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
