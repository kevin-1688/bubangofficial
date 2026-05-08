// api/signup.js — BǑ-BĀNG Early Bird Signup
// Vercel Serverless Function (Node.js runtime)
//
// Dependencies (add to package.json):
//   "@supabase/supabase-js": "^2"
//
// Required environment variables in Vercel Dashboard:
//   SUPABASE_URL           — from Supabase project settings
//   SUPABASE_SERVICE_KEY   — Service Role key (NOT anon key)
//   ALLOWED_ORIGIN         — e.g. https://bubangofficial.vercel.app

import { createClient } from '@supabase/supabase-js';

// ── Constants ──
const RATE_LIMIT_WINDOW_MS = 60 * 1000;  // 1 minute window
const RATE_LIMIT_MAX       = 3;           // max 3 submissions per IP per window
const EMAIL_MAX_LENGTH     = 254;         // RFC 5321
const EMAIL_REGEX          = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{1,63}$/;

// ── In-memory rate limit store (per cold-start instance) ──
// For production scale: replace with Upstash Redis
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip) || { count: 0, reset: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.reset) {
    // Window expired — reset
    entry.count = 1;
    entry.reset = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(ip, entry);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((entry.reset - now) / 1000) };
  }

  entry.count++;
  rateLimitStore.set(ip, entry);
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// ── Supabase client (lazy singleton) ──
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) throw new Error('Missing Supabase env vars');
    _supabase = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return _supabase;
}

// ── Main handler ──
export default async function handler(req, res) {
  // ── CORS ──
  const origin = process.env.ALLOWED_ORIGIN || 'https://bubangofficial.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── IP extraction ──
  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  // ── Rate limit ──
  const rl = checkRateLimit(ip);
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
  res.setHeader('X-RateLimit-Remaining', rl.remaining);

  if (!rl.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      retryAfterSeconds: rl.resetIn
    });
  }

  // ── Parse body ──
  let email;
  try {
    email = (req.body?.email || '').trim().toLowerCase();
  } catch {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  // ── Server-side email validation ──
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  if (email.length > EMAIL_MAX_LENGTH) {
    return res.status(400).json({ error: 'Email too long' });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // ── Supabase insert ──
  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('[signup] Supabase init failed:', err.message);
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { error } = await supabase
    .from('early_bird')
    .insert({
      email,
      ip_hash: await hashIp(ip),   // store hashed IP only, never raw
      created_at: new Date().toISOString(),
      source: req.headers['referer'] || null,
      user_agent: (req.headers['user-agent'] || '').slice(0, 200) || null,
    });

  if (error) {
    // Postgres unique violation = duplicate email
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Already registered' });
    }
    console.error('[signup] Supabase insert error:', error.message);
    return res.status(500).json({ error: 'Server error' });
  }

  return res.status(200).json({ ok: true });
}

// ── Hash IP using Web Crypto (no raw IP stored) ──
async function hashIp(ip) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip + (process.env.IP_HASH_SALT || 'bubang-salt'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
  } catch {
    return null;
  }
}
