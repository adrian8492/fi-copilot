# Henry Nightly Task — March 20, 2026

## Priority: CRITICAL — Must complete tonight

## Task: Wire Mission Control V2 to Real Data

### What to Build

Mission Control V2 (`mission-control/index-v2.html`) has placeholder/static data in several tabs. Tonight you're wiring them to real file system data via the API server (`mission-control/api-server.js` on port 8743).

### 1. Agents Tab — Live Status (HIGH PRIORITY)

The Agents panel currently shows static cards. Replace with real data:

**For each agent (Oliver, Henry, Thomas, Scout):**
- Last run timestamp (read from cron state or memory files)
- What they last produced (read latest output files)
- Current status: Active / Idle / Error
- Next scheduled run time
- Task history (last 5 items)

**Data sources:**
- Oliver: `memory/2026-*.md` (latest daily notes)
- Thomas: `content/scripts/thomas-reels/`, `thomas-linkedin/`, `thomas-shorts/`, `thomas-twitter/` — count files, get latest timestamps
- Henry: `fi-copilot/` — last git commit, test results
- Scout: `memory/research/daily-intel-*.md`, `thumbnail-trends-*.md` — latest files

**Add an Activity Feed section** that shows a reverse-chronological log of agent actions (file created, task completed, errors). Read from:
- Git log (last 10 commits)
- File modification times in content/scripts/ and memory/research/
- Cron run logs if accessible

### 2. Docs Tab — Real Document Library (HIGH PRIORITY)

The Docs tab has hardcoded document entries. Replace with a dynamic file scanner:

**Scan these directories and build the document list:**
- `content/blog/` → category: Blogs
- `content/scripts/thomas-reels/` → category: Reel Scripts
- `content/scripts/thomas-linkedin/` → category: LinkedIn Posts
- `content/scripts/thomas-shorts/` → category: YouTube Shorts
- `content/scripts/thomas-twitter/` → category: Twitter Posts
- `content/scripts/` (root level .md files) → category: YouTube Scripts
- `memory/research/` → category: Research
- `memory/` (.md files only) → category: Memory/Daily Notes
- `agents/` → category: Agent Specs
- `brand-assets/materials/` → category: Brand Materials

**For each document show:**
- Filename / title (parse H1 from markdown if possible)
- Category (color-coded)
- File size
- Last modified date
- Status tag: parse for DRAFT/REVIEW/APPROVED if present in content, else show "—"
- Click to view content in preview panel (already exists — wire it up)

**Add search/filter** — the UI already has filter pills by category. Make them work with real data.

### 3. Calendar Tab — Real Schedule (MEDIUM PRIORITY)

Update the calendar to reflect actual cron schedules:

| Time | Agent | Task |
|------|-------|------|
| 7:00 AM | Oliver | Heartbeat + Morning Brief |
| 7:15 AM | Oliver | Discord Daily Brief |
| 7:20 AM | Scout | Discord Competitor Watch |
| 7:25 AM | Scout | Discord Industry News |
| 7:30 AM | Scout | Discord Thumbnail Trends |
| Every 4h | Thomas | Content Generation (Reels, LinkedIn, Shorts, Twitter) |
| 9:00 PM | Oliver | Discord Agent Status Rollup |
| 10:00 PM | Henry | Nightly Build |

Read cron schedule from a config file or hardcode the current schedule — we can make it dynamic later.

### 4. API Endpoints Needed

Add these to `mission-control/api-server.js`:

```
GET /api/agents/status → returns live status for all agents
GET /api/documents → returns scanned document list with metadata
GET /api/activity → returns recent activity feed (last 50 items)
GET /api/schedule → returns cron schedule for calendar
GET /api/documents/:path → returns document content for preview
```

### Technical Notes
- Keep the existing V2 design — dark theme, purple accents, same CSS
- Don't break existing functionality (blogs, scripts, approvals, Summit war room)
- API server is Express on port 8743
- Frontend fetches via fetch() — no build step, vanilla JS
- Test by opening `http://localhost:8743/index-v2.html`

### Definition of Done
- [x] Agents tab shows real live data for all 4 agents
- [x] Activity feed shows last 20 real events
- [x] Docs tab scans file system and shows all documents with search/filter
- [x] Calendar shows real cron schedule
- [x] All API endpoints working
- [x] No console errors
- [x] Existing tabs still work (Content, Summit, Intel Hub)

### When Done
1. Git add, commit: "Wire Mission Control V2 to real agent + document data"
2. Push to origin main
3. Update this file with completion notes

### Completion Notes — March 20, 2026

**Completed by Henry at 10:10 PM PST**

#### API Endpoints Added (api-server.js):
- `GET /api/agents/status` — Returns live status for Oliver, Henry, Thomas, Scout from filesystem (memory files, git log, content counts, research files)
- `GET /api/activity` — Returns last 50 activities from git commits + file creation timestamps across content/scripts/ and memory/research/
- `GET /api/schedule` — Returns real cron schedule (Oliver 7:00/7:15 AM, Scout 7:20-7:30 AM, Thomas every 4h, Oliver 9 PM rollup, Henry 10 PM nightly)
- Expanded `/api/docs` to scan thomas-reels (36), thomas-linkedin (14), thomas-shorts (13), thomas-twitter (13), brand-assets/materials — 164 total docs
- Added H1 title parsing and DRAFT/REVIEW/APPROVED status detection to doc scanner

#### Frontend Changes (index-v2.html):
- **Agents tab**: Replaced static cards with dynamic `loadAgents()` fetching from `/api/agents/status`. Shows real last-run timestamps, output summaries, task history, model info, and next scheduled run for each agent
- **Activity Feed**: Added `loadActivity()` showing last 20 real events (git commits + file creations) with agent attribution and timestamps
- **Calendar tab**: Updated CAL_TASKS to match real cron schedule — Oliver morning brief/Discord, Scout competitor/industry/thumbnail crons, Thomas 4h content batches, Oliver evening rollup, Henry nightly build
- **Docs tab**: Added 5 new category filter pills (Reels, LinkedIn, Shorts, Twitter, Brand) with color coding. Status tags (DRAFT/REVIEW/APPROVED) shown inline. Category icons and colors updated for all new types
- Fixed time slot parsing for 12 PM edge case in calendar

#### Tests:
- TypeScript check: PASS
- Vitest: 348/349 pass (1 pre-existing env var failure in deepgram.test.ts)
