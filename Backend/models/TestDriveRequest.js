// models/TestDriveRequest.js
// Mongoose model for test-drive booking requests.
// Stored in the same MongoDB instance (Tata-Motors) used for chat sessions,
// but in its own collection: `test_drive_requests`.

import mongoose from "mongoose";

const TestDriveRequestSchema = new mongoose.Schema(
  {
    // ── Form fields ──────────────────────────────────────────────────────────
    name:     { type: String, required: true, trim: true },
    email:    { type: String, trim: true, default: "" },
    phone:    { type: String, required: true, trim: true },
    date:     { type: String, required: true },
    time:     { type: String, required: true },
    showroom: { type: String, required: true, trim: true },
    car:      { type: String, required: true, trim: true },

    // ── Chat summary (5-line LLM output, \n-separated) ────────────────────
    summary_chat: { type: String, default: null },

    // ── Lifecycle fields ─────────────────────────────────────────────────────
    status:      { type: String, enum: ["pending", "accepted", "completed"], default: "pending" },
    accepted:    { type: Boolean, default: false },
    acceptedAt:  { type: String, default: null },
    completed:   { type: Boolean, default: false },
    completedAt: { type: String, default: null },
  },
  {
    collection: "test_drive_requests",
    timestamps: true, // createdAt + updatedAt managed by Mongoose
  }
);

const TestDriveRequest = mongoose.model("TestDriveRequest", TestDriveRequestSchema);

export default TestDriveRequest;
