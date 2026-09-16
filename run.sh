#!/usr/bin/env bash
# Start both the frontend (Next.js) and backend (Node.js/Express + MongoDB)
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> Starting backend (MongoDB on :5000)..."
(cd "$ROOT/backend" && npm start) &
BACKEND_PID=$!

echo "==> Starting frontend (Next.js on :3000)..."
(cd "$ROOT" && npm run dev) &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "==> Stopping servers..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait