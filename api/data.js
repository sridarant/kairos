/**
 * /api/data.js — User data persistence
 *
 * GET  /api/data?userId=<id>         → fetch user data record
 * POST /api/data                      → write action (profile, history, feedback)
 *
 * Actions: save_profile | add_history | update_outcome | track_open | track_feedback
 *
 * Uses Supabase when configured; file-based fallback otherwise.
 * Never logs user names, DOBs, or birth times.
 */

import { createClient } from './supabase.js'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR   = path.join(process.cwd(), 'data')
const STORE_FILE = path.join(DATA_DIR, 'store.json')

// ─── Validation ───────────────────────────────────────────────────────────────

function sanitiseUserId(raw) {
  return String(raw || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'default'
}

function sanitiseProfile(profile) {
  if (!Array.isArray(profile)) return []
  return profile.slice(0, 5).map(u => ({
    name:       String(u.name || '').slice(0, 50),
    dob:        String(u.dob  || '').slice(0, 10),
    birth_time: String(u.birth_time || '').slice(0, 5),
    type:       String(u.type || 'primary').slice(0, 20)
  }))
}

function sanitiseEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  return {
    type:      String(entry.type      || 'feedback').slice(0, 32),
    category:  entry.category  ? String(entry.category).slice(0, 32)  : null,
    outcome:   entry.outcome   ? String(entry.outcome).slice(0, 32)   : null,
    decision:  entry.decision  ? String(entry.decision).slice(0, 10)  : null,
    confidence:entry.confidence? String(entry.confidence).slice(0,16) : null,
    timestamp: new Date().toISOString()
  }
}

// ─── Storage backends ─────────────────────────────────────────────────────────

async function readFile() {
  try {
    const raw = await fs.readFile(STORE_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function writeFile(data) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(STORE_FILE, JSON.stringify(data, null, 2))
}

async function readSupabase(supabase, userId) {
  const { data, error } = await supabase
    .from('user_data').select('*').eq('user_id', userId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

async function writeSupabase(supabase, userId, updates) {
  const { error } = await supabase.from('user_data')
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ─── Action handlers ──────────────────────────────────────────────────────────

function applyAction(existing = {}, action, body) {
  switch (action) {
    case 'save_profile':
      return { ...existing, user_profile: sanitiseProfile(body.user_profile) }
    case 'add_history': {
      const entry = sanitiseEntry(body)
      if (!entry) return existing
      const history = [entry, ...(existing.history || [])].slice(0, 500)
      return { ...existing, history }
    }
    case 'track_feedback': {
      const fb = { category: String(body.category||'').slice(0,32),
        outcome: String(body.outcome||'').slice(0,32), timestamp: new Date().toISOString() }
      const feedback = [...(existing.feedback || []), fb].slice(-500)
      return { ...existing, feedback }
    }
    case 'track_open': {
      const stats = existing.usage_stats || {}
      return { ...existing, usage_stats: { ...stats,
        sessions: (stats.sessions || 0) + 1, last_open: new Date().toISOString() } }
    }
    default:
      return existing
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  const useSupabase = !!(supabaseUrl && supabaseKey)

  try {
    if (req.method === 'GET') {
      const userId = sanitiseUserId(req.query.userId)
      if (useSupabase) {
        const client = createClient(supabaseUrl, supabaseKey)
        return res.status(200).json((await readSupabase(client, userId)) || {})
      }
      const store = await readFile()
      return res.status(200).json(store[userId] || {})
    }

    if (req.method === 'POST') {
      const body   = req.body || {}
      const userId = sanitiseUserId(body.userId)
      const action = String(body.action || '').slice(0, 32)

      if (!action) return res.status(400).json({ error: 'action is required', code: 'MISSING_ACTION' })

      if (useSupabase) {
        const client   = createClient(supabaseUrl, supabaseKey)
        const existing = (await readSupabase(client, userId)) || {}
        const updated  = applyAction(existing, action, body)
        await writeSupabase(client, userId, updated)
        return res.status(200).json({ ok: true })
      }

      const store    = await readFile()
      store[userId]  = applyAction(store[userId] || {}, action, body)
      await writeFile(store)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  } catch (err) {
    console.error('[/api/data] Error:', err.message)
    return res.status(500).json({ error: 'Data operation failed', code: 'STORAGE_ERROR' })
  }
}
