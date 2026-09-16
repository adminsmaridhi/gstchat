#!/usr/bin/env node
/**
 * One-time consent bootstrap for Gmail API OAuth2.
 *
 * How it works:
 *   1. Starts a tiny local server on PORT (default 8787).
 *   2. Prints a Google consent URL. Open it, sign in as the mailbox owner
 *      (premiuma754@gmail.com), click Allow.
 *   3. Google redirects back to http://localhost:PORT/?code=... — the server
 *      swaps the code for a refresh token and writes it into backend/.env.
 *
 * Requires: backend/oauth/client_secret.json (the file recently added)
 *           and "http://localhost:8787/" registered as an Authorized
 *           redirect URI in Google Cloud Console (Credentials page).
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const { google } = require("googleapis");

const ROOT = path.join(__dirname, "..");
const SECRET_FILE = path.join(ROOT, "oauth", "client_secret.json");
const ENV_FILE = path.join(ROOT, ".env");
const PORT = Number(process.env.OAUTH_PORT || 8787);
const REDIRECT_URI = `http://localhost:${PORT}/`;

if (!fs.existsSync(SECRET_FILE)) {
  console.error("Missing backend/oauth/client_secret.json — add the downloaded file first.");
  process.exit(1);
}
const { web } = JSON.parse(fs.readFileSync(SECRET_FILE, "utf8"));

const oauth = new google.auth.OAuth2(web.client_id, web.client_secret, REDIRECT_URI);

// Only ask for the scopes we need: send + compose mail as the signed-in user.
const authUrl = oauth.generateAuthUrl({
  access_type: "offline", // yields a refresh_token
  prompt: "consent",      // forces it even if already granted once
  scope: ["https://www.googleapis.com/auth/gmail.send"],
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/") return res.writeHead(404).end("not found");
  const code = url.searchParams.get("code");
  const err = url.searchParams.get("error");
  if (err) { res.end(`<h3>Consent error: ${err}</h3>`); return; }
  if (!code) { res.end("<h3>Waiting for code...</h3>"); return; }

  try {
    const { tokens } = await oauth.getToken(code);
    if (!tokens.refresh_token) {
      res.end("<h3>No refresh_token returned. This usually means the OAuth client is a<br/>'web' type without the prompt=consent param — restart after clearing, or check the redirect URI + scopes.</h3>");
      return;
    }
    // Write refresh token into .env (gitignored)
    const secretValue = String(tokens.refresh_token)
      .replace(/"/g, '\\"').replace(/\n/g, "\\n");
    let env = fs.readFileSync(ENV_FILE, "utf8");
    if (/^GMAIL_REFRESH_TOKEN=/m.test(env)) {
      env = env.replace(/^GMAIL_REFRESH_TOKEN=.*$/m, `GMAIL_REFRESH_TOKEN="${secretValue}"`);
    } else {
      env += `\n# ===== Gmail API OAuth2 (refresh token, gitignored) =====\nGMAIL_CLIENT_ID="${web.client_id}"\nGMAIL_CLIENT_SECRET="${web.client_secret.replace(/"/g, '\\"')}"\nGMAIL_REFRESH_TOKEN="${secretValue}"\n`;
    }
    fs.writeFileSync(ENV_FILE, envpw);
    res.end("<h3>✅ Refresh token saved to backend/.env</h3><p>You can close this tab and restart the backend.</p>");
    console.log("\n✅ GMAIL_REFRESH_TOKEN written to backend/.env — restart backend to start sending real emails.\n");
    server.close();
    process.exit(0);
  } catch (e) {
    res.end(`<h3>Token exchange failed: ${e.message}</h3>`);
  }
});

server.listen(PORT, () => {
  console.log("\n1) Open this URL in a browser (signed in as premiuma754@gmail.com):\n");
  console.log("   " + authUrl + "\n");
  console.log(`2) Click Allow. You'll be sent back here on port ${PORT} and the token saves itself.\n`);
});
