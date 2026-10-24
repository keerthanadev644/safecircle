# SafeCircle v2: setup

## Run locally
```
npm install
cp .env.example .env      # then fill in your Twilio values (optional)
npm start
```
Open http://localhost:3000 (location works on localhost and on HTTPS).

Without Twilio keys the app still works: `/api/sos` answers 503 and the page shows WhatsApp buttons instead.

## Twilio (SMS or WhatsApp sandbox)
1. Create a Twilio account and copy the Account SID and Auth Token.
2. SMS: set `TWILIO_FROM` to your Twilio number and `CHANNEL=sms`.
   WhatsApp sandbox: set `TWILIO_FROM=+14155238886`, `CHANNEL=whatsapp`, and have each receiving phone join the sandbox.
3. Trial accounts can usually message only verified numbers. Verify your own and your teammates' numbers for the demo.

## Deploy (Render, Railway or similar)
- Build command: `npm install`, start command: `npm start`.
- Add the variables from `.env.example` in the host's environment settings. Never commit `.env`.
- The same server serves the pages and the API, so `BACKEND_URL` in `public/script.js` stays empty.

## Files
- `server.js`: Express server, `POST /api/sos`, `GET /api/health`
- `public/`: index.html, style.css, script.js
