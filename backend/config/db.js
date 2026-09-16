const mongoose = require("mongoose");

let memServer = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Connect to MongoDB.
 * - If MONGODB_URI is set, connect (serverless: retry with backoff instead of
 *   bailing into an in-memory server, which cannot boot on hosted runtimes).
 * - Otherwise (no URI at all), boot an in-memory MongoDB server for local dev.
 */
async function connectDB() {
  const configuredUri = process.env.MONGODB_URI;

  if (configuredUri) {
    if (!process.env.VERCEL) {
      await mongoose.connect(configuredUri, {
        dbName: process.env.DB_NAME || "saas_platform",
        serverSelectionTimeoutMS: 12000,
        connectTimeoutMS: 12000,
      });
      console.log(`[db] Connected to MongoDB at ${configuredUri}`);
      return "remote";
    }

    // Serverless: keep retrying the remote cluster with backoff. A failed first
    // attempt must NOT end up on MongoMemoryServer (it cannot run on Vercel and
    // leaves every query buffering until it times out).
    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await mongoose.connect(configuredUri, {
          dbName: process.env.DB_NAME || "saas_platform",
          serverSelectionTimeoutMS: 15000,
          connectTimeoutMS: 15000,
        });
        console.log(`[db] Connected to MongoDB at ${configuredUri} (attempt ${attempt})`);
        return "remote";
      } catch (err) {
        const reason = err.cause ? err.cause.message : err.message;
        const wait = Math.min(250 * Math.pow(2, attempt), 8000);
        console.warn(`[db] Connect attempt ${attempt}/${maxAttempts} failed (${reason}); retrying in ${wait}ms`);
        await sleep(wait);
      }
    }
    throw new Error("Could not connect to MongoDB after multiple attempts");
  }

  const { MongoMemoryServer } = require("mongodb-memory-server");
  memServer = await MongoMemoryServer.create();
  const uri = memServer.getUri("saas_platform");
  await mongoose.connect(uri);
  console.log(`[db] Connected to in-memory MongoDB: ${uri}`);
  return "memory";
}

async function disconnectDB() {
  await mongoose.disconnect();
  if (memServer) await memServer.stop();
}

module.exports = { connectDB, disconnectDB };