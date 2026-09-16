const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");
const { requireAuth, isAdminRole } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
const { uploadFile, deleteFile } = require("../utils/r2");
const { broadcastToAdmins } = require("../utils/ws");

const router = express.Router();

/**
 * Shared support inbox:
 *  - Customers message "Support" (receiverId = null). Every admin sees it.
 *  - Any admin can reply (senderId = admin, receiverId = customer).
 *  - Customers always see their own thread with support, whoever answered.
 */

const PAGE_LIMIT = 50;
const MAX_LIMIT = 200;

const threadMatch = (a, b) => ({
  $or: [
    { senderId: a, receiverId: b },
    { senderId: b, receiverId: a },
    { senderId: b, receiverId: null },
  ],
});

// Fetch one page of a thread, newest-first, with a `before` (createdAt) cursor.
// Returns ascending messages + a nextCursor (null when no more history exists).
const queryThreadPage = async (match, before, limit, select) => {
  const q = before
    ? ChatMessage.find({ ...match, createdAt: { $lt: before } })
    : ChatMessage.find(match);
  const page = await q
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .populate("senderId", select)
    .lean();
  const hasMore = page.length > limit;
  const docs = page.slice(0, limit);
  const messages = docs.reverse();
  return {
    messages,
    nextCursor: hasMore && messages.length ? new Date(messages[0].createdAt).toISOString() : null,
  };
};

// GET /api/chat
//   Customer: /api/chat                     -> their thread with support (paginated)
//   Admin:    /api/chat                     -> all customer conversations
//   Admin:    /api/chat?with=:id            -> thread with a specific customer (paginated)
//   Both support `before` (cursor) + `limit`.
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const otherId = req.query.with;
    const isAdmin = isAdminRole(req.user.role);
    const before = req.query.before ? new Date(req.query.before) : null;
    const limit = Math.min(parseInt(req.query.limit) || PAGE_LIMIT, MAX_LIMIT);

    if (isAdmin) {
      if (otherId) {
        const { messages, nextCursor } = await queryThreadPage(
          threadMatch(userId, otherId),
          before,
          limit,
          "name username email avatar role"
        );

        // Mark messages from the customer as read
        await ChatMessage.updateMany(
          { senderId: otherId, isRead: false },
          { isRead: true, readAt: new Date(), readBy: userId }
        );

        return res.json({ messages, nextCursor });
      }

      // All customer conversations grouped by customer (single aggregation ->
      // last message + unread count per customer, avoids N+1 queries).
      const admins = ["admin", "superadmin"];
      const rows = await ChatMessage.aggregate([
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              $cond: [
                { $in: ["$senderRole", admins] },
                "$receiverId",
                "$senderId",
              ],
            },
            lastMessage: { $first: "$$ROOT" },
            unread: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $not: { $in: ["$senderRole", admins] } },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { "lastMessage.createdAt": -1 } },
      ]);

      const customers = await User.find({ _id: { $in: rows.map((r) => r._id) } })
        .select("name username email avatar businessName online role");
      const map = new Map(customers.map((c) => [c._id.toString(), c]));

      const conversations = rows.map((r) => {
        const id = r._id.toString();
        const lm = r.lastMessage || {};
        return {
          user: {
            id,
            name: map.get(id)?.name || "Customer",
            username: map.get(id)?.username || "",
            email: map.get(id)?.email || "",
            avatar: map.get(id)?.avatar || null,
            online: map.get(id)?.online || false,
            businessName: map.get(id)?.businessName || null,
          },
          lastMessage: {
            _id: lm._id,
            senderId: lm.senderId,
            senderRole: lm.senderRole,
            content: lm.content,
            fileName: lm.fileName,
            fileType: lm.fileType,
            fileUrl: lm.fileUrl,
            createdAt: lm.createdAt,
            isRead: lm.isRead,
          },
          unread: r.unread,
        };
      });

      return res.json({ conversations });
    }

    // --- Customer view (paginated) ---
    const { messages, nextCursor } = await queryThreadPage(
      { $or: [{ senderId: userId }, { receiverId: userId }] },
      before,
      limit,
      "name username email avatar role"
    );

    return res.json({ messages, nextCursor });
  } catch (err) {
    console.error("[chat list]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /api/chat  send a message (multipart with optional file)
//  customer -> support: no receiverId (goes to shared inbox)
//  admin    -> customer: receiverId = customer id
router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const isAdmin = isAdminRole(req.user.role);
    const text = (req.body.content || req.body.message || "").toString().trim();
    if (!text && !req.file) {
      return res.status(400).json({ error: "Message or file is required" });
    }

    const receiverId = isAdmin ? (req.body.receiverId || null) : null;
    if (isAdmin && !receiverId) {
      return res.status(400).json({ error: "Select a customer to reply to" });
    }

    let file = null;
    if (req.file) {
      const ext = (req.file.originalname.match(/\.([a-zA-Z0-9]+)$/) || [])[1] || "bin";
      const key = `chat/${Date.now()}-${Math.round(Math.random() * 1e9)}-${req.userId}.${ext}`;
      const uploaded = await uploadFile(key, req.file.buffer, req.file.mimetype);
      file = {
        fileUrl: `/api/uploads/${uploaded.key}`,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      };
    }

    const baseUrl = process.env.BASE_URL || `https://${req.get("host")}`;
    const message = await ChatMessage.create({
      senderId: req.userId,
      senderRole: req.user.role,
      receiverId,
      content: text,
      fileUrl: file ? `${baseUrl}${file.fileUrl}` : null,
      fileName: file ? file.fileName : null,
      fileType: file ? file.fileType : null,
      fileSize: file ? file.fileSize : null,
    });

    const populated = await message.populate("senderId", "name username email avatar role");

    // Realtime: everyone in the thread gets it
    const recipients = isAdmin
      ? [receiverId]
      : (await User.find({ role: { $in: ["admin", "superadmin"] } })).map((a) => a._id.toString());
    broadcastToAdmins(recipients, populated);

    return res.status(201).json({ message: populated });
  } catch (err) {
    console.error("[chat send]", err.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

// DELETE /api/chat/:id (own message, or admin in any thread)
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });
    if (message.senderId.toString() !== req.userId && !isAdminRole(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    if (message.fileUrl) {
      const key = message.fileUrl.split("/api/uploads/").pop();
      await deleteFile(key);
    }
    await message.deleteOne();
    return res.json({ message: "Message deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;