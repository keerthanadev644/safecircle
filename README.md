# 🛡️ SafeCircle

**Your trusted circle, one tap away.**
A mobile-first women's safety web app built for **recHERsion'26** (ACM-W NITK x ENGINEER, NITK).

| | |
|---|---|
| 🔗 **Live demo** | https://safecircle-shebuilds.onrender.com |
| 🎥 **Demo video** | [add your video link here] |
| 💻 **Code** | https://github.com/keerthanadev644/safecircle |
| 👩‍💻 **Team** | SheBuilds: B.Keerthana, K.Akshaya |

---

## The problem

When someone feels unsafe, every second counts. Most safety apps need an install, sign-up and setup before they help, and they are rarely designed for quick, discreet use by night-time commuters and students, or in local languages.

India registered 4,48,211 crimes against women in 2023 (source: NCRB, *Crime in India 2023*). These are reported cases only.

## Our solution

SafeCircle opens in any phone browser with **no login and no install**. One tap on SOS starts a short, cancelable countdown. The app then gets the user's location and sends an alert with a live map link to the trusted contacts she saved. A **safe-route check-in** can send the alert automatically if she does not confirm she has arrived.

## Features

- **SOS button** with a 5-second countdown and cancel option to prevent false alarms
- **Server-sent alerts** by SMS or WhatsApp (Twilio) with a Google Maps link
- **Automatic fallback:** if the server or Twilio is unavailable, the app shows WhatsApp buttons so the user can send the alert herself
- **Safe-route check-in:** set minutes to arrive. If she does not tap "I'm safe" in time, there is a 30-second warning (with vibration), then the alert is sent
- **Trusted contacts** form with validation (up to 5 contacts), stored only on the device
- **Share location** (Web Share API, with clipboard fallback) and **fake incoming call**
- **Safety tips** and one-tap helplines (112)
- **Multilingual:** English, Hindi, Telugu
- **Accessibility:** labelled form fields, screen-reader status messages, visible focus outlines, large touch targets, reduced-motion support and dark mode

## How it works

1. The user adds trusted contacts in the form.
2. She taps **SOS**. A 5-second countdown starts, and she can cancel it.
3. The browser gets her location (with permission).
4. The frontend sends the contacts and coordinates to `POST /api/sos`.
5. The Node.js server validates the request, rate-limits it, and sends a message to each contact through Twilio.
6. If the server cannot send, the frontend shows WhatsApp click-to-chat buttons as a fallback.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript |
| Browser APIs | Geolocation, Web Share, localStorage, Vibration |
| Backend | Node.js, Express |
| Alerts | Twilio (SMS or WhatsApp), WhatsApp click-to-chat (`wa.me`) as fallback |
| Hosting | Render |

## Project structure

```
safecircle/
├── server.js         # Express server and /api/sos endpoint
├── package.json
├── .env.example      # names of the environment variables (no secrets)
├── SETUP.md          # setup and deployment notes
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

## Run locally

```
npm install
cp .env.example .env     # on Windows: copy .env.example .env
npm start
```

Open http://localhost:3000. Without Twilio keys the app still works and uses the WhatsApp fallback. To send alerts from the server, fill in `.env` (see `SETUP.md`). Check `GET /api/health` to see whether the keys were loaded.

## Environment variables

| Name | Purpose |
|---|---|
| `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| `TWILIO_AUTH_TOKEN` | Twilio secret token |
| `TWILIO_FROM` | Sending phone number |
| `CHANNEL` | `sms` or `whatsapp` |

Secrets are never committed. `.env` is listed in `.gitignore`.

## Privacy

- Location is read only when an alert or share is triggered.
- Contacts are stored in the user's browser (`localStorage`).
- Contacts and coordinates are sent to the server only when an alert fires. The server does not store them and does not write phone numbers to its logs.
- The endpoint is rate-limited to 5 requests per minute per IP.

## Limitations

- Twilio trial accounts can usually message only verified numbers.
- The fallback WhatsApp alert needs the user to press Send, so it is not automatic.
- Location needs browser permission and an HTTPS page.
- The free hosting plan sleeps after inactivity, so the first request can take about a minute.
- Check-in timing runs in the browser, so the page must stay open or be reopened for the alert to fire.

## Future scope

- Run the check-in on the server so it works even when the phone is locked
- Community unsafe-area map
- Audio and video evidence capture
- Offline support as an installable PWA
- Integration with local emergency services

## Third-party resources

Express, dotenv and the Twilio Node SDK (npm packages). No other external libraries are used in the frontend.

## Team

**SheBuilds**: B.Keerthana, K.Akshaya

*She builds. She innovates. She leads.* 💜
