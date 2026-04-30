# Benstock Demo Checklist — F&I Co-Pilot

**Demo target:** Brian Benstock, Paragon Honda. NADA-visible, category-
validating. **Demo date:** Monday May 5, 2026.

**Purpose:** make the product feel real, controlled, and credible. This
is not a feature pitch — it's a demonstration that an actual operator
system exists and works.

**Companion docs:**
- `docs/demo-walkthrough-korum-benstock.md` — full demo script (5-min + 15-min versions)
- `docs/deepgram-readiness.md` — verify before demo
- `docs/privacy-dpa-review.md` — answers to legal/privacy questions
- `docs/korum-sprint-readiness-checklist.md` — what we just shipped at Korum (May 1)

---

## Positioning (read once before the demo)

This is **not** a gimmick AI tool.

This **is** an F&I coaching/operator system that turns live deal
conversations into useable coaching intelligence. The hook is the
operator system, not the AI.

Brian has heard a hundred AI pitches. He has not heard a "we built the
ASURA process into software" pitch. Lead with that, not with the model
name.

## What it solves

- DPs see what's happening on the F&I desk in near-real-time, not three
  weeks later in a CSV.
- Managers get coaching feedback grounded in their actual conversation,
  not a hypothetical script.
- Compliance flags fire as the conversation happens, not in a quarterly
  audit.
- The 15-minute weekly coaching meeting (ASURA OPS Pillar 4) has a
  data-backed agenda instead of a vibes-based agenda.

## What to show first

Open with **`/yesterday-recap`**, not `/live-session`.

Reason: Brian asked for the morning brief in early sketches. Showing
him his own ask — implemented — earns trust before you start asking him
to imagine a live recording. The 5-minute demo in
`docs/demo-walkthrough-korum-benstock.md` reorders to put `/yesterday-
recap` first if you decide on the spot.

Then `/eagle-eye` (leaderboard).

Then `/live-session` (the live recording moment) — this is the closer.

## What NOT to over-explain

- Don't walk Brian through the OAuth handshake. It works.
- Don't open the schema. He doesn't care.
- Don't read the DPA verbatim. Reference it; let counsel review.
- Don't show the seeded test data unless Brian asks. The cleaner demo is
  to show real-shape data without exposing the synthetic deal numbers.
- Don't deep-dive Deepgram unless he asks. "Server-side transcription,
  Nova-2, US sub-processor" is enough.

## Hard rules — claims we will NOT make

- "Guaranteed PVR lift." We don't predict; we measure. Cite the $759 avg
  PVR lift across the 200 stores Adrian has coached in person — that's
  the precedent for the model, not a guarantee for the platform.
- "Compliance approval." The system has compliance flags and an audit
  trail; it has not been approved by any compliance authority.
- "Full replacement of coaching." It's a coaching tool, not a coach.
  Coaching cadence is Pillar 4 — the human lever.
- "Perfect transcription." Diarization is good. Not perfect. Acoustic
  conditions matter.
- "SOC 2 attested." We don't have SOC 2 yet. Type 1 expected Q3 2026
  per DPA §11.
- "Production-ready enterprise scale." Pilot scale is 2 dealers right
  now. Don't pretend it's 200.

## 5-minute executive demo — opening lines

Adrian's voice. First-person. No preamble.

> "Brian, three minutes of context, then we record live. F&I Co-Pilot
> is the ASURA process — the menu order, the survey, the seven steps —
> built into software. Every deal becomes coaching intelligence,
> automatically, the moment the conversation happens. I want to show
> you what your morning brief would look like, what your leaderboard
> would look like, and then we record a 60-second live and you see the
> grading run. Sound good?"

Then go straight to `/yesterday-recap`. Then `/eagle-eye`. Then
`/live-session`. (Full script in `docs/demo-walkthrough-korum-benstock.md`
§ "5-minute demo (executive)".)

## 15-minute deeper demo — ordering

Same opening. Then:

1. `/yesterday-recap` — the morning brief (Brian's #1 ask)
2. `/eagle-eye` — leaderboard, click into one manager
3. `/live-session` — record 60–90 seconds, show flags + grade
4. `/admin/dealerships/:id/setup` — show the onboarding wizard (this is
   what a new dealer goes through on day 1)
5. `/compliance` — public attestation page (this is what links from the
   dealer's customer-facing privacy policy)

(Full script in `docs/demo-walkthrough-korum-benstock.md` § "15-minute
demo (deeper)".)

## Questions Brian may ask — and crisp answers

**Q. "How does this play with my existing CRM?"**
A. We don't replace it. F&I Co-Pilot reads from StoneEagle nightly for
deal records. Your DMS / CRM stays the system of record. We're a layer
on top, not a replacement.

**Q. "What's the install time?"**
A. Half-day on-site, two-week sprint with us in the room, then we're in
the background. Korum installed Thursday May 1; Paragon would install on
your timeline.

**Q. "What about consent? I can't have my managers recording without
attestation."**
A. Two-party consent gate is mandatory and built in. Every recording
requires the customer to actively click "I consent" on a separate
attestation. No bypass. RCW 9.73.030 is what we built to; California
PC §632 is also covered.

**Q. "What happens if the customer wants their data deleted?"**
A. There's an in-app deletion request flow. Soft-delete in 24 hours,
hard-delete on day 31, audit trail kept forever. The 30-day window
gives the customer a chance to cancel; the audit trail satisfies FTC
Safeguards. Daily cron handles the hard-delete sweep.

**Q. "Where does the audio go?"**
A. To Deepgram for transcription. Deepgram is a US-based sub-processor,
listed in the DPA. Audio is encrypted in transit, encrypted at rest in
our DB. Deepgram does not retain audio server-side under their default
contract.

**Q. "What if Deepgram is down?"**
A. The system falls back to the browser's built-in transcription. Quality
drops noticeably — speaker labels, smart formatting, finalization speed.
We surface that fallback in the UI so the manager knows. For a real
install, we run a daily Deepgram smoke before the morning briefs.

**Q. "How do I know my data is isolated from other dealers'?"**
A. Tenant isolation is enforced at the query layer — every read and
write filters on `dealershipId`. We have a 107-test suite specifically
for cross-tenant isolation that runs on every commit. Cross-tenant
access is impossible at the query level by construction.

**Q. "What are the licensing fees?"**
A. (Adrian's call. Don't pre-negotiate. "Pricing depends on store count
and is structured around the coaching engagement, not per-seat. Let's
walk that after you see if the tool fits.")

**Q. "Is this used by anyone else?"**
A. We're piloting with Korum Automotive Group in Puyallup, WA — Jim
Koch's group, 7 F&I managers. They installed Thursday May 1. Paragon
would be the second pilot dealer.

**Q. "Can my DPs see other dealers' data?"**
A. No. Their account is scoped to their own dealership(s). Super-admin
(Adrian) can see across tenants for support purposes, and every
super-admin read is audit-logged.

**Q. "What's the SOC 2 status?"**
A. Type 1 attestation is in progress, expected Q3 2026. We're not
attested today; the DPA says exactly that.

**Q. "Can I see the compliance flag rules?"**
A. Yes. They're in `/admin/compliance-rules`. Each flag is a CFPB / TILA
/ state-law marker. Dealer-specific rules can be added on top of the
default set.

## Fallback if transcription fails mid-demo

If `/live-session` errors out or Deepgram won't connect:

> "Since I want to control the audio quality for what we're showing,
> let me walk you through using a recording from a real coaching session
> instead — the components and grading work identically."

Then pivot to `/demo-mode` (built-in pre-recorded demo). Continue from
there. Full fallback procedure in `docs/demo-walkthrough-korum-benstock.md`
§ "Fallback if microphone or Deepgram fails".

## Suggested CTA after demo

Don't pre-script which CTA to use; read Brian's energy. Three options
stacked from low-commit to high-commit:

1. **Send the DPA + a follow-up email** with the demo recap. Low-commit;
   gives Brian time. Use this if he's reading "interested but not ready
   to decide."
2. **Schedule a 30-minute call with Adrian + Brian's CFO** to walk the
   pricing structure. Mid-commit. Use this if he's leaning yes and the
   blocker is internal.
3. **Schedule a half-day Paragon install** for a date 2-3 weeks out.
   High-commit. Use this if he's saying yes in the room.

Adrian decides on the spot which one to land on.

## Pre-demo readiness gates

Run these in the 60 minutes before the demo:

- [ ] `curl -i https://finico-pilot-mqskutaj.manus.space/api/health` → 200
- [ ] Login works at `https://finico-pilot-mqskutaj.manus.space/login`
- [ ] `/yesterday-recap`, `/eagle-eye`, `/live-session`, `/compliance` all load
- [ ] Demo tenant has at least 14 days of seeded data (`SELECT COUNT(*) FROM sessions WHERE dealNumber LIKE 'T%-D%'` returns >50)
- [ ] Mic test in `/live-session` — server-side Deepgram badge green, transcript appears within 2s
- [ ] `/demo-mode` loads cleanly as the fallback — verify the pre-recorded transcript plays
- [ ] Hotspot phone with active data plan in the bag
- [ ] Backup browser (Edge) open and signed in
- [ ] Korum install (May 1) report ready to reference if Brian asks "what's the precedent"

## Post-demo log

Within 1 hour of the demo, log to `memory/2026-05-05.md`:

- What landed strongest (which screen got the most engagement)
- What confused Brian (questions you couldn't answer crisply)
- What he asked for that doesn't exist yet (feature requests — flag for backlog)
- Which CTA you landed on
- Next-step commitment + due date
