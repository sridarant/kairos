# Deployment Guide

## Vercel (recommended)

1. Push repository to GitHub
2. Import project in Vercel dashboard
3. Set environment variables:
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_ANON_KEY` — your Supabase anonymous key
   - `ANTHROPIC_API_KEY` — optional, for language enrichment
4. Deploy. Vercel auto-detects Vite + serverless functions.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `SUPABASE_URL` | No | User data persistence |
| `SUPABASE_ANON_KEY` | No | Supabase authentication |
| `ANTHROPIC_API_KEY` | No | Language enrichment via Claude |

All variables are optional. Without them:
- User data persists to `data/store.json` (local only)
- Language enrichment is skipped

## PWA Installation

The app is a PWA. After deployment:
1. Visit the URL on mobile
2. Browser shows "Add to Home Screen" prompt
3. App installs as a native-like PWA

Service worker precaches 7 assets (~215KB) for offline support.

## Supabase Setup

Run the SQL in `SUPABASE_SETUP.md` to create the `user_data` table.

## Local Development

```bash
npm install
npm run dev      # Vite on :5173 with Vercel dev proxy
```

The Vercel dev proxy handles `/api/*` routes locally.
