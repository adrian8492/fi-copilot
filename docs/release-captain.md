# Release Captain

One-command deploy readiness check for F&I Co-Pilot. Gives you a single answer: **PASS**, **FAIL**, or **WARN** with the exact next action.

## Quick start

```bash
pnpm release:captain
```

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--repo <path>` | cwd | Path to the git repo |
| `--url <url>` | `https://finico-pilot-mqskutaj.manus.space` | Public app URL to check |
| `--expected-sha <sha>` | _(none)_ | Verify HEAD/origin match this SHA |
| `--skip-local-gates` | `false` | Skip `pnpm check`, `pnpm test`, `pnpm build` |
| `--json` | `false` | Output machine-readable JSON |

## What it checks

1. **Git branch** — on `main`?
2. **Git cleanliness** — working tree clean?
3. **Git sync** — ahead/behind upstream?
4. **SHA match** — HEAD or origin matches `--expected-sha` (if provided)
5. **Type check** — `pnpm check` passes
6. **Tests** — `pnpm test` passes
7. **Build** — `pnpm build` passes
8. **Live root** — `GET /` returns 200
9. **Health endpoint** — `/api/health` returns healthy status with database, deepgram, llm, encryption checks

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | PASS — all checks green |
| 1 | FAIL — at least one blocker |
| 2 | WARN — non-blocking issues |

## Examples

```bash
# Full check (runs typecheck, tests, build, and live checks)
pnpm release:captain

# Quick check — skip local gates (useful in CI after gates already ran)
pnpm release:captain --skip-local-gates

# Verify a specific SHA is deployed
pnpm release:captain --expected-sha abc1234

# Machine-readable output for automation
pnpm release:captain --json

# Check a different environment
pnpm release:captain --url https://staging.example.com
```

## Sample output

```
  ╔══════════════════════════════════════╗
  ║   Release Captain — PASS             ║
  ╚══════════════════════════════════════╝

  HEAD   671082f...
  ORIGIN 671082f...

  [OK] git-branch: On main
  [OK] git-clean: Working tree clean
  [OK] git-sync: In sync with origin/main
  [OK] typecheck: pnpm check succeeded
  [OK] tests: pnpm test succeeded
  [OK] build: pnpm build succeeded
  [OK] live-root: GET / returned 200
  [OK] health-status: status=healthy
  [OK] health-database: database=healthy
  [OK] health-deepgram: deepgram=configured
  [OK] health-llm: llm=configured
  [OK] health-encryption: encryption=configured

  NEXT: Ship it — all checks green.
```
