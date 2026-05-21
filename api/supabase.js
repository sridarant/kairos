// /api/supabase.js — Server-side Supabase client
// Used only in Vercel serverless functions (api/*.js).
// Reads from environment variables set in Vercel dashboard.

import { createClient } from '@supabase/supabase-js'

let _client = null

export function getSupabase() {
  if (_client) return _client
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null   // env vars not set — caller must handle fallback
  _client = createClient(url, key)
  return _client
}

// ─── SQL to create required tables (run once in Supabase dashboard SQL editor) ─
//
// CREATE TABLE IF NOT EXISTS kairos_users (
//   id          TEXT PRIMARY KEY,
//   name        TEXT,
//   dob         TEXT,
//   birth_time  TEXT,
//   type        TEXT,
//   created_at  TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE IF NOT EXISTS kairos_history (
//   id             BIGINT PRIMARY KEY,
//   user_id        TEXT REFERENCES kairos_users(id) ON DELETE CASCADE,
//   question       TEXT,
//   decision       TEXT,
//   confidence     INTEGER,
//   signal_strength TEXT,
//   outcome        TEXT,
//   acted          BOOLEAN,
//   created_at     TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE IF NOT EXISTS kairos_feedback (
//   id          SERIAL PRIMARY KEY,
//   user_id     TEXT REFERENCES kairos_users(id) ON DELETE CASCADE,
//   history_id  BIGINT REFERENCES kairos_history(id) ON DELETE CASCADE,
//   outcome     TEXT,
//   created_at  TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE IF NOT EXISTS kairos_profiles (
//   user_id     TEXT PRIMARY KEY REFERENCES kairos_users(id) ON DELETE CASCADE,
//   members     JSONB DEFAULT '[]',
//   usage_stats JSONB DEFAULT '{}',
//   updated_at  TIMESTAMPTZ DEFAULT NOW()
// );
//
// Enable Row Level Security on all tables and add permissive policies
// (or use service_role key for server-side access):
// ALTER TABLE kairos_users ENABLE ROW LEVEL SECURITY;
// CREATE POLICY "allow_all" ON kairos_users FOR ALL USING (true);
// (repeat for other tables)
