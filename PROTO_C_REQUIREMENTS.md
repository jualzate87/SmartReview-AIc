# Prototype C — AI Review System: Sequential Review Experience

## Overview

Prototype C is the next evolution of the AI-assisted tax return review system. The core insight from user research (Al-Nesha, Garrett sessions) is that CPAs want to complete **data accuracy first, insights second** — these are two distinct mental modes and they should not be blended.

The experience is broken into two explicit, sequential phases:

1. **Phase 1 — Import Accuracy Review** (source doc validation)
2. **Phase 2 — AI Diagnostic Review** (compliance, YoY, opportunities)

---

## Research Findings That Drive This Design

From Al-Nesha's session:
- "I don't want to blend import and also be trying to analyze it at the same time."
- "Import data clarity first, and then we could do insights."
- "I can't have any conversations until we make sure the data is good and in the right place."
- "I prefer having the source document on the left and the input fields on the right — that's more comfortable."
- She immediately clicked the "pop-out" / side-by-side view when offered. That is her preferred mode.
- She wanted a **guided, sequential flow** with a clear "Next" to move between items.
- She found the 1040 view distracting during Phase 1 — it should be minimized by default.
- The prior year 1040 tab is the least relevant during Phase 1 — move it to the end.

---

## Entry Point — Welcome / Orientation Screen

When a CPA enters the review experience, they land on a **welcome state** powered by Intuit Assist.

**Design:**
- Intuit Assist takes up a prominent portion of the screen (larger presence than current ProtoB)
- Friendly, guided tone — not just a list of flags
- Two-step process is clearly communicated upfront

**Intuit Assist welcome message:**
> "Welcome to your return review for Jessica Drake. We'll guide you through two steps:
>
> **Step 1 — Import accuracy:** Verify that all documents were read and imported correctly. We found [N] fields that need your attention.
>
> **Step 2 — AI diagnostics:** Once import is confirmed, we'll walk you through compliance flags, year-over-year changes, and planning opportunities.
>
> Ready to start?"

**CTA:** `Begin Step 1 →`

---

## Phase 1 — Import Accuracy Review

### Goal
CPA verifies that every flagged field from imported source documents is correct before moving on.

### Layout

**Default view (on enter):**
- Left panel: Source document image (same as ProtoA/B — keep exactly as-is, it works well)
- Right panel: Input fields with orange flags (same flag design as ProtoA — reuse as-is)
- 1040 panel: **Minimized by default** — collapsed with a button to expand
  - Label: `Show 1040 ↓` / `Hide 1040 ↑`
  - When expanded, slides in below or as a third panel
- Prior year 1040 tab: **Moved to last position** in the tab order — least relevant during Phase 1
- Detach / pop-out option: **Preserved** — same as current implementation

**Navigation:**
- Flagged fields have a **"Next issue →"** button that jumps to the next unresolved flag
- Progress indicator: `3 of 7 issues resolved` (not "items remaining" — avoid the word "items")
- Counter **never goes below 0**

### Flags in Phase 1

Use **exactly the same flags as ProtoA** — no changes, no new flags added here. These are the import/OCR confidence flags:
- Low confidence fields (72%, 85%)
- Fields not imported (Box 12, EIN, Box 2d collectibles, Box 3 nondividend)
- Missing required fields for e-filing

**Do NOT show in Phase 1:**
- Compliance diagnostics (estimated tax penalty, AMT, etc.)
- YoY discrepancies
- Advisory opportunities
- Anything that is an "insight" rather than an import error

### Resolving a flag

A flag is resolved when the CPA either:
1. **Edits the field value and saves** — automatically counts as verified, no additional checkbox needed
2. **Clicks "Mark as correct"** — confirms the imported value is right as-is

Both actions decrement the counter. Counter floor = 0.

When a flag is resolved in the source doc panel, it clears in the input panel too (and vice versa) — they stay in sync.

### Confidence display

**Remove the exact percentage** (72%, 85%). Replace with:
- A clear flag message: *"Wages may have been misread — verify Box 1"*
- Once verified/fixed, the flag clears. No percentage needed.

Al-Nesha's quote: *"If you don't think you read it with absolute accuracy, any other number you give me might as well be 1%, because we're gonna look regardless."*

### Completing Phase 1

When all flags are resolved (counter = 0):
- Completion state appears
- Intuit Assist message:
  > "Import accuracy confirmed. All flagged fields have been reviewed. Ready to move to Step 2?"
- CTA: `Continue to AI Diagnostics →`
- Option: `Review source docs again` (in case they want to go back)

---

## Phase 2 — AI Diagnostic Review

### Goal
CPA reviews compliance issues, YoY anomalies, and planning opportunities — now that data accuracy is confirmed.

### What appears here (NOT in Phase 1)

**Critical — blocks filing:**
- Balance due jump (line 37 YoY)
- Total tax rise (line 24 YoY)
- Federal withholding below safe harbor
- Estimated tax penalty — Form 2210

**Review Required:**
- Ordinary dividend surge (line 3b YoY)
- Confirm prior-year AGI matches imported 1040
- No estimated tax payments recorded (line 26)
- Net investment income tax — Form 8960 (NIIT)

**Silent (unflagged) — BuildSpec planted error #6:**
- Token Box 1b / line 3a qualified-dividend miscode stays in the return data but is **not** surfaced as a Phase 1 flag or Phase 2 diagnostic

**Opportunities:**
- Plan 2026 estimated payments (1040-ES)
- IRA deduction — confirm workplace plan coverage (W-2 Box 13)

**Do NOT show in Phase 2:**
- Import/OCR confidence flags — those are done
- Anything already resolved in Phase 1
- **State return / state filing diagnostics** — Jessica Drake is Austin TX; federal only per Loop 2 BuildSpec

### Layout

- Intuit Assist panel is prominent — this is the AI's home territory
- 1040 panel visible by default (this is when they need it for context)
- Source doc panel available but not primary
- Each diagnostic card has:
  - Title + severity badge
  - Clear explanation
  - **"See details"** → navigates to the correct screen (see routing rules below)
  - **"Add comment"** button (same as 1040 comment button in ProtoA)
  - **"Mark as reviewed"** button

### "See details" routing rules

This was a major pain point for Al-Nesha. Fix the destinations:

| Diagnostic | Correct destination |
|---|---|
| Estimated tax penalty (Form 2210) | Form 1040 — total payments / line 26 |
| NIIT (Form 8960) | Form 1040 — total income / investment lines |
| Prior-year AGI | Prior year 1040 tab |
| Withholding / dividends | 1099-DIV or W-2 source doc |
| Missing estimated payments | Form 1040 — line 26 |
| W-4 / 1040-ES planning | W-2 source doc |
| IRA deduction | W-2 Box 13 |

### Navigation

- Guided flow: each card has `Next →` to move to the next diagnostic
- Progress: `2 of 8 diagnostics reviewed`
- CPAs can jump to any card out of order — the guided flow is a suggestion, not a lock

### Completing Phase 2

When all diagnostics are reviewed:
- Completion state
- Intuit Assist:
  > "Review complete. All diagnostics have been addressed. This return is ready for your sign-off."
- CTA: `Mark return as reviewed`

---

## Counter / Progress Rules (Both Phases)

- Counter = number of **unresolved flagged issues** in the current phase
- Counter **never goes below 0**
- Editing + saving a flagged field = resolved (no extra checkmark required)
- Marking as correct = resolved
- Resolving in source doc panel = resolved in AI panel (synced)
- Only **flagged fields** affect the counter — non-flagged fields are invisible to the counter
- Phase 1 completion requires counter = 0 before Phase 2 unlocks

---

## Components to Reuse (No Changes Needed)

- Source document viewer (left panel) — ProtoA/B version, works well
- Input field panels (W-2, 1099-INT, 1099-DIV, etc.) — keep as-is
- Orange flag indicators on fields — keep exactly as ProtoA
- "Mark as correct" / "Edit" / "Save" / "Undo" pattern on flagged fields
- Detach / pop-out toggle
- Comment button (from 1040 panel in ProtoA)
- Badge design (critical / review required / opportunities)

---

## Components to Change

| Current | Change |
|---|---|
| "items remaining" label | → "issues to review" or "flags remaining" |
| Exact confidence % (72%, 85%) | → Plain language flag message only |
| "View W-2" / "View source" button | → "Fix in source" or "Verify & fix" |
| All flags in one mixed list | → Split: Phase 1 = import flags only, Phase 2 = diagnostics only |
| 1040 expanded by default | → Minimized by default in Phase 1 |
| Prior year 1040 tab first | → Prior year 1040 tab last |
| No welcome/orientation | → Intuit Assist welcome screen with two-step overview |
| No "Next" navigation | → "Next issue →" between flagged fields |
| Insights mixed with import errors | → Insights only appear in Phase 2 |

---

## Tech Stack & Patterns (Same as ProtoB)

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** CSS Modules (same pattern as ProtoA/B)
- **Design system:** Intuit Design System (IDS) tokens
- **State:** Local React state (no Redux/Zustand) — same custom context pattern
- **Data:** Mock data (Jessica Drake return) — same values as ProtoB
- **Repo:** Branch off `prototype-b/source-docs-plus-ai` as the starting point

---

## Key Files to Reference from ProtoB

| File | What it contains |
|---|---|
| `src/pages/DataReviewPage.tsx` | Main layout, tab routing, panel orchestration |
| `src/pages/data-review/AgentReportPane.tsx` | AI panel with flag cards (Phase 2 component) |
| `src/pages/data-review/DetailFields1099.tsx` | 1099-INT input fields with flags |
| `src/pages/data-review/DetailFieldsDiv.tsx` | 1099-DIV input fields with flags |
| `src/pages/data-review/FieldPopover.tsx` | Field-level flag popover |
| `src/styles/data-review/AgentReportPane.module.css` | AI panel styles |
| `src/styles/data-review/DetailFields.module.css` | Input field styles |

---

## Unflagged Error (Keep for Demo Purposes)

The **1099-INT discrepancy** ($3,486 in source doc vs. $1,986 on 1040 line 2b) remains **intentionally unflagged** in both phases. This is the planted error that Garrett uses to demonstrate that even with AI assistance, the CPA's judgment is still essential. It should not be added to either phase's flag list.

---

## Open Questions / To Decide

1. Should Phase 2 be accessible before Phase 1 is complete, or is it hard-locked until all import flags are resolved?
2. Should the welcome screen be skippable for returning users ("Skip intro")?
3. For the "Next issue →" navigation — does it jump to the next flag within the same document, or across all documents?
4. Does completing Phase 2 trigger a formal "sign-off" state, or just a reviewed badge?
