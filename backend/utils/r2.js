const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET = process.env.R2_BUCKET;
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

const localDir = path.join(__dirname, "..", "uploads");
const configured = !!(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);

let client = null;
if (configured) {
  client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

function normalizeKey(key) {
  return String(key).replace(/^\/+|\/+$/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadFile(key, buffer, contentType) {
  const safeKey = normalizeKey(key);
  if (client) {
    await client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: safeKey,
        Body: buffer,
        ContentType: contentType || "application/octet-stream",
      })
    );
    return { key: safeKey, storage: "r2" };
  }
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  fs.writeFileSync(path.join(localDir, safeKey), buffer);
  return { key: safeKey, storage: "local" };
}

async function getObject(key) {
  const safeKey = normalizeKey(key);
  if (client) {
    const res = await client.send(new GetObjectCommand({ Bucket: R2_BUCKET, Key: safeKey }));
    return {
      stream: res.Body,
      contentType: res.ContentType || "application/octet-stream",
      size: res.ContentLength,
    };
  }
  const fp = path.join(localDir, safeKey);
  if (!fs.existsSync(fp)) return null;
  return {
    stream: fs.createReadStream(fp),
    contentType: "application/octet-stream",
    size: fs.statSync(fp).size,
  };
}

async function deleteFile(key) {
  const safeKey = normalizeKey(key);
  try {
    if (client) {
      await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: safeKey }));
      return true;
    }
    const fp = path.join(localDir, safeKey);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    return true;
  } catch (err) {
    console.error("[r2 delete]", err.message);
    return false;
  }
}

module.exports = { configured, uploadFile, getObject, deleteFile, normalizeKey };