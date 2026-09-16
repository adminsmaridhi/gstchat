const mongoose = require("mongoose");
const noNull = require("../utils/no-null");

const chatMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    // For customer -> support messages this is unset (shared inbox).
    // For admin -> customer replies it holds the customer's id.
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, default: "" },
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    fileSize: { type: Number },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    readBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

noNull(chatMessageSchema);

// Thread lookups: customer or admin browsing one conversation (sorted asc)
chatMessageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
// Inbox `$or` branch on receiverId + support thread replies
chatMessageSchema.index({ receiverId: 1, senderId: 1, createdAt: 1 });
// Per-customer unread / mark-as-read scans
chatMessageSchema.index({ receiverId: 1, isRead: 1 });
// Shared-inbox aggregation ordering
chatMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);