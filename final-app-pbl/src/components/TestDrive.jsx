import { useState, useEffect } from 'react';
import './TestDrive.css';

const TestDrive = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    time: "",
    showroom: "",
    car: ""
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Clear the test_drive_request flag once we've landed on this page
  useEffect(() => {
    localStorage.removeItem("test_drive_request");
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Fetch summary_chat from localStorage (set by Chat.jsx before navigation)
    const summaryChat = localStorage.getItem("summary_chat") || null;

    try {
      const res = await fetch(`${API_URL}/send-form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formData: form,
          summary_chat: summaryChat,
        }),
      });
      localStorage.setItem("summary_chat", "");
      localStorage.setItem("test_drive_request", "");
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Server error");
      }

      console.log("[TestDrive] Form submitted successfully with summary_chat");
      setSubmitted(true);
    } catch (err) {
      console.error("[TestDrive] Submit error:", err.message);
      setSubmitError(err.message);
    }
  };

  if (submitted) {
    return (
      <div className="td-root">
        <div className="td-bg-decor"></div>
        <div className="td-success-wrap">
          <div className="td-success-card">
            <div className="td-success-icon">✓</div>
            <h2>Request Received</h2>
            <p>Thank you, {form.name}. Our luxury concierge will contact you shortly to confirm your driving experience.</p>
            <div className="td-success-details">
              <span>{form.car}</span>
              <span className="td-sep">|</span>
              <span>{form.date} at {form.time}</span>
            </div>
            <button className="td-btn-ghost" onClick={() => setSubmitted(false)}>
              Back to Showroom
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="td-root">
      <div className="td-bg-decor"></div>

      <div className="td-container">
        <header className="td-header">
          <div className="td-logo">
            <span className="td-logo-icon">✧</span>
            <span className="td-logo-name">Tata Motors Prestige</span>
          </div>
          <h1 className="td-title">Book a Test Drive</h1>
          <p className="td-subtitle">Experience the pinnacle of Indian engineering and luxury.</p>
        </header>

        <form className="td-card" onSubmit={handleSubmit}>
          <div className="td-section-label">Personal Information</div>
          <div className="td-row">
            <div className="td-field">
              <label>Full Name</label>
              <input
                name="name"
                placeholder="Ex: Rajesh Kumar"
                required
                onChange={handleChange}
              />
            </div>
            <div className="td-field">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="td-field">
            <label>Email Address <span className="td-optional">(Optional)</span></label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              onChange={handleChange}
            />
          </div>

          <div className="td-section-label">Drive Preferences</div>

          <div className="td-field">
            <label>Select Vehicle</label>
            <select name="car" required onChange={handleChange}>
              <option value="">Choose a model...</option>
              <option value="Safari">Safari Dark Edition</option>
              <option value="Harrier">Harrier Red Dark</option>
              <option value="Nexon EV">Nexon EV Max</option>
              <option value="Curvv">The New Curvv</option>
              <option value="Altroz">Altroz Racer</option>
            </select>
          </div>

          <div className="td-row">
            <div className="td-field">
              <label>Preferred Date</label>
              <input type="date" name="date" required onChange={handleChange} />
            </div>
            <div className="td-field">
              <label>Preferred Time</label>
              <input type="time" name="time" required onChange={handleChange} />
            </div>
          </div>

          <div className="td-field">
            <label>Nearest Showroom</label>
            <input
              name="showroom"
              placeholder="Enter your city or area"
              required
              onChange={handleChange}
            />
          </div>

          <div className="td-actions">
            <button type="submit" className="td-btn-submit">
              Confirm Booking
            </button>
          </div>
        </form>

        <p className="td-footer-note">
          * Terms and conditions apply. Professional license required for the drive.
        </p>
      </div>
    </div>
  );
};

export default TestDrive;
