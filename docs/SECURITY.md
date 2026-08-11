# Security

## Threat Model

Kairos is a client-side PWA with optional serverless API functions. There is no user authentication in v30. The threat model covers:

1. **Data exposure** — user birth details should not leak to third parties
2. **XSS** — untrusted content should not execute
3. **API abuse** — serverless functions should reject invalid input
4. **Secret exposure** — API keys must not appear in the client bundle

## Controls

### Identity Storage
- User profile stored in `localStorage` under `kairos_identity_v1` only
- No other keys contain user identity
- No network transmission of profile except to `/api/daily` (user-initiated)
- No analytics or telemetry that includes personal data

### API Security (`api/daily.js`, `api/data.js`)
- All inputs validated and sanitised before processing
- User names capped at 50 characters
- `userId` sanitised to alphanumeric + `-_`, max 64 chars
- `daysAhead` validated as numeric 0–365
- Raw engine objects never returned to client
- Error messages are safe (no stack traces, no internal paths)
- User PII (name, DOB, birth time) never logged to console

### XSS
- No use of `dangerouslySetInnerHTML`
- All user input rendered as text nodes (React JSX default)
- No dynamic `href` or `src` from user input
- No `eval()` or `Function()` constructor

### Secrets
- `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` are environment variables
- Never referenced in `src/` (client bundle)
- Only referenced in `api/` (serverless, server-side only)
- Supabase anon key is safe for client-side use by design (RLS enforced)

### Content Security
- No external scripts loaded
- External images not used (emoji only)
- Service worker precaches only known assets

## Assumptions

- Users trust their own device (no multi-tenant isolation needed in v30)
- Supabase RLS policies are configured per `docs/DEPLOYMENT.md`
- Vercel environment variables are set correctly

## Future Authentication (v32)

When authentication is added:
- `identityManager.attachAuth(token, provider)` is the attachment point
- No schema change required
- Profile remains localStorage-first; auth adds cloud sync
