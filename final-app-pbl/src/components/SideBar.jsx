import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Load sessions on component mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/sessions`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        }
      } catch (err) {
        console.warn("[Sidebar] Could not load sessions:", err.message);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [API_URL]);

  // Handle session click - navigate to /session/:id
  const handleSessionClick = (sessionId) => {
    navigate(`/session/${sessionId}`);
  };

  // Format session display - show truncated ID or date
  const formatSessionDisplay = (sessionId, createdAt) => {
    if (createdAt) {
      const date = new Date(createdAt);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return sessionId.substring(0, 8) + "...";
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white p-4 flex flex-col">
      {/* Top section */}
      <div className="mb-6">
        <h2 className="text-lg font-bold">Chat History</h2>
      </div>

      {/* Chat history list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {loading ? (
          <span className="text-sm text-gray-400 italic">Loading...</span>
        ) : sessions.length === 0 ? (
          <span className="text-sm text-gray-400 italic">No chat history</span>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              onClick={() => handleSessionClick(session.id)}
              className="p-3 rounded-md hover:bg-gray-700 cursor-pointer transition"
              title={session.id}
            >
              <span className="truncate text-sm block">
                {formatSessionDisplay(session.id, session.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Bottom - New Chat */}
      <div 
        className="mt-6 p-3 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 cursor-pointer transition"
        onClick={() => navigate("/")}
      >
        <span className="text-sm font-medium">+ New Chat</span>
      </div>
    </div>
  );
}