# Demo Walkthrough — Korum + Benstock

**Purpose:** the script for the live demo. 5-minute and 15-minute
versions, what to say, what NOT to say, fallback paths.

**Audience:** Adrian (running the demo), Ian (assisting at Korum).

**Companion docs:**
- `docs/korum-sprint-readiness-checklist.md` — install-day checklist (May 1)
- `docs/benstock-demo-checklist.md` — Paragon Honda exec demo (May 5)
- `docs/deepgram-readiness.md` — verify before any live recording
- `docs/demo-seed.md` — the synthetic dataset behind the demo

---

## Pre-demo gates (do these every time)

Run through these in the 30 minutes before the demo. Any failure stops
the demo until resolved.

1. **App reachable.** `curl -i https://finico-pilot-mqskutaj.manus.space/api/health` → 200, `"status": "healthy"`.
2. **Login works.** Sign in as `adrian@asuragroup.com` in a fresh Chrome window.
3. **Demo tenant has data.** Open `/yesterday-recap` and `/eagle-eye`. If empty, run `pnpm exec tsx scripts/seed-load-test.ts --commit` against the dev DB OR navigate to `/demo-mode` (the in-app pre-recorded demo).
4. **Mic + Deepgram.** Open `/live-session`. Click Record. Speak "Testing one two three." Confirm transcript appears within 2s with speaker labels and timestamps. Confirm the `deepgram_status` badge is green. Stop the test recording.
5. **Internet fallback ready.** Hotspot phone with active data plan within reach.
6. **Backup browser.** Chrome is primary; Edge open as the backup.

If any of these fail, see §"Fallback if microphone or Deepgram fails" below.

---

## 5-minute demo (executive)

**Audience:** Brian Benstock, Jim Koch, or any DP who wants the gist
without the deep technical walkthrough. Speak in plain operator language.
No tech jargon.

**Goal:** end with the audience saying "OK what's the next step." Not "OK
let me think about it."

### Open (30 seconds)

> "F&I Co-Pilot turns the actual conversation between your F&I manager
> and your customer into coaching intelligence. Live. Every deal.
> Without your manager doing anything different on the desk."

(Don't claim PVR lift. Don't claim it replaces coaching. The hook is
already strong without those.)

### Live recording (90 seconds)

- Open `/live-session` with the audience watching.
- Click Record.
- Two-party consent modal appears. Walk through what the customer would
  see. Click **I Consent** on the manager's side. Have someone in the room
  read out the customer-side text and click **I Consent** on a second
  laptop, OR click both sides yourself if no second person is available
  ("on a real install, the customer reads and clicks on their own device or
  the same screen with manager rotation").
- Record 60–90 seconds of a simulated F&I open: "Marcus, welcome —
  congratulations on the new Tahoe…" Walk through reviewing numbers as
  statements (not questions) per the ASURA process.
- Stop the recording.

What the audience sees:
- Live transcript on the right pane with speaker labels.
- Compliance flags (e.g., privacy notice mention) firing as you speak the
  trigger phrases.
- A grade computed at the end.

### What it gives you (90 seconds)

Switch to `/eagle-eye`:

> "Every recorded session feeds the leaderboard. Overall score, PVR,
> products per deal, utilization rate. You see who's lifting and who's
> not, by week, by month, by store."

Switch to `/yesterday-recap`:

> "Every morning your DP and your managers see the same thing — what
> happened yesterday, where the wins were, where the gaps are, and three
> decisions to make today."

### Close (60 seconds)

> "Two things to know. One: every recording requires explicit two-party
> consent. We don't bypass it. Two: customer data is encrypted at rest,
> tenant-isolated at the query layer. We send the audio to Deepgram for
> transcription and to nobody else. The DPA is a one-pager, you'd review
> with counsel."

> "If you want this in your store, the install is one half-day. We bring
> the laptop, your managers bring their reps. The first week is a sprint
> with us on the floor. Second week, we're in the background."

CTA. Done.

---

## 15-minute demo (deeper)

**Audience:** F&I directors, in-the-weeds operators, anyone who's going to
be using the tool every day. They want to see the moving parts.

**Goal:** they understand what the tool does without you having to repeat
yourself, and they ask three or four operational questions you can answer
crisply.

### Open (1 minute)

Same hook as the 5-min. Add one more line:

> "The reason this is different from anything else you've seen: it's
> built on the actual ASURA process — the menu order, the survey, the
> seven steps. Not a generic AI. The grading rubric is the rubric I'd use
> coaching the manager myself."

### Section 1 — The live session (4 minutes)

Open `/live-session`. Walk through:

1. **The consent gate.** Show the modal. Explain RCW 9.73.030 (Washington
   two-party). Mention this fires for every recording regardless of
   state, because we don't want a manager forgetting they're recording
   in California.
2. **Recording starts.** Show the Deepgram badge. Say "this is server-
   side Deepgram Nova-2. The audio leaves your manager's browser, hits
   our server, hits Deepgram, and the transcript comes back. We don't
   keep the audio at Deepgram — they bill us by streaming minutes."
3. **Transcript live.** Show speaker labels filling in. Mention the
   speaker fingerprinting — the manager identifies their own voice via
   a 30-second baseline at first sign-in, and from then on every other
   voice is "customer."
4. **Compliance flags.** As you speak, watch flags fire (privacy
   notice, risk-based pricing, base payment disclosure). Mention each
   flag is a CFPB / TILA / state-law marker. Mention `compliance_flags.
   excerpt` is encrypted at rest.
5. **Suggestions.** Show how the copilot surfaces an objection-response
   tip when the customer says something like "I'll just put money aside
   for repairs."
6. **Stop and grade.** Click Stop. Wait 5–10 seconds for grading to
   complete. Show the score breakdown — rapport, presentation, objection
   handling, closing, compliance.

### Section 2 — The leaderboard (3 minutes)

Open `/eagle-eye`. Walk through:

- Per-manager scoreboard. Sort by overall score, by PVR, by PPD.
- Click into a manager. Show their session history, their improvement
  curve (if seeded data covers enough weeks).
- Mention coaching cadence — this is the 15-minute weekly meeting that
  is Pillar 4 of ASURA OPS. The leaderboard is what you use as the
  agenda for that meeting.

### Section 3 — The morning brief (2 minutes)

Open `/yesterday-recap`:

- The DP's morning view. Headline + stats + 3 today's-decisions.
- Mention this was Brian Benstock's #1 ask in the early sketches —
  "give me a one-glance read on what happened yesterday."

### Section 4 — Admin + onboarding (3 minutes)

Open `/admin/dealerships/:id/setup`:

- Show the 5-step wizard. Pricing model toggle (cost-plus vs fixed
  retail). Product menu. Compliance rules. DPA acceptance.
- Mention this is what a new dealer goes through on day 1. Either the
  DP self-serves OR a super-admin (Adrian) drives it for them via
  `/admin/dealerships`.

### Section 5 — Compliance + privacy (2 minutes)

Open `/compliance` (the public attestation page, no auth):

- "This is the page we link to in your customer-facing privacy policy.
  No login required. Anybody can see what we attest to."
- Walk through the bullets — encryption, two-party consent, data
  deletion, sub-processors.
- Mention the DPA. Reference `docs/legal/dpa-template-v1.md`. Mention
  it's a v1 — counsel-reviewed before counter-sign.

### Close (30 seconds)

Same close as 5-min. Slight variation:

> "What you just saw is what your managers will see Monday. One half-day
> install. First-week sprint. Second-week background. By week three you
> have a benchmark to coach against."

CTA.

---

## What to say — phrasings that land

- "F&I Co-Pilot is operator-led. It's not a gimmick AI tool. It's a
  coaching system that turns deal conversations into useable intelligence."
- "Every recording requires explicit two-party consent. We don't bypass it."
- "Customer data is encrypted at rest with AES-256-GCM."
- "We're tenant-isolated at the query layer — no path for another
  dealer's data to leak in."
- "Soft-delete in 24 hours, hard-delete on day 31, audit trail kept
  forever — that's the FTC Safeguards posture."
- "Sub-processors are Deepgram for transcription, Resend for email,
  Cloudflare for DNS. That's it."
- "Coaching cadence is the thing that makes the system stick. The tool
  shows you the gaps; the weekly 15-minute meeting closes them."

## What NOT to say — claims we can't ship

- "We have SOC 2." (We don't yet — Type 1 expected Q3 2026 per DPA §11.)
- "Audio never leaves Deepgram." (Browser fallback is a different
  sub-processor — see `docs/deepgram-readiness.md` and
  `docs/privacy-dpa-review.md`.)
- "We can recover deleted data." (After day 31, hard-delete is
  irreversible.)
- "Guaranteed PVR lift" or any specific dollar claim about what Korum
  or Paragon will hit. The lift comes out of the data, not from a
  prediction.
- "We replace coaching." (We're a coaching tool — coaching cadence is
  Pillar 4 of ASURA OPS and is the lever, not a feature.)
- "Production-ready enterprise scale" until we've done the load test
  past pilot scale.
- "Perfect transcription." (Diarization is good; not perfect. Acoustic
  conditions matter.)

---

## Fallback if microphone or Deepgram fails

If the live recording goes sideways during a demo:

### Option A — `/demo-mode` (built-in pre-recorded demo)

The app has a `/demo-mode` route (`client/src/pages/DemoMode.tsx`) that
plays a pre-baked transcript through the same UI components. No mic
required. No Deepgram required. The transcript is a 7-minute walkthrough
of the ASURA 7-step process with realistic objections and compliance
flags firing in sequence.

**Use this if:** mic permission is denied, Deepgram is unreachable, or
the venue's network is throttled.

How to pivot smoothly:
> "Since we're on the road and I don't want any audio quality
> uncertainty to distract us, I'm going to walk through the same flow
> but using a recording from a real ASURA training session. The
> components, the grading, the compliance flags — they all behave
> exactly the same."

Then click `/demo-mode`, click Play. Pause at key moments to discuss.

### Option B — Recorded session replay

Open any seeded session at `/sessions/:id`. The transcript, grade, and
flags are already populated. You can walk through them as if recapping a
recent session — which is exactly what a DP does in the morning brief
flow anyway.

Use this if: app is up but you don't want to risk a live recording at all.

### Option C — Reschedule

If the app itself is down (`/api/health` returns 503), don't try to fake
it. Apologize, reschedule, fix the underlying issue. A bad demo is worse
than no demo.

---

## Cleanup after the demo

- Stop any live recording you started during the demo. Sessions in
  `status="active"` should be flipped to `completed` or deleted.
- If you seeded fresh data on the dev box for the demo, decide: keep it
  for the next demo, or `--reset --commit` it.
- Note any UX friction in `memory/{date}.md` for the next morning's fixup.
- If a customer / DP asked a question you couldn't answer crisply, log
  it as an open item — that's the gap to close before the next demo.
