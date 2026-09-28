# Supabase Free Tier Keep-Alive Plan

## Context
- **Project**: Interactive AI Learning Platform (React + Node/Express + OpenRouter)
- **Supabase usage**: Frontend-only (auth, user_progress, learning_history, profiles)
- **Goal**: Portfolio/demo project, $0/month budget, keep all features
- **Problem**: Supabase pauses free projects after 7 days of inactivity

## Recommended Solution: GitHub Actions Keep-Alive Workflow

### Why This Approach
| Criteria | Score |
|----------|-------|
| Cost | $0 (GitHub Actions free tier) |
| Code changes | Zero - no app modifications |
| Supabase features | All preserved |
| Reliability | High (GitHub infrastructure) |
| Setup time | ~10 minutes |
| Maintenance | Near-zero |

### How It Works
1. GitHub Actions cron runs every **3 days** (safe margin under 7-day limit)
2. Workflow pings Supabase REST API (`/rest/v1/`) with anon key
3. Generates real database activity to prevent pausing
4. Logs success/failure in Actions tab for monitoring

### Implementation Steps

#### 1. Create GitHub Actions Workflow
**File**: `.github/workflows/supabase-keepalive.yml`

```yaml
name: Supabase Keep-Alive

on:
  schedule:
    - cron: '0 9 * * */3'  # Every 3 days at 09:00 UTC
  workflow_dispatch:        # Manual trigger

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Supabase
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            "${{ secrets.SUPABASE_URL }}/rest/v1/" || exit 1
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

#### 2. Add GitHub Repository Secrets
Go to: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value Source |
|-------------|--------------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon/public key |

#### 3. (Optional) Enhanced Version with RPC
For guaranteed "real" database activity, add a keepalive RPC to Supabase:

```sql
-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.keepalive_log (
  key TEXT PRIMARY KEY,
  touched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'github-actions'
);

CREATE OR REPLACE FUNCTION public.keepalive_ping()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.keepalive_log (key, touched_at, source)
  VALUES ('github-actions', NOW(), 'github-actions')
  ON CONFLICT (key) DO UPDATE SET
    touched_at = EXCLUDED.touched_at,
    source = EXCLUDED.source;
  RETURN JSON_BUILD_OBJECT('ok', true, 'touched_at', NOW());
END;
$$;
```

Then update workflow to call the RPC:
```yaml
curl -s -X POST \
  -H "apikey: ${{ secrets.SUPABASE_ANON_KEY }}" \
  -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
  -H "Content-Type: application/json" \
  "${{ secrets.SUPABASE_URL }}/rest/v1/rpc/keepalive_ping"
```

#### 4. Test & Verify
1. Push workflow → Go to **Actions tab** → Run workflow manually
2. Check logs for HTTP 200 response
3. Verify in Supabase Dashboard → Database → Logs (if using RPC)

## Alternative Solutions (Ranked)

| Approach | Cost | Effort | Pros | Cons |
|----------|------|--------|------|------|
| **GitHub Actions (this plan)** | $0 | Low | Zero code changes, reliable | Requires GitHub repo |
| **Supawake CLI + GitHub Actions** | $0 | Medium | Notifications, multi-project | More complex setup |
| **Vercel Cron + API endpoint** | $0 | Medium | Native to Vercel deploy | 1 cron limit on free tier |
| **Local cron (supawake start)** | $0 | Low | Simple | Requires always-on machine |
| **Upgrade to Supabase Pro** | $25/mo | None | No pausing ever | Ongoing cost |
| **Guest mode (no auth)** | $0 | High | No Supabase needed | Loses progress/history |
| **LocalStorage only** | $0 | High | No external deps | No cross-device sync |

## Risk Mitigation
- **GitHub Actions failure**: Workflow logs show failures; add email notification step if critical
- **Anon key rotation**: Update secret in GitHub if key changes
- **Supabase policy changes**: Monitor Supabase changelog for pausing policy updates

## Validation Checklist
- [ ] Workflow file created and committed
- [ ] Two GitHub secrets added
- [ ] Manual workflow run succeeds (check Actions logs)
- [ ] Project stays active for 2+ weeks without manual login
- [ ] Auth, progress, history all work after period of inactivity

## Out of Scope
- Frontend code changes (auth bypass, localStorage fallback)
- Backend modifications (backend doesn't use Supabase)
- Paid plan migration
- Alternative auth providers (Firebase, Auth0)