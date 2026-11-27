# Deploy

## 1) Backend (Render / Railway) - keeps WebSocket connections alive
- Push the project to GitHub. On Render: New > Blueprint (uses render.yaml) or Web Service: build `npm install`, start `npm start`, health check `/health`.
- Env var: `ALLOWED_ORIGINS` = your Vercel URL (no trailing slash). Leave unset only for testing (allows any origin).
- Render gives HTTPS automatically, so Socket.IO uses WSS.
- Note: free Render instances sleep when idle; the first connection can take ~30-60s.

## 2) Frontend (Vercel)
- Import the same repo. Settings are in vercel.json (build `npm run build`, output `public`).
- Env var: `SERVER_URL` = the Render URL (e.g. https://curse-platform-battle-server.onrender.com).
- Deploy, open the Vercel URL, Create Room on one device, Join with the code on another.
- After changing SERVER_URL you must redeploy (it is written into config.js at build time).

## Local test
`npm install && npm test` then `npm run dev` and open http://localhost:3000 in two tabs.
