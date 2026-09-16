const { EventEmitter } = require("events");

// In-process pub/sub used to push new chat messages to connected admins
const bus = new EventEmitter();
bus.setMaxListeners(100);

// Map of admin WebSocket connections -> userId
const adminSockets = new Map();

function setAdminSocket(userId, ws) {
  adminSockets.set(userId, ws);
  ws.on("close", () => {
    if (adminSockets.get(userId) === ws) adminSockets.delete(userId);
  });
}

/**
 * Broadcast a message to the given recipient user ids.
 * Messages intended for a customer go to all connected admins (shared inbox).
 * Messages from an admin go straight to that customer (polled by the customer).
 */
function broadcastToAdmins(recipientIds, message) {
  bus.emit("chat:message", recipientIds, message);
}

module.exports = { bus, setAdminSocket, broadcastToAdmins };