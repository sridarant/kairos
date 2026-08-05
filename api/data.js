/**
 * /api/data.js — User data persistence (feedback, history, analytics)
 *
 * GET  /api/data?userId=<id>  — fetch user data
 * POST /api/data              — write feedback/history entry
 *
 * Uses Supabase when configured; falls back to file-based storage.
 * Never logs user names or DOBs.
 */

import { createClient } from './supabase.js'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR  = path.join(process.cwd(), 'data')
const STORE_FILE = path.join(DATA_DIR, 'store.json')

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
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

async function writeSupabase(supabase, userId, payload) {
  const { error } = await supabase
    .from('user_data')
    .upsert({ user_id: userId, ...payload, updated_at: new Date().toISOString() })
  if (error) throw error
}

// ─── Input validation ─────────────────────────────────────────────────────────

function sanitiseEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  return {
    type:      String(entry.type || 'feedback').slice(0, 32),
    category:  entry.category ? String(entry.category).slice(0, 32) : null,
    outcome:   entry.outcome  ? String(entry.outcome).slice(0, 32)  : null,
    timestamp: new Date().toISOString()
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  const useSupabase = !!(supabaseUrl && supabaseKey)

  try {
    if (req.method === 'GET') {
      const userId = String(req.query.userId || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
      if (useSupabase) {
        const client = createClient(supabaseUrl, supabaseKey)
        const data   = await readSupabase(client, userId)
        return res.status(200).json(data || {})
      }
      const store = await readFile()
      return res.status(200).json(store[userId] || {})
    }

    if (req.method === 'POST') {
      const body   = req.body || {}
      const userId = String(body.userId || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64)
      const entry  = sanitiseEntry(body.entry)
      if (!entry) return res.status(400).json({ error: 'Invalid entry', code: 'INVALID_ENTRY' })

      if (useSupabase) {
        const client = createClient(supabaseUrl, supabaseKey)
        const existing = await readSupabase(client, userId) || {}
        const history  = [...(existing.history || []).slice(-499), entry]
        await writeSupabase(client, userId, { history })
        return res.status(200).json({ ok: true })
      }
      const store = await readFile()
      if (!store[userId]) store[userId] = {}
      store[userId].history = [...(store[userId].history || []).slice(-499), entry]
      await writeFile(store)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  } catch (err) {
    console.error('[/api/data] Error:', err.message)
    return res.status(500).json({ error: 'Data operation failed', code: 'STORAGE_ERROR' })
  }
}
