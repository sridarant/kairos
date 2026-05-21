// /api/data.js — Central data API with Supabase persistence
// Primary: Supabase (when SUPABASE_URL + SUPABASE_ANON_KEY are set)
// Fallback: file-based /data/store.json
// Final fallback: in-memory Map (ephemeral, never loses the current session)

import { getSupabase } from './supabase.js'

// ─── File fallback ────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const STORE_PATH = join(process.cwd(), 'data', 'store.json')
const _mem = new Map()

const EMPTY_RECORD = () => ({
  user_profile: null,
  history:      [],
  feedback:     [],
  usage_stats:  { sessions: 0, ask_clicks: 0, last_open: null }
})

function readFileStore() {
  try {
    if (!existsSync(STORE_PATH)) return { users: {} }
    return JSON.parse(readFileSync(STORE_PATH, 'utf8'))
  } catch { return { users: {} } }
}

function writeFileStore(store) {
  try {
    mkdirSync(join(process.cwd(), 'data'), { recursive: true })
    writeFileSync(STORE_PATH, JSON.stringify(store, null, 2))
    return true
  } catch { return false }
}

function getFileFallback(userId) {
  const store = readFileStore()
  if (store.users?.[userId]) return store.users[userId]
  if (_mem.has(userId)) return _mem.get(userId)
  return EMPTY_RECORD()
}

function setFileFallback(userId, data) {
  const store = readFileStore()
  store.users = store.users || {}
  store.users[userId] = data
  if (!writeFileStore(store)) _mem.set(userId, data)
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function supabaseGet(userId) {
  const sb = getSupabase()
  if (!sb) return null

  const [profileRes, historyRes] = await Promise.all([
    sb.from('kairos_profiles').select('members, usage_stats').eq('user_id', userId).single(),
    sb.from('kairos_history').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  ])

  if (profileRes.error && profileRes.error.code !== 'PGRST116') return null  // PGRST116 = not found

  return {
    user_profile: profileRes.data?.members || null,
    history:      (historyRes.data || []).map(r => ({
      id: r.id, timestamp: r.created_at, question: r.question,
      decision: r.decision, confidence: r.confidence, outcome: r.outcome, acted: r.acted
    })),
    feedback:     [],
    usage_stats:  profileRes.data?.usage_stats || { sessions: 0, ask_clicks: 0, last_open: null }
  }
}

async function supabaseSaveProfile(userId, members) {
  const sb = getSupabase()
  if (!sb) return false
  const { error } = await sb.from('kairos_profiles').upsert({
    user_id: userId, members, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
  return !error
}

async function supabaseAddHistory(userId, entry) {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb.from('kairos_history').insert({
    id: entry.id, user_id: userId,
    question: entry.question, decision: entry.decision,
    confidence: entry.confidence, outcome: null, acted: null,
    created_at: new Date().toISOString()
  }).select('id').single()
  return error ? null : data?.id
}

async function supabaseUpdateOutcome(userId, id, outcome, acted) {
  const sb = getSupabase()
  if (!sb) return false
  const { error } = await sb.from('kairos_history').update({ outcome, acted })
    .eq('id', id).eq('user_id', userId)
  return !error
}

async function supabaseTrackUsage(userId, field) {
  const sb = getSupabase()
  if (!sb) return false
  const { data } = await sb.from('kairos_profiles').select('usage_stats').eq('user_id', userId).single()
  const stats = data?.usage_stats || { sessions: 0, ask_clicks: 0, last_open: null }
  if (field === 'session') { stats.sessions += 1; stats.last_open = new Date().toISOString() }
  if (field === 'ask')     { stats.ask_clicks += 1 }
  const { error } = await sb.from('kairos_profiles').upsert({
    user_id: userId, usage_stats: stats, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
  return !error
}

// ─── Unified get/set (Supabase → file → memory) ───────────────────────────────
async function getRecord(userId) {
  const sb = await supabaseGet(userId)
  if (sb) return sb
  return getFileFallback(userId)
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const { method, query, body } = req
  const userId = (query.userId || body?.userId || 'default').toString().slice(0, 64)

  if (method === 'GET') {
    const record = await getRecord(userId)
    return res.status(200).json(record)
  }

  if (method === 'POST') {
    const action = query.action || body?.action

    switch (action) {

      case 'save_profile': {
        const members = body.user_profile
        const ok = await supabaseSaveProfile(userId, members)
        if (!ok) {
          const r = getFileFallback(userId)
          r.user_profile = members
          setFileFallback(userId, r)
        }
        return res.status(200).json({ ok: true })
      }

      case 'add_history': {
        const entry = {
          id: Date.now(), question: body.question,
          decision: body.decision, confidence: body.confidence
        }
        const savedId = await supabaseAddHistory(userId, entry)
        if (!savedId) {
          const r = getFileFallback(userId)
          r.history = [{ ...entry, timestamp: new Date().toISOString(), outcome: null, acted: null }, ...r.history].slice(0, 20)
          setFileFallback(userId, r)
        }
        return res.status(200).json({ ok: true, id: savedId || entry.id })
      }

      case 'update_outcome': {
        const { id, outcome, acted } = body
        const ok = await supabaseUpdateOutcome(userId, id, outcome, acted)
        if (!ok) {
          const r = getFileFallback(userId)
          r.history = r.history.map(e => e.id === id ? { ...e, outcome: outcome ?? e.outcome, acted: acted ?? e.acted } : e)
          setFileFallback(userId, r)
        }
        return res.status(200).json({ ok: true })
      }

      case 'track_open': {
        const ok = await supabaseTrackUsage(userId, 'session')
        if (!ok) {
          const r = getFileFallback(userId)
          r.usage_stats.sessions += 1; r.usage_stats.last_open = new Date().toISOString()
          setFileFallback(userId, r)
        }
        return res.status(200).json({ ok: true })
      }

      case 'track_ask': {
        const ok = await supabaseTrackUsage(userId, 'ask')
        if (!ok) {
          const r = getFileFallback(userId)
          r.usage_stats.ask_clicks += 1
          setFileFallback(userId, r)
        }
        return res.status(200).json({ ok: true })
      }

      default:
        return res.status(400).json({ error: 'unknown action' })
    }
  }

  return res.status(405).end()
}
