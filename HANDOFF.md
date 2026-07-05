# SmartReturn Prototype — Handoff Doc

> ⚠️ **WORKING DIRECTORY RULE — READ THIS FIRST**
>
> Always work in:  `/Users/agupta69/Desktop/ClaudeXFigma/SMARTRETURN/`
> NEVER work in:   `/Users/agupta69/Desktop/ClaudeXFigma/ids-starter/`
>
> `ids-starter` = IDS component template only. Do not touch.
> `SMARTRETURN`  = the SmartReturn prototype. All new work goes here.

---

> **Start every new session by reading this file.** Then read the specific page files listed in each screen entry before touching anything.

---

## Orientation

**Product:** ProConnect Tax — SmartReturn AI-assisted tax prep flow  
**Tech:** React + TypeScript + Vite + CSS Modules  
**UI Libraries:** `@ids-ts/*` (IDS), `@cgds/*` (CGDS), `@design-systems/icons`  
**Dev server:** `http://localhost:5174` (run `npm run dev`)  
**Router:** HashRouter → routes are `/#/path`  
**Repo:** `github.intuit.com/agupta69/SmartReturn-prototype` (branch: `main`)  
**Project root:** `/Users/agupta69/Desktop/ClaudeXFigma/SMARTRETURN/`

---

## Screen Inventory

| # | Screen Name | Route | Key Files | Status |
|---|-------------|-------|-----------|--------|
| 1 | SmartReturn (ready for review) | `/#/smart-return` | `SmartReturnPage.tsx`, `SmartReturnPage.module.css` | ✅ Done |
| 2 | Data Review (1040 + W-2 panel) | `/#/data-review` | `DataReviewPage.tsx`, `LeftPanel1040.tsx`, `ReviewTab.tsx`, `DocumentPreview.tsx`, `DetailFields.tsx` | ✅ Done |
| 2.5 | Agent Loading | (state inside DataReviewPage) | `AgentLoadingPane.tsx` | ✅ Done |
| 3 | Tax Prep Agent Report (redesigned) | (state inside DataReviewPage) | `AgentReportPane.tsx` | ✅ Done |
| 3.5 | Imported Documents expanded | (state inside AgentReportPane, `importedDocsExpanded=true`) | `AgentReportPane.tsx` | ✅ Done |
| 4 | YoY Analysis expanded (new design) | (state inside DataReviewPage, `yoyExpanded=true`) | `AgentReportPane.tsx`, `LeftPanel1040.tsx` | ✅ Done |
| 4.5 | YoY Detail pane (More info) | (overlay inside AgentReportPane, `yoyDetailOpen=true`) | `YoYDetailPane.tsx`, `YoYDetailPane.module.css` | ✅ Done |
| 5 | W-2 Detail (default state) | (state inside DataReviewPage, W-2 tab) | `DetailFields.tsx`, `LeftPanel1040.tsx` | ✅ Done |
| 6–8 | W-2 / 1099-INT / K-1 tabs | `/#/data-review` (tab switching) | `DetailFields1099.tsx`, `DetailFieldsK1.tsx`, `DocumentPreview.tsx` | ✅ Done |
| 33 | Check Return | `/#/check-return` | `CheckReturnPage.tsx`, `CheckReturnPage.module.css` | ✅ Done |
| 34 | Return Insights | `/#/check-return/insights` | `ReturnInsightsPage.tsx`, `ReturnInsightsPage.module.css` | ✅ Done |

**Popout route:** `/#/data-review-popout` → `DataReviewPopout.tsx` (W-2 doc + detail fields side by side in new window)

**Experiment branch:** `experiment/side-by-side-w2` — triple-column view (1040 | W-2 | Agent) triggered by "Review source and input" in YoY detail pane

---

## Architecture — How It All Fits

### Shell layout (all screens share)
- **`LeftNavPTO.tsx`** — ProConnect left nav (icons + labels, "Tax returns" item active). Uses Figma asset URLs for icons — **these expire every 7 days**. If icons look broken, re-fetch from Figma via `get_design_context` on the LeftNavPTO node.
- **`SmartReturnHeader.tsx`** — top tab bar (SmartReturn / Check return). Accepts `activeTab?: 'smartreturn' | 'checkreturns'` prop for highlighting. Tab clicks use `useNavigate`.

### DataReviewPage state machine
```
agentView: 'idle' → 'loading' → 'report' → 'closing' → 'idle'
```
- `idle`: normal 2-panel layout (left=1040, right=W2 preview+fields), width ratio controlled by drag handle
- `loading`: left panel expands to `agentLeftWidth`%, `AgentLoadingPane` fills right (Intuit Assist GIF, 5s timer)
- `report`: left `agentLeftWidth`% (draggable, min-width 400px for agent), `AgentReportPane` fills right
- `closing`: agent panel slides out (350ms), then snaps back to `idle`
- `yoyExpanded`: boolean — when true, pink highlight + CGDS "-15%" badge appear on 1040 line 1a
- `selectedField`: string | null — drives cross-document highlight between 1040 overlay and W-2 detail
- `agentLeftWidth`: number (default 62) — draggable split between 1040 and agent panel

**Entry via URL param:** `/#/data-review?agent=true` auto-triggers `agentView='loading'` on mount (used by SmartReturn "Review the return" button which opens this URL in a new tab).

### AgentReportPane sub-state
- `importedDocsExpanded`: boolean — expands the "Imported documents" card to show W-2/1099/K-1 doc list
- Clicking W-2s in imported docs → calls `onViewW2()` which closes agent and goes to W-2 tab
- `yoyDetailOpen` / `yoyDetailClosing`: boolean — shows `YoYDetailPane` overlay (slides in from right over agent)
- "More info" in YoY finding → opens `YoYDetailPane`
- "Back to overview" in YoYDetailPane → closes detail, returns to AgentReportPane

### YoYDetailPane (new)
- Absolute overlay inside `.panel`, slides in from right at 350ms
- Shows: finding title, tax impact banner, root cause, details table, suggested action, action buttons
- "Review source and input" → calls `onReviewSource()` (on experiment branch: triggers triple-view)
- "Mark as reviewed" → no-op (prototype only)

### Panel button behaviour
- Highlighted (`intuitIntelBtnActive`) when `activeTopTab === 'w2s'` AND `agentView === 'idle'`
- Click when agent open → closes agent; click when idle → opens agent

### Popout (DataReviewPopout)
- Route: `/#/data-review-popout`
- Layout: **side by side** — W-2 document preview (left 50%) + detail fields (right 50%)
- Window size: `900×1000` (from triple-view), `800×900` (from ReviewTab popout button)

### Experiment branch: triple-view (`experiment/side-by-side-w2`)
- Triggered by "Review source and input" in YoYDetailPane → `tripleView=true`
- Layout: 1040 (28%) | W-2 panel (draggable ~35%) | Agent panel (min 400px)
- Center panel popout button → opens W-2 in new window
- Close agent (✕) → exits triple-view, returns to 2-column idle state

### Cross-document highlighting
- `selectedField='wages'` → pink highlight appears on 1040 at `left:82.4%, top:56.9%`
- `SourcesToast` appears via `getBoundingClientRect` on `highlightRef` (fixed positioning)
- 1040 overlays use `container-type: inline-size` + `cqw` units so they scale with zoom

### Zoom on 1040 and W-2
- 1040: default 50% zoom, zoom controls in toolbar. Uses `ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5]`, `useState(0)` = 50%
- W-2 (DocumentPreview): same pattern, `useState(0)` = 50% default

---

## Critical Rules & Gotchas

### IDS Button goes green
Every page with IDS Buttons needs this useEffect:
```tsx
useEffect(() => {
  const el = document.documentElement
  el.setAttribute('data-theme', 'intuit')
  el.style.setProperty('--color-action-standard', '#205ea3')
  el.style.setProperty('--color-action-standard-hover', '#174d87')
  el.style.setProperty('--color-action-standard-active', '#174d87')
  return () => {
    el.style.removeProperty('--color-action-standard')
    // etc.
  }
}, [])
```
Without this, localStorage can save a non-intuit theme and buttons render green.

### Font family — exact string matters
```css
font-family: var(--font-name-body, 'Avenir Next forINTUIT', sans-serif);
```
`'AvenirNext forINTUIT'` (no space) breaks font rendering. Always use the token.

### Background color — page secondary
```css
background: var(--page\/background\/secondary, #f0f4f6);
```
The fallback `#f0f4f6` is correct. `#f4f5f8` and `#ffffff` are wrong for page backgrounds.

### CGDS Badge vs IDS Badge
- For colored status badges (e.g., attention/red "-15%"): use `@cgds/badge` with `status="attention"`
- For neutral counts/labels: `@ids-ts/badge` is fine

### IDS Button CSS import
Every file using `@ids-ts/button` needs:
```tsx
import '@ids-ts/button/dist/main.css'
```

### Figma asset URLs expire in 7 days
`LeftNavPTO.tsx` uses hardcoded Figma asset URLs (for nav icons). If they break, run `get_design_context` on the LeftNavPTO Figma node to get fresh URLs.

### `setSelectedField(null)` on mount
`DataReviewPage.tsx` has `useEffect(() => { setSelectedField(null) }, [])` to prevent HMR state bleed showing the pink highlight on initial load.

### `layoutSizingHorizontal/Vertical = 'FILL'` (Figma plugin only)
Must be set AFTER `parent.appendChild(child)`. Not relevant to app code but relevant if using `use_figma`.

---

## Key Design Tokens in Use

```css
/* Colors */
--color-action-standard: #205ea3          /* IDS blue */
--page\/background\/secondary: #f0f4f6    /* page bg */
--page\/background\/primary: #ffffff      /* card/panel bg */
--text\/primary: #21262a                  /* body text */

/* Typography */
--font-name-body: 'Avenir Next forINTUIT' /* always use token, not raw string */

/* Animation */
--duration-transform-fast: 350ms          /* panel slide in/out */
--duration-appear-emphasize-fast: 500ms   /* right panel slide-from-left */
--ease-appear-emphasize: ...              /* elastic overshoot on panel appear */
```

---

## CSS Animation Patterns

### Agent panel slide in (right → center)
```css
@keyframes panelSlideIn {
  from { opacity: 0; transform: translateX(100%); }
}
```

### Agent panel slide out (center → right)
```css
@keyframes panelSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(100%); }
}
.panelClosing { animation: panelSlideOut var(--duration-transform-fast, 350ms) ... }
```

### Right panel re-appear (left sweep with elastic)
```css
@keyframes rightPanelSlideFromLeft {
  from { opacity: 0; transform: translateX(-60px); box-shadow: -8px 0 24px rgba(0,0,0,0.15); }
}
.rightPanelFadeIn { animation: rightPanelSlideFromLeft var(--duration-appear-emphasize-fast, 500ms) ... }
```

---

## File Structure Quick Reference

```
src/
├── App.tsx                          ← Routes (add new routes here)
├── pages/
│   ├── SmartReturnPage.tsx          ← Screen 1
│   ├── SmartReturnHeader.tsx        ← Shared tab header
│   ├── CheckReturnPage.tsx          ← Screen 33
│   ├── ReturnInsightsPage.tsx       ← Screen 34
│   ├── DataReviewPage.tsx           ← Screen 2-8 orchestrator
│   ├── DataReviewPopout.tsx         ← Popout window (standalone)
│   └── data-review/
│       ├── LeftNavPTO.tsx           ← ProConnect left nav (shared)
│       ├── LeftPanel1040.tsx        ← 1040 PDF viewer with overlays
│       ├── ReviewTab.tsx            ← W-2 / 1099 / K-1 top tabs
│       ├── DocumentPreview.tsx      ← W-2 / 1099 / K-1 image viewer
│       ├── DetailFields.tsx         ← W-2 editable field rows
│       ├── DetailFields1099.tsx     ← 1099-INT field rows
│       ├── DetailFieldsK1.tsx       ← K-1 field rows
│       ├── AgentLoadingPane.tsx     ← Loading screen (Intuit Assist GIF)
│       ├── AgentReportPane.tsx      ← Tax Prep Agent report panel (redesigned)
│       ├── YoYDetailPane.tsx        ← YoY detail overlay (More info screen)
│       ├── SourcesToast.tsx         ← Hover toast on 1040 pink highlight
│       └── SubTab.tsx               ← Bing Equipment / Tech Circle sub-tabs
├── styles/
│   ├── SmartReturnPage.module.css
│   ├── CheckReturnPage.module.css
│   ├── ReturnInsightsPage.module.css
│   └── data-review/
│       ├── DataReviewPage.module.css
│       ├── AgentReportPane.module.css
│       ├── YoYDetailPane.module.css ← NEW
│       ├── AgentLoadingPane.module.css
│       ├── LeftPanel1040.module.css
│       ├── DocumentPreview.module.css
│       ├── DetailFields.module.css
│       ├── ReviewTab.module.css
│       ├── DragHandle.module.css
│       └── SourcesToast.module.css
└── assets/
    ├── w2-bing-equipment.png
    ├── w2-tech-circle.png
    ├── 1099-int-megabank.png
    ├── k1-easy-money.png
    ├── intuit-assist-loading.gif
    └── icons/
        └── intuit-assist.svg
```

---

## What's Left / Potential Next Steps

### Figma assets that expire in 7 days
- `AgentReportPane.tsx` — Figma icon assets for YoY/Scanner/FedTaxes/Credits/AutoFill/ViewSources. Re-fetch from node `29113:62676` if broken.
- `YoYDetailPane.tsx` — dot asset from node `29985:91127`.
- `LeftNavPTO.tsx` — nav icons from Figma node.

### Possible next screens
- **Scan quality & inputs** — expand that card in the agent panel (Figma node exists, not yet built)
- **IRS Compliance / Credits & deductions** — expand those cards similarly
- **"Mark as reviewed" flow** — what happens after marking YoY as reviewed
- **Check Return deeper** — Federal Tax Summary rows expandable, California Tax Summary
- **Return Insights scroll** — verify Figma asset URL is current (7-day expiry)
- **Triple-view experiment** — merge `experiment/side-by-side-w2` into main if approved

**Ask the user** what screen to build next and get the Figma URL before starting anything.

### Branch status
- `main` — stable, all agent pane redesign committed
- `experiment/side-by-side-w2` — triple-column layout experiment (1040 | W-2 | Agent)

---

## How to Start a New Session

1. Read this file (`HANDOFF.md`)
2. Ask user: "Which screen are we working on next? Share the Figma URL."
3. Run `get_design_context` on the Figma node — always before building
4. Check if any IDS/CGDS components are needed that aren't already imported
5. Build, then visually verify with preview screenshot
6. Commit when done

**Never assume colors, spacing, or font weights. Always get Figma design context first.**
