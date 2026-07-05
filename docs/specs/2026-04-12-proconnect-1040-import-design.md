# ProConnect Tax — 1040 Import Onboarding Prototype
**Spec date:** 2026-04-12  
**Figma source:** [SmartReturn E2E Flow - Awards](https://www.figma.com/design/3ToO2K3EEVRCyNXrUOi0Kb/SmartReturn?node-id=29298-135403)  
**Figma screens:** 4–10 (node IDs: 29298:135937 through 29298:136299 + 29298:136100)  
**Audience:** Leadership demo, Red Dot Award and industry design awards  
**Quality bar:** Production fidelity — no placeholder icons, no approximate colors, no unverified tokens

---

## 1. Purpose

Build a working, clickable prototype of the ProConnect Tax 1040 Import Onboarding flow. A tax preparer uploads a prior-year 1040, the system extracts client data using Intuit AI, the preparer reviews and confirms, and a new return is created. The prototype must look and feel indistinguishable from the real product for demo purposes.

---

## 2. Scope — Screens 4–10

| Screen # | Figma Node | Title | Description |
|----------|------------|-------|-------------|
| 4 | 29298:135937 | Upload a 1040 return | Empty upload zone, two options, tax year dropdown |
| 5 | 29298:136100 | Upload — file attached | Drag zone changes to active/dropped state |
| 6 | 29298:135977 | Review personal information | Split view: PDF left, extracted data right, Client info tab active |
| 7 | 29298:136133 | Prior year information | Same split view, Prior year tab active |
| 8 | 29298:136271 | Creating new return (empty) | All steps complete, loading spinner, minimal UI |
| 9 | 29298:136280 | Creating new return (active) | Blue spinner variant, scrollbar visible |
| 10 | 29298:136299 | Client and return created | Success state, two CTAs |

**Out of scope for this sprint:** Screens 1–3 (Create return modal), Screens 11–35 (SmartReturn workspace). These are Phase 2.

---

## 3. UI Shell — Trowser

The trowser (`@ids-ts/trowser`) is the outermost container. Every screen 4–10 lives inside it.

### Structure
```
┌─────────────────────────────────────────────────────┐
│ Header: Title (left)   Feedback link + × (right)    │
├─────────────────────────────────────────────────────│
│ Step flow (5 steps, below header)                   │
├─────────────────────────────────────────────────────│
│                                                     │
│  Scrollable content area                            │
│                                                     │
├─────────────────────────────────────────────────────│
│ Footer: Cancel (left)         Next / CTA (right)    │
└─────────────────────────────────────────────────────┘
```

### Titles per screen
- Screens 4–5: "Onboard new clients with 1040 import"
- Screens 6–7: "Create a new client and return from a 1040."
- Screens 8–10: "Onboard new clients with 1040 import"

### Footer buttons per screen
| Screen | Left | Right |
|--------|------|-------|
| 4 | — | Next (always enabled) |
| 5 | — | Next (always enabled) |
| 6 | Cancel | Next |
| 7 | Cancel | Next |
| 8 | — | — (hidden during loading) |
| 9 | Cancel | Next (visible but passive) |
| 10 | Cancel | View client profile + Open return |

### Header extras
- "Feedback" link with feedback icon — appears screens 4–7, 10
- "×" close button — all screens

**Token checks required before build:**
- Background color of trowser content area
- Footer background (dark/charcoal on screens 1–3 vs light on 4–10 — verify)
- Header border separator color

---

## 4. Step Flow Component

Uses `@ids-ts/step-flow`. Appears on all screens 4–10, directly below the trowser header.

### Steps
1. Upload file
2. General information
3. Other information
4. Client details
5. Create return

### States per screen
| Screen | Step 1 | Step 2 | Step 3 | Step 4 | Step 5 |
|--------|--------|--------|--------|--------|--------|
| 4 | Active | Upcoming | Upcoming | Upcoming | Upcoming |
| 5 | Active | Upcoming | Upcoming | Upcoming | Upcoming |
| 6 | Complete | Active | Upcoming | Upcoming | Upcoming |
| 7 | Complete | Complete | Upcoming | Upcoming | Upcoming |
| 8 | Complete | Complete | Complete | Complete | Complete |
| 9 | Complete | Complete | Complete | Complete | Complete |
| 10 | Complete | Complete | Complete | Complete | Complete |

**Color flag:** The completed step dots appear teal/green in the Figma design. This may be `--color-success` or a specific IDS token. **Must verify against IDS token file before building — do not hardcode.**

---

## 5. Screen-by-Screen Content Spec

### Screen 4 — Upload a 1040 return

**Content area layout (centered, max-width ~600px):**
1. **Info banner** — dismissible, with AI sparkle icon on left
   - Heading: "Import a 1040 to enable automated onboarding"
   - Body: "Once you import the 1040, you can have Intuit AI draft a client data request and return summary."
   - Close (×) on right
2. **Body copy** (center aligned): "Use one of our accepted file formats: .jpeg, .jpg, .png, or .pdf."
3. **Upload zone** — dashed border container, two option rows:
   - Row 1: Upload icon + "Upload from this device" (bold) + "Browse and select documents to upload"
   - Row 2: Cloud icon + "Get from cloud apps" + "Connect a cloud account to import"
   - Horizontal divider between rows
4. **Tax year dropdown** — label: "Select the Tax year for this file?", value: "2024"
5. **Link** — "Learn how to Import a 1040" (below dropdown, centered)

**Validation behavior:**
- Next button is **always enabled** (never disabled)
- If user clicks Next without uploading a file, show a `@ids-ts/page-message` error at the top of the content area
- Error message: "Please upload a file before continuing."
- Error dismisses when a file is successfully attached

**Icon flags for Screen 4:**
- AI sparkle icon (banner) — ⚠️ VERIFY in `@design-systems/icons`
- Upload from device icon — ⚠️ VERIFY
- Get from cloud apps icon — ⚠️ VERIFY

---

### Screen 5 — File attached state

Same as Screen 4 with these changes:
- Upload zone transforms to: centered upload icon, "Upload to \<Product\>", "Drag and drop anywhere in this zone"
- File chip appears top-right of zone: "JW-1040-2024.pdf" with PDF icon and blue background
- Two option rows are hidden
- Body copy ("Use one of our accepted...") is hidden

**Icon flags for Screen 5:**
- PDF file chip icon — ⚠️ VERIFY

---

### Screen 6 — Review personal information

**Two-column layout (split view):**

**Left column (~50% width):**
- File header bar: "W2 Michael Yan.pdf" + "W2 - Uploaded Feb 8" + ⋮ menu icon
- PDF document viewer (rendered image of the 1040 form)
- Zoom in / Zoom out controls (bottom of viewer)

**Right column (~50% width):**
- Section heading: "Review personal information"
- Tab bar: "Client information" | "Dependents" | "Misc info / Direct deposit"
- Toggle: "All fields" | "Matched fields" (Matched fields active = filled blue)
- Section: "Taxpayer"
- Form fields (read-only display style):
  - Name: Testee Summary
  - SSN: 534-02-8622
  - Marital status: Married
  - Filing status: MFJ
  - Occupation: Nutritionist
  - Home address: 151 Franklin Street | Chicago | IL | 60606
- Section: "Spouse information"
  - Spouse name: James Summaary
  - Spouse SSN: 872-33-9461
  - Occupation: VP Controller
  - Address (field below)

**Icon flags for Screen 6:**
- ⋮ kebab/overflow menu icon — ⚠️ VERIFY
- Zoom in / Zoom out icons — ⚠️ VERIFY

---

### Screen 7 — Prior year information

Same split-view layout as Screen 6. Right panel changes:
- Section heading: "Prior year information"
- Toggle: "All fields" | "Matched fields" (same)
- Section: "Prior year summary (For comparison)"
- Read-only fields with dollar values:
  - Total wages: $214,237
  - Tax-exempt interest: $100
  - Taxable interest: $61
  - Qualified dividends: $611
  - Ordinary dividends: $1,239
  - IRA Distributions: $6,197
  - Taxable IRA distributions: $197
  - Pensions and annuities: $197
  - Taxable pensions and annuities: $197
  - Social security benefits: $197
  - Taxable social security benefits: $197
  - Capital gain or loss: $197

No new icon flags beyond Screen 6.

---

### Screen 8 — Creating new return (transition/empty)

**Content area:**
- Step flow: all 5 steps complete (all teal)
- Centered vertically: IDS indeterminate loader (light/empty ring variant)
- Body copy below loader: "Creating new return..."

**No footer buttons visible.**

**Color flag:** Loader ring appears as a light grey outline. Verify this is `@ids-ts/indeterminate` default state.

---

### Screen 9 — Creating new return (active/blue)

Same as Screen 8 with:
- Loader ring changes to active blue spinning state
- Scrollbar visible on right edge of content area (subtle)
- Footer: Cancel (left) + Next (right, passive)

---

### Screen 10 — Client and return created

**Content area (centered):**
- Large success icon — green filled circle with white checkmark
- Heading: "Client and return created"
- Body: "Jordan Wells' 1040 return for Tax Year 2025 is set up and ready to go."
- CTA button: "Start automated onboarding" with AI sparkle icon (outlined button style)
- Sub-copy (italic): "Intuit AI is ready to draft a client data request and return summary using last year's info."

**Footer:**
- Left: Cancel
- Right: "View client profile" (secondary) + "Open return" (primary)

**Icon flags for Screen 10:**
- AI sparkle icon on CTA button — ⚠️ VERIFY (same as screen 4 banner icon)
- Green checkmark success icon — ⚠️ VERIFY if this is an IDS icon or a custom illustration

---

## 6. Icon Pre-Flight Checklist

Before building any screen, verify each of these icons exists in `@design-systems/icons`. Flag any that are missing — user will supply SVG.

| Icon | Used in | Status |
|------|---------|--------|
| AI sparkle / asterisk | Screen 4 banner, Screen 10 CTA | ⚠️ UNVERIFIED |
| Upload from device | Screen 4 upload zone | ⚠️ UNVERIFIED |
| Get from cloud apps | Screen 4 upload zone | ⚠️ UNVERIFIED |
| PDF file chip | Screen 5 file attached | ⚠️ UNVERIFIED |
| Kebab/overflow menu (⋮) | Screen 6 file header | ⚠️ UNVERIFIED |
| Zoom in / Zoom out | Screen 6 PDF viewer | ⚠️ UNVERIFIED |
| Feedback icon | Trowser header | ⚠️ UNVERIFIED |
| Success checkmark (green circle) | Screen 10 | ⚠️ UNVERIFIED |

---

## 7. Token Pre-Flight Checklist

Verify these before building. No hardcoded values.

| Visual | Where used | Token to verify |
|--------|-----------|-----------------|
| Teal/green completed step dots | Step flow | `--color-success-*` or step-flow internal token |
| Info banner border/background | Screen 4 | `--color-info-*` family |
| Dashed upload zone border | Screens 4–5 | border token + dash style |
| Blue "Matched fields" toggle | Screens 6–7 | segmented-button or chip token |
| Dark footer bar | Footer | `--color-surface-*` or layout token |
| Active file chip (blue) | Screen 5 | `--color-primary-*` |
| Green success circle | Screen 10 | `--color-success-*` |

---

## 8. Build Order (Strict Sequence)

Each stage is a separate session. Do not start the next stage until the current one is visually approved.

```
Stage 1  →  Trowser shell (empty — header, step flow placeholder, footer)
Stage 2  →  Step flow component wired into shell, all 5 states verified
Stage 3  →  Screen 4 content (upload zone, banner, dropdown, link)
Stage 4  →  Screen 5 state variation (file attached)
Stage 5a →  Screen 6 — left column only (PDF viewer panel)
Stage 5b →  Screen 6 — right column (tabs, toggle, form fields)
Stage 6  →  Screen 7 (prior year data — right column swap)
Stage 7  →  Screens 8–9 (loading states)
Stage 8  →  Screen 10 (success state)
Stage 9  →  Interactions and transitions (click-through navigation)
```

---

## 9. Interaction Model

Navigation is linear: Next advances the step, Back/Cancel exits or regresses.

| From | Action | To |
|------|--------|----|
| Screen 4 | Next (file selected) | Screen 5 → Screen 6 |
| Screen 5 | Next | Screen 6 |
| Screen 6 | Next | Screen 7 |
| Screen 7 | Next | Screen 8 → Screen 9 (auto-transition) |
| Screen 9 | Auto-complete | Screen 10 |
| Screen 10 | "Open return" | End of prototype (placeholder) |
| Any screen | Cancel / × | Close trowser (End of prototype) |

Transitions (Stage 9 only — not before):
- Next button → cross-fade or slide
- Screen 8 → 9 → auto-transition (timed, ~1.5s)
- Loading spinner → fade to success on Screen 10

---

## 10. File Structure

New files to create in the ids-starter project:

```
src/pages/
  OnboardingImportPage.tsx       ← Trowser wrapper + router for screens 4–10
  import/
    UploadStep.tsx               ← Screen 4 + 5
    ReviewPersonalStep.tsx       ← Screen 6
    PriorYearStep.tsx            ← Screen 7
    CreatingReturnStep.tsx       ← Screens 8 + 9
    SuccessStep.tsx              ← Screen 10

src/styles/
  OnboardingImportPage.module.css
  import/
    UploadStep.module.css
    ReviewStep.module.css
    CreatingReturnStep.module.css
    SuccessStep.module.css

src/assets/icons/               ← SVGs provided by designer go here
  (ai-sparkle.svg, etc.)
```

---

## 11. What We Are NOT Building

To keep scope clean and quality high:

- No real PDF rendering — use a static screenshot image of the 1040 form
- No real file upload API — simulate state change on drop
- No backend data — all field values are hardcoded from the Figma
- No SmartReturn workspace (screens 19–35) — Phase 2
- No Create Return modal (screens 1–3) — Phase 2
