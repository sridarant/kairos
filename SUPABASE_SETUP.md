# Kairos — Supabase Setup

## 1. Create a Supabase project
Visit https://supabase.com and create a free project.

## 2. Run SQL in the Supabase SQL Editor
Copy the SQL from `api/supabase.js` comments and run it in your project's SQL editor.
This creates: `kairos_profiles`, `kairos_history`, `kairos_feedback`.

## 3. Add environment variables to Vercel
In Vercel → Settings → Environment Variables:

```
SUPABASE_URL      = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-anon-key
ANTHROPIC_API_KEY = your-anthropic-key
```

## 4. Deploy
Push to GitHub → Vercel auto-deploys.

## Fallback behaviour
If Supabase vars are not set, Kairos falls back to:
1. /data/store.json (file-based, local dev)
2. In-memory Map (ephemeral, cold starts)

The app never crashes — it degrades gracefully.
