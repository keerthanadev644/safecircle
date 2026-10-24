// SafeCircle backend: serves the frontend and sends SOS alerts through Twilio.
// No contact data is stored. Phone numbers are never written to logs.
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Twilio setup (optional: without keys the API answers 503 and the app falls back to WhatsApp links)
const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env;
const channel = (process.env.CHANNEL || 'sms').toLowerCase();
let client = null;
if (sid && token && from) {
  client = require('twilio')(sid, token);
} else {
  console.warn('Twilio is not configured. /api/sos will return 503 and the frontend will use WhatsApp links.');
}

// ---- tiny in-memory rate limiter: 5 alerts per minute per IP
const hits = new Map();
function isLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 60000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

function normalize(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.length === 10) return '+91' + d; // assume India for 10-digit numbers
  if (d.length >= 11 && d.length <= 15) return '+' + d;
  return null;
}

function buildMessage(reason, lat, lng, name) {
  const who = name ? name + ': ' : '';
  const where = (typeof lat === 'number' && typeof lng === 'number')
    ? 'https://maps.google.com/?q=' + lat + ',' + lng
    : '(location unavailable)';
  const what = reason === 'checkin'
    ? 'I did not confirm my safe arrival.'
    : 'I need help!';
  return '🚨 SafeCircle ' + who + what + ' My location: ' + where;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, configured: !!client, channel });
});

app.post('/api/sos', async (req, res) => {
  if (isLimited(req.ip)) return res.status(429).json({ error: 'too_many_requests' });
  if (!client) return res.status(503).json({ error: 'not_configured' });

  const { contacts, lat, lng, reason, name } = req.body || {};
  if (!Array.isArray(contacts) || contacts.length === 0 || contacts.length > 5) {
    return res.status(400).json({ error: 'invalid_contacts' });
  }
  const numbers = contacts.map(c => normalize(c && c.phone)).filter(Boolean);
  if (numbers.length === 0) return res.status(400).json({ error: 'invalid_numbers' });

  const body = buildMessage(
    reason === 'checkin' ? 'checkin' : 'sos',
    typeof lat === 'number' ? lat : undefined,
    typeof lng === 'number' ? lng : undefined,
    typeof name === 'string' ? name.slice(0, 30) : ''
  );
  const prefix = channel === 'whatsapp' ? 'whatsapp:' : '';
  const sender = from.startsWith('whatsapp:') || channel !== 'whatsapp' ? from : 'whatsapp:' + from;

  const results = await Promise.allSettled(
    numbers.map(n => client.messages.create({ from: sender, to: prefix + n, body }))
  );
  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - sent;
  results.forEach(r => { if (r.status === 'rejected') console.error('Send failed, code:', r.reason && r.reason.code); });
  console.log('SOS processed: sent=' + sent + ' failed=' + failed);

  if (sent === 0) return res.status(502).json({ error: 'send_failed', sent, failed });
  res.json({ sent, failed });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('SafeCircle running on port ' + port));
