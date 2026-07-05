# ProConnect Tax — 1040 Import Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a clickable, production-fidelity prototype of the ProConnect Tax 1040 Import Onboarding flow (screens 4–10) using IDS components and tokens — suitable for leadership demo and awards submission.

**Architecture:** A standalone page (`/import`) renders a Trowser that manages step state (0–6). Each step is its own component — the Trowser passes `currentStep` and `onNext` down. No backend, no real file upload — all state is local React, all data is hardcoded from the Figma.

**Tech Stack:** React 18 + TypeScript, `@ids-ts/*` IDS components, `@design-systems/icons`, CSS Modules with IDS design tokens, React Router (HashRouter already configured in App.tsx)

---

## Pre-Flight: Icon Verification

**Do this before Task 1.** Run icon search before any code is written.

The IDS icon search tool is at https://icons.app.intuit.com/search

Icons needed and their likely IDS names to search:

| Icon | Likely IDS name to search | Verdict |
|------|--------------------------|---------|
| AI sparkle / asterisk | `IntuitAssist`, `Sparkle`, `AiSparkle` | ⚠️ Search first |
| Upload from device | `Upload`, `UploadFile` | ⚠️ Search first |
| Get from cloud apps | `CloudUpload`, `Cloud` | ⚠️ Search first |
| PDF file chip | `Document`, `FilePdf`, `Pdf` | ⚠️ Search first |
| Kebab/overflow menu (⋮) | `MoreVertical`, `Overflow`, `Kebab` | ⚠️ Search first |
| Zoom in / Zoom out | `ZoomIn`, `ZoomOut`, `MagnifyingGlass` | ⚠️ Search first |
| Feedback | `Feedback`, `MessageSquare` | ⚠️ Search first |
| Success checkmark circle | `CheckCircle`, `CheckmarkCircle` | ⚠️ Search first |

**If any icon is NOT found:** Stop, flag it to the designer, wait for SVG. Place received SVGs in `src/assets/icons/`. Use `<img src={iconSvg} />` as a temporary wrapper only — documented clearly as a deviation.

---

## File Map

```
ids-starter/src/
├── App.tsx                                  MODIFY — add /import route
├── pages/
│   └── ImportPage.tsx                       CREATE — trowser shell + step router
├── pages/import/
│   ├── UploadStep.tsx                       CREATE — screens 4 + 5
│   ├── ReviewPersonalStep.tsx               CREATE — screen 6
│   ├── PriorYearStep.tsx                    CREATE — screen 7
│   ├── CreatingReturnStep.tsx               CREATE — screens 8 + 9
│   └── SuccessStep.tsx                      CREATE — screen 10
├── styles/
│   └── ImportPage.module.css                CREATE — trowser shell styles
├── styles/import/
│   ├── UploadStep.module.css                CREATE
│   ├── ReviewStep.module.css                CREATE — shared by screens 6+7
│   ├── CreatingReturnStep.module.css        CREATE
│   └── SuccessStep.module.css               CREATE
└── assets/icons/                            CREATE dir — designer SVGs go here
```

---

## Task 1: Route + Empty Trowser Shell

**Files:**
- Create: `src/pages/ImportPage.tsx`
- Create: `src/styles/ImportPage.module.css`
- Modify: `src/App.tsx`

**Goal:** Navigate to `/#/import` and see an open Trowser with a title, close button, and dark footer with Cancel + Next buttons. No content yet.

- [ ] **Step 1: Create the CSS module**

Create `src/styles/ImportPage.module.css`:

```css
.contentArea {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-container-padding-large);
  gap: var(--space-row-gap-large);
  min-height: 100%;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--space-container-padding-medium) var(--space-container-padding-large);
  background: var(--color-container-background-inverse);
  border-top: 1px solid var(--color-container-border-primary);
}

.footerRight {
  display: flex;
  gap: var(--space-component-gap-small);
}
```

- [ ] **Step 2: Create ImportPage with empty Trowser**

Create `src/pages/ImportPage.tsx`:

```tsx
import Trowser from '@ids-ts/trowser'
import '@ids-ts/trowser/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../styles/ImportPage.module.css'

const STEP_TITLES: Record<number, string> = {
  0: 'Onboard new clients with 1040 import',
  1: 'Onboard new clients with 1040 import',
  2: 'Create a new client and return from a 1040.',
  3: 'Create a new client and return from a 1040.',
  4: 'Onboard new clients with 1040 import',
  5: 'Onboard new clients with 1040 import',
  6: 'Onboard new clients with 1040 import',
}

export default function ImportPage() {
  const currentStep = 0

  return (
    <Trowser
      open={true}
      title={STEP_TITLES[currentStep]}
      dismissible
      onClose={() => {}}
    >
      <div className={styles.contentArea}>
        {/* Step content will go here */}
      </div>
      <div className={styles.footer}>
        <Button priority="tertiary" onClick={() => {}}>Cancel</Button>
        <div className={styles.footerRight}>
          <Button priority="primary" onClick={() => {}}>Next</Button>
        </div>
      </div>
    </Trowser>
  )
}
```

- [ ] **Step 3: Wire the route in App.tsx**

In `src/App.tsx`, add the import at the top with existing imports:

```tsx
import ImportPage from './pages/ImportPage'
```

Then add this route inside `<Routes>`, alongside the `/onboarding` route (before the `<Route element={<AppLayout />}>` block):

```tsx
<Route path="/import" element={<ImportPage />} />
```

- [ ] **Step 4: Start the dev server and verify**

```bash
cd /Users/agupta69/Desktop/ClaudeXFigma/ids-starter && yarn dev
```

Open `http://localhost:5174/#/import`

Expected: Trowser opens full-screen, title "Onboard new clients with 1040 import" shows at top, Cancel and Next buttons visible in footer. Content area is empty.

- [ ] **Step 5: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/ImportPage.tsx src/styles/ImportPage.module.css src/App.tsx
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: add /import route with empty trowser shell"
```

---

## Task 2: Step Flow + Step State Management

**Files:**
- Modify: `src/pages/ImportPage.tsx`

**Goal:** Step flow appears below the trowser header. Clicking Next advances it through all 5 steps correctly. Trowser title updates per step.

- [ ] **Step 1: Add step state and StepFlow to ImportPage**

Replace the entire content of `src/pages/ImportPage.tsx` with:

```tsx
import { useState } from 'react'
import Trowser from '@ids-ts/trowser'
import '@ids-ts/trowser/dist/main.css'
import StepFlow, { Step } from '@ids-ts/step-flow'
import '@ids-ts/step-flow/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../styles/ImportPage.module.css'

// step index 0 = screen 4 (Upload), 1 = screen 5 (File attached),
// 2 = screen 6 (Review personal), 3 = screen 7 (Prior year),
// 4 = screen 8 (Creating - empty), 5 = screen 9 (Creating - active),
// 6 = screen 10 (Success)
const STEP_TITLES: Record<number, string> = {
  0: 'Onboard new clients with 1040 import',
  1: 'Onboard new clients with 1040 import',
  2: 'Create a new client and return from a 1040.',
  3: 'Create a new client and return from a 1040.',
  4: 'Onboard new clients with 1040 import',
  5: 'Onboard new clients with 1040 import',
  6: 'Onboard new clients with 1040 import',
}

// Maps internal step index to StepFlow activeStepIndex (0-based, 5 steps)
// Screens 4+5 = step 0 active, screen 6 = step 1, screen 7 = step 2,
// screens 8+9+10 = all complete (use step index 5 = past last step)
const STEP_FLOW_INDEX: Record<number, number> = {
  0: 0,
  1: 0,
  2: 1,
  3: 2,
  4: 5,
  5: 5,
  6: 5,
}

// Whether to show footer buttons per step
const FOOTER_CONFIG: Record<number, { showCancel: boolean; showNext: boolean; showSuccess: boolean }> = {
  0: { showCancel: false, showNext: true, showSuccess: false },
  1: { showCancel: false, showNext: true, showSuccess: false },
  2: { showCancel: true, showNext: true, showSuccess: false },
  3: { showCancel: true, showNext: true, showSuccess: false },
  4: { showCancel: false, showNext: false, showSuccess: false },
  5: { showCancel: true, showNext: true, showSuccess: false },
  6: { showCancel: true, showNext: false, showSuccess: true },
}

export default function ImportPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(s => s + 1)
  }

  const handleClose = () => {
    setCurrentStep(0)
  }

  const footer = FOOTER_CONFIG[currentStep]
  const stepFlowIndex = STEP_FLOW_INDEX[currentStep]

  return (
    <Trowser
      open={true}
      title={STEP_TITLES[currentStep]}
      dismissible
      onClose={handleClose}
    >
      <StepFlow activeStepIndex={stepFlowIndex} progressType="indicator" width="large">
        <Step title="Upload file">
          <div className={styles.contentArea}>
            {/* UploadStep will go here in Task 3 */}
            <p>Step {currentStep + 1} content</p>
          </div>
        </Step>
        <Step title="General information">
          <div className={styles.contentArea} />
        </Step>
        <Step title="Other information">
          <div className={styles.contentArea} />
        </Step>
        <Step title="Client details">
          <div className={styles.contentArea} />
        </Step>
        <Step title="Create return">
          <div className={styles.contentArea} />
        </Step>
      </StepFlow>

      <div className={styles.footer}>
        {footer.showCancel && (
          <Button priority="tertiary" onClick={handleClose}>Cancel</Button>
        )}
        {!footer.showCancel && <span />}
        <div className={styles.footerRight}>
          {footer.showSuccess && (
            <>
              <Button priority="secondary" onClick={() => {}}>View client profile</Button>
              <Button priority="primary" onClick={() => {}}>Open return</Button>
            </>
          )}
          {footer.showNext && (
            <Button priority="primary" onClick={handleNext}>Next</Button>
          )}
        </div>
      </div>
    </Trowser>
  )
}
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:5174/#/import`

Expected:
- Step flow shows 5 steps: "Upload file", "General information", "Other information", "Client details", "Create return"
- Step 1 is active (highlighted)
- Clicking Next advances to next step indicator
- Title updates correctly per step
- Footer buttons show/hide per step config

- [ ] **Step 3: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/ImportPage.tsx
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: wire step flow and step state into trowser shell"
```

---

## Task 3: Screen 4 — Upload Step (Empty State)

**Files:**
- Create: `src/pages/import/UploadStep.tsx`
- Create: `src/styles/import/UploadStep.module.css`
- Modify: `src/pages/ImportPage.tsx`

**Goal:** Screen 4 content renders inside the trowser — info banner, body copy, upload zone with two options, tax year dropdown, learn more link. Next without file attached shows `page-message` error.

**⚠️ Before coding:** Verify these icon names exist at https://icons.app.intuit.com/search:
- Upload icon → likely `Upload`
- Cloud upload icon → likely `CloudUpload`
- AI sparkle → likely `IntuitAssist` or `Sparkle`
If any are missing, stop and flag to designer.

- [ ] **Step 1: Create UploadStep CSS module**

Create `src/styles/import/UploadStep.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-row-gap-large);
  width: 100%;
  max-width: 600px;
  padding: var(--space-container-padding-large) 0;
}

.bodyText {
  color: var(--color-text-secondary);
  text-align: center;
}

.uploadZone {
  width: 100%;
  border: 2px dashed var(--color-container-border-secondary);
  border-radius: var(--radius-small);
  overflow: hidden;
}

.uploadOption {
  display: flex;
  align-items: center;
  gap: var(--space-component-gap-medium);
  padding: var(--space-container-padding-medium) var(--space-container-padding-large);
  cursor: pointer;
  background: var(--color-container-background-primary);
}

.uploadOption:hover {
  background: var(--color-container-background-secondary);
}

.uploadOptionDivider {
  height: 1px;
  background: var(--color-container-border-primary);
  margin: 0;
}

.uploadOptionText {
  display: flex;
  flex-direction: column;
  gap: var(--space-row-gap-x-small);
}

.uploadOptionTitle {
  color: var(--color-text-primary);
  font-weight: 600;
}

.uploadOptionSubtitle {
  color: var(--color-text-secondary);
}

.uploadIcon {
  color: var(--color-icon-primary);
  flex-shrink: 0;
}

.dropdownWrapper {
  width: 100%;
}

.learnMore {
  color: var(--color-action-standard);
  text-decoration: none;
  cursor: pointer;
}

.learnMore:hover {
  text-decoration: underline;
}
```

- [ ] **Step 2: Create UploadStep component**

Create `src/pages/import/UploadStep.tsx`:

```tsx
import { useState } from 'react'
import { PageMessage } from '@ids-ts/page-message'
import '@ids-ts/page-message/dist/main.css'
import { Dropdown } from '@ids-ts/dropdown'
import '@ids-ts/dropdown/dist/main.css'
import { MenuItem } from '@ids-ts/dropdown'
import { B1, B2 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
// ⚠️ ICON VERIFICATION REQUIRED before using these imports.
// Verify each at https://icons.app.intuit.com/search
// Replace icon names below with verified names, or use placeholder <span> if SVG provided by designer.
import { Upload, CloudUpload } from '@design-systems/icons'
import styles from '../../styles/import/UploadStep.module.css'

interface UploadStepProps {
  hasFile: boolean
  showError: boolean
  onFileAttached: () => void
  onDismissError: () => void
}

export default function UploadStep({ hasFile, showError, onFileAttached, onDismissError }: UploadStepProps) {
  const [taxYear, setTaxYear] = useState('2024')

  // Simulate file attach on click (prototype — no real upload)
  const handleUploadClick = () => {
    onFileAttached()
  }

  return (
    <div className={styles.container}>
      {showError && (
        <PageMessage
          type="error"
          title="Please upload a file before continuing."
          open={showError}
          dismissible
          onClose={onDismissError}
        />
      )}

      {/* Info banner — uses PageMessage in discovery/info style */}
      <PageMessage
        type="info"
        title="Import a 1040 to enable automated onboarding"
        open={true}
        dismissible
        onClose={() => {}}
      >
        Once you import the 1040, you can have Intuit AI draft a client data request and return summary.
      </PageMessage>

      <B2 className={styles.bodyText}>
        Use one of our accepted file formats: .jpeg, .jpg, .png, or .pdf.
      </B2>

      <div className={styles.uploadZone}>
        <div className={styles.uploadOption} onClick={handleUploadClick} role="button" tabIndex={0}>
          <Upload size="large" className={styles.uploadIcon} />
          <div className={styles.uploadOptionText}>
            <span className={styles.uploadOptionTitle}>Upload from this device</span>
            <span className={styles.uploadOptionSubtitle}>Browse and select documents to upload</span>
          </div>
        </div>
        <div className={styles.uploadOptionDivider} />
        <div className={styles.uploadOption} role="button" tabIndex={0}>
          <CloudUpload size="large" className={styles.uploadIcon} />
          <div className={styles.uploadOptionText}>
            <span className={styles.uploadOptionTitle}>Get from cloud apps</span>
            <span className={styles.uploadOptionSubtitle}>Connect a cloud account to import</span>
          </div>
        </div>
      </div>

      <div className={styles.dropdownWrapper}>
        <Dropdown
          label="Select the Tax year for this file?"
          value={taxYear}
          controlled
          onChange={(_e, info) => { if (info?.value) setTaxYear(String(info.value)) }}
        >
          <MenuItem value="2024">2024</MenuItem>
          <MenuItem value="2023">2023</MenuItem>
          <MenuItem value="2022">2022</MenuItem>
        </Dropdown>
      </div>

      <a className={styles.learnMore} href="#" onClick={e => e.preventDefault()}>
        Learn how to Import a 1040
      </a>
    </div>
  )
}
```

- [ ] **Step 3: Wire UploadStep into ImportPage**

In `src/pages/ImportPage.tsx`:

Add imports at the top:
```tsx
import { useState } from 'react'  // already there
import UploadStep from './import/UploadStep'
```

Add state near the top of the component (after `currentStep`):
```tsx
const [hasFile, setHasFile] = useState(false)
const [showUploadError, setShowUploadError] = useState(false)
```

Update `handleNext` to validate:
```tsx
const handleNext = () => {
  if (currentStep === 0 && !hasFile) {
    setShowUploadError(true)
    return
  }
  setShowUploadError(false)
  if (currentStep < 6) setCurrentStep(s => s + 1)
}
```

Replace the `<p>Step {currentStep + 1} content</p>` placeholder inside the first `<Step>` with:
```tsx
<div className={styles.contentArea}>
  <UploadStep
    hasFile={hasFile}
    showError={showUploadError}
    onFileAttached={() => { setHasFile(true); setShowUploadError(false); setCurrentStep(1) }}
    onDismissError={() => setShowUploadError(false)}
  />
</div>
```

- [ ] **Step 4: Verify screen 4 in browser**

Open `http://localhost:5174/#/import`

Expected:
- Info banner with text visible at top
- Body copy below
- Upload zone with two rows separated by a divider
- Upload icons on left of each row
- Tax year dropdown showing "2024"
- "Learn how to Import a 1040" link at bottom
- Clicking Next without file shows error page-message at top of content
- Clicking "Upload from this device" simulates file attach and advances to screen 5

- [ ] **Step 5: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/import/UploadStep.tsx src/styles/import/UploadStep.module.css src/pages/ImportPage.tsx
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: screen 4 upload step with validation and error page-message"
```

---

## Task 4: Screen 5 — File Attached State

**Files:**
- Modify: `src/pages/import/UploadStep.tsx`
- Modify: `src/styles/import/UploadStep.module.css`

**Goal:** When `hasFile = true` (step index 1), the upload zone transforms to the "file attached" state — centered upload icon, drag prompt, file chip top-right.

**⚠️ Before coding:** Verify `Document` or `FilePdf` icon at https://icons.app.intuit.com/search for the PDF file chip.

- [ ] **Step 1: Add attached state styles to UploadStep.module.css**

Append to `src/styles/import/UploadStep.module.css`:

```css
.uploadZoneAttached {
  width: 100%;
  border: 2px dashed var(--color-container-border-accent);
  border-radius: var(--radius-small);
  background: var(--color-container-background-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-container-padding-large);
  gap: var(--space-row-gap-medium);
  min-height: 140px;
  position: relative;
}

.uploadZoneAttachedIcon {
  color: var(--color-icon-primary);
}

.uploadZoneAttachedText {
  color: var(--color-text-secondary);
  text-align: center;
}

.uploadZoneAttachedTitle {
  color: var(--color-text-primary);
  font-weight: 600;
  text-align: center;
}

.fileChip {
  position: absolute;
  top: var(--space-component-gap-small);
  right: var(--space-component-gap-small);
  display: flex;
  align-items: center;
  gap: var(--space-component-gap-x-small);
  background: var(--color-action-standard);
  color: var(--color-text-inverse);
  border-radius: var(--radius-small);
  padding: var(--space-component-stack-padding-x-small) var(--space-component-inline-padding-small);
  font-size: var(--font-size-body-4);
  font-weight: 600;
}

.fileChipIcon {
  color: var(--color-text-inverse);
}
```

- [ ] **Step 2: Update UploadStep to render attached state**

In `src/pages/import/UploadStep.tsx`, replace the upload zone JSX with a conditional:

```tsx
{/* ⚠️ Verify Document icon at icons.app.intuit.com/search */}
import { Upload, CloudUpload, Document } from '@design-systems/icons'
```

Replace the `<div className={styles.uploadZone}>` block with:

```tsx
{hasFile ? (
  <div className={styles.uploadZoneAttached}>
    <div className={styles.fileChip}>
      {/* ⚠️ Replace Document with verified PDF icon name */}
      <Document size="small" className={styles.fileChipIcon} />
      JW-1040-2024.pdf
    </div>
    <Upload size="large" className={styles.uploadZoneAttachedIcon} />
    <span className={styles.uploadZoneAttachedTitle}>Upload to ProConnect</span>
    <span className={styles.uploadZoneAttachedText}>Drag and drop anywhere in this zone</span>
  </div>
) : (
  <div className={styles.uploadZone}>
    <div className={styles.uploadOption} onClick={handleUploadClick} role="button" tabIndex={0}>
      <Upload size="large" className={styles.uploadIcon} />
      <div className={styles.uploadOptionText}>
        <span className={styles.uploadOptionTitle}>Upload from this device</span>
        <span className={styles.uploadOptionSubtitle}>Browse and select documents to upload</span>
      </div>
    </div>
    <div className={styles.uploadOptionDivider} />
    <div className={styles.uploadOption} role="button" tabIndex={0}>
      <CloudUpload size="large" className={styles.uploadIcon} />
      <div className={styles.uploadOptionText}>
        <span className={styles.uploadOptionTitle}>Get from cloud apps</span>
        <span className={styles.uploadOptionSubtitle}>Connect a cloud account to import</span>
      </div>
    </div>
  </div>
)}
```

Also hide body copy when file is attached — wrap the `<B2>` line:
```tsx
{!hasFile && (
  <B2 className={styles.bodyText}>
    Use one of our accepted file formats: .jpeg, .jpg, .png, or .pdf.
  </B2>
)}
```

- [ ] **Step 3: Verify screen 5 in browser**

After clicking "Upload from this device":

Expected:
- Upload zone transforms — two option rows gone
- Centered upload icon + "Upload to ProConnect" + drag text
- Blue file chip "JW-1040-2024.pdf" appears top-right of zone
- Body copy is hidden
- Info banner still visible
- Next advances to screen 6

- [ ] **Step 4: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/import/UploadStep.tsx src/styles/import/UploadStep.module.css
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: screen 5 file attached state with chip and zone transform"
```

---

## Task 5a: Screen 6 — Split View Left Column (PDF Viewer)

**Files:**
- Create: `src/pages/import/ReviewPersonalStep.tsx`
- Create: `src/styles/import/ReviewStep.module.css`
- Modify: `src/pages/ImportPage.tsx`

**Goal:** Screen 6 renders a two-column layout. Left column shows the 1040 PDF as a static image with file header and zoom controls. Right column is empty for now (Task 5b).

**⚠️ Before coding:** Verify `ZoomIn`, `ZoomOut`, `MoreVertical` icons at https://icons.app.intuit.com/search.

**⚠️ Asset needed:** A static screenshot of the 1040 form (from Figma screen 6 left panel). Save to `src/assets/1040-preview.png`. Extract from Figma node `29298:135977` left panel area.

- [ ] **Step 1: Create ReviewStep CSS module**

Create `src/styles/import/ReviewStep.module.css`:

```css
.splitContainer {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 0;
  overflow: hidden;
}

.leftColumn {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-container-border-primary);
  overflow: hidden;
}

.fileHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-container-padding-small) var(--space-container-padding-medium);
  border-bottom: 1px solid var(--color-container-border-primary);
  background: var(--color-container-background-primary);
}

.fileHeaderInfo {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fileHeaderName {
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: var(--font-size-body-3);
}

.fileHeaderMeta {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-4);
}

.fileHeaderMenu {
  color: var(--color-icon-primary);
  cursor: pointer;
  padding: var(--space-component-stack-padding-x-small);
}

.pdfViewer {
  flex: 1;
  overflow-y: auto;
  background: var(--color-page-background-secondary);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-container-padding-medium);
}

.pdfImage {
  width: 100%;
  max-width: 480px;
  border: 1px solid var(--color-container-border-primary);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.zoomControls {
  display: flex;
  align-items: center;
  gap: var(--space-component-gap-small);
  padding: var(--space-container-padding-small) var(--space-container-padding-medium);
  border-top: 1px solid var(--color-container-border-primary);
  background: var(--color-container-background-primary);
}

.zoomButton {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-icon-primary);
  padding: var(--space-component-stack-padding-x-small);
  border-radius: var(--radius-small);
  display: flex;
  align-items: center;
}

.zoomButton:hover {
  background: var(--color-container-background-secondary);
}

.rightColumn {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: var(--space-container-padding-large);
  gap: var(--space-row-gap-large);
}
```

- [ ] **Step 2: Create ReviewPersonalStep with left column only**

Create `src/pages/import/ReviewPersonalStep.tsx`:

```tsx
// ⚠️ Verify ZoomIn, ZoomOut, MoreVertical at https://icons.app.intuit.com/search
// Replace icon names below with verified names before running
import { ZoomIn, ZoomOut, MoreVertical } from '@design-systems/icons'
import pdfPreview from '../../assets/1040-preview.png'
import styles from '../../styles/import/ReviewStep.module.css'

interface ReviewPersonalStepProps {
  variant: 'personal' | 'priorYear'
}

export default function ReviewPersonalStep({ variant }: ReviewPersonalStepProps) {
  return (
    <div className={styles.splitContainer}>
      {/* LEFT COLUMN: PDF Viewer */}
      <div className={styles.leftColumn}>
        <div className={styles.fileHeader}>
          <div className={styles.fileHeaderInfo}>
            <span className={styles.fileHeaderName}>W2 Michael Yan.pdf</span>
            <span className={styles.fileHeaderMeta}>W2 - Uploaded Feb 8</span>
          </div>
          {/* ⚠️ Replace MoreVertical with verified icon */}
          <button className={styles.fileHeaderMenu} aria-label="More options">
            <MoreVertical size="medium" />
          </button>
        </div>

        <div className={styles.pdfViewer}>
          <img
            src={pdfPreview}
            alt="1040 tax form preview"
            className={styles.pdfImage}
          />
        </div>

        <div className={styles.zoomControls}>
          {/* ⚠️ Replace ZoomIn/ZoomOut with verified icon names */}
          <button className={styles.zoomButton} aria-label="Zoom in">
            <ZoomIn size="medium" />
          </button>
          <button className={styles.zoomButton} aria-label="Zoom out">
            <ZoomOut size="medium" />
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: will be completed in Task 5b */}
      <div className={styles.rightColumn}>
        {/* Right panel content added in Task 5b */}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add 1040 preview image asset**

The 1040 preview image needs to be extracted from the Figma design. Use the Figma MCP to take a screenshot of the PDF panel area in node `29298:135977`, then save it to `src/assets/1040-preview.png`.

If the MCP is unavailable, use any sample 1040 form image as a stand-in — label it clearly as a placeholder.

- [ ] **Step 4: Wire ReviewPersonalStep into ImportPage**

In `src/pages/ImportPage.tsx`, add import:
```tsx
import ReviewPersonalStep from './import/ReviewPersonalStep'
```

Replace the empty second `<Step>` with:
```tsx
<Step title="General information">
  <ReviewPersonalStep variant="personal" />
</Step>
```

- [ ] **Step 5: Verify in browser**

Navigate to screen 6 (click Next twice from start).

Expected:
- Two-column layout fills the trowser content area
- Left column: file header bar with filename + meta + kebab menu
- 1040 form image displayed below header, scrollable
- Zoom in/out buttons in footer of left column
- Right column is empty (will be filled in Task 5b)

- [ ] **Step 6: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/import/ReviewPersonalStep.tsx src/styles/import/ReviewStep.module.css src/pages/ImportPage.tsx src/assets/1040-preview.png
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: screen 6 split view left column with PDF viewer"
```

---

## Task 5b: Screen 6 — Right Column (Extracted Data Panel)

**Files:**
- Modify: `src/pages/import/ReviewPersonalStep.tsx`
- Modify: `src/styles/import/ReviewStep.module.css`

**Goal:** Right column shows tabs, matched/all fields toggle, and the extracted client data fields from the Figma.

- [ ] **Step 1: Add right column styles to ReviewStep.module.css**

Append to `src/styles/import/ReviewStep.module.css`:

```css
.rightHeading {
  color: var(--color-text-primary);
  font-size: var(--font-size-heading-4);
  font-weight: 700;
  margin: 0;
}

.toggleGroup {
  display: flex;
  border: 1px solid var(--color-container-border-primary);
  border-radius: var(--radius-small);
  overflow: hidden;
  width: fit-content;
}

.toggleBtn {
  padding: var(--space-component-stack-padding-x-small) var(--space-component-inline-padding-small);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-primary);
  font-size: var(--font-size-body-3);
}

.toggleBtnActive {
  background: var(--color-action-standard);
  color: var(--color-text-inverse);
  font-weight: 600;
}

.sectionLabel {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-4);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-row-gap-small) 0 var(--space-row-gap-x-small);
  border-bottom: 1px solid var(--color-container-border-primary);
  width: 100%;
}

.fieldRow {
  display: flex;
  align-items: flex-start;
  gap: var(--space-component-gap-medium);
  padding: var(--space-row-gap-small) 0;
  border-bottom: 1px solid var(--color-container-border-primary);
  width: 100%;
}

.fieldLabel {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-3);
  min-width: 160px;
  flex-shrink: 0;
}

.fieldValue {
  color: var(--color-text-primary);
  font-size: var(--font-size-body-3);
  font-weight: 500;
  flex: 1;
  background: var(--color-container-background-secondary);
  border: 1px solid var(--color-container-border-primary);
  border-radius: var(--radius-small);
  padding: var(--space-component-stack-padding-x-small) var(--space-component-inline-padding-small);
}

.addressRow {
  display: flex;
  gap: var(--space-component-gap-small);
  flex: 1;
}

.addressStreet {
  flex: 2;
}

.addressCity {
  flex: 1;
}

.addressState {
  width: 60px;
}

.addressZip {
  width: 80px;
}
```

- [ ] **Step 2: Update ReviewPersonalStep right column**

Replace the empty `<div className={styles.rightColumn}>` in `src/pages/import/ReviewPersonalStep.tsx` with:

```tsx
import { useState } from 'react'
import { Tabs } from '@ids-ts/tabs'
import '@ids-ts/tabs/dist/main.css'
```

Add `useState` for the toggle at the top of the component:
```tsx
const [matchedOnly, setMatchedOnly] = useState(true)
```

Replace empty right column:
```tsx
{/* RIGHT COLUMN: Extracted data */}
<div className={styles.rightColumn}>
  <h2 className={styles.rightHeading}>
    {variant === 'personal' ? 'Review personal information' : 'Prior year information'}
  </h2>

  <Tabs
    selected="client"
    onChange={() => {}}
    alignment="left"
  >
    <Tabs.Tab id="client" label="Client information">
      {/* Content rendered below tabs via variant */}
    </Tabs.Tab>
    <Tabs.Tab id="dependents" label="Dependents">
      <div />
    </Tabs.Tab>
    <Tabs.Tab id="misc" label="Misc info / Direct deposit">
      <div />
    </Tabs.Tab>
  </Tabs>

  <div className={styles.toggleGroup}>
    <button
      className={`${styles.toggleBtn} ${!matchedOnly ? styles.toggleBtnActive : ''}`}
      onClick={() => setMatchedOnly(false)}
    >
      All fields
    </button>
    <button
      className={`${styles.toggleBtn} ${matchedOnly ? styles.toggleBtnActive : ''}`}
      onClick={() => setMatchedOnly(true)}
    >
      Matched fields
    </button>
  </div>

  {/* Taxpayer section */}
  <span className={styles.sectionLabel}>Taxpayer</span>

  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>Name</span>
    <span className={styles.fieldValue}>Testee Summary</span>
  </div>
  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>SSN</span>
    <span className={styles.fieldValue}>534-02-8622</span>
  </div>
  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>Marital status</span>
    <span className={styles.fieldValue}>Married</span>
  </div>
  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>Filing status</span>
    <span className={styles.fieldValue}>MFJ</span>
  </div>
  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>Occupation</span>
    <span className={styles.fieldValue}>Nutritionist</span>
  </div>
  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>Home address</span>
    <div className={styles.addressRow}>
      <span className={`${styles.fieldValue} ${styles.addressStreet}`}>151 Franklin Street</span>
      <span className={`${styles.fieldValue} ${styles.addressCity}`}>Chicago</span>
      <span className={`${styles.fieldValue} ${styles.addressState}`}>IL</span>
      <span className={`${styles.fieldValue} ${styles.addressZip}`}>60606</span>
    </div>
  </div>

  {/* Spouse section */}
  <span className={styles.sectionLabel}>Spouse information</span>

  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>Spouse name</span>
    <span className={styles.fieldValue}>James Summary</span>
  </div>
  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>Spouse SSN</span>
    <span className={styles.fieldValue}>872-33-9461</span>
  </div>
  <div className={styles.fieldRow}>
    <span className={styles.fieldLabel}>Occupation</span>
    <span className={styles.fieldValue}>VP Controller</span>
  </div>
</div>
```

- [ ] **Step 3: Verify screen 6 in browser**

Navigate to screen 6.

Expected:
- Right column shows heading "Review personal information"
- Three tabs: Client information (active), Dependents, Misc info / Direct deposit
- Toggle buttons: "All fields" | "Matched fields" (Matched fields highlighted blue)
- "Taxpayer" section label
- Name, SSN, Marital status, Filing status, Occupation, Home address fields
- Address shows as 4 inline boxes (Street | City | State | Zip)
- "Spouse information" section below

- [ ] **Step 4: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/import/ReviewPersonalStep.tsx src/styles/import/ReviewStep.module.css
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: screen 6 right column with tabs and extracted client data"
```

---

## Task 6: Screen 7 — Prior Year Information

**Files:**
- Create: `src/pages/import/PriorYearStep.tsx`
- Modify: `src/pages/ImportPage.tsx`

**Goal:** Screen 7 reuses the split view shell. Right column shows "Prior year information" heading and financial data fields instead of client info.

- [ ] **Step 1: Create PriorYearStep**

Create `src/pages/import/PriorYearStep.tsx`:

```tsx
import styles from '../../styles/import/ReviewStep.module.css'
// ⚠️ Verify ZoomIn, ZoomOut, MoreVertical icons — same as ReviewPersonalStep
import { ZoomIn, ZoomOut, MoreVertical } from '@design-systems/icons'
import pdfPreview from '../../assets/1040-preview.png'
import { useState } from 'react'

const PRIOR_YEAR_FIELDS = [
  { label: 'Total wages', value: '$ 214,237.' },
  { label: 'Tax-exempt interest', value: '$ 100.' },
  { label: 'Taxable interest', value: '$ 61.' },
  { label: 'Qualified dividends', value: '$ 611.' },
  { label: 'Ordinary dividends', value: '$ 1,239.' },
  { label: 'IRA Distributions', value: '$ 6,197.' },
  { label: 'Taxable IRA distributions', value: '$197' },
  { label: 'Pensions and annuities', value: '$197' },
  { label: 'Taxable pensions and annuities', value: '$197' },
  { label: 'Social security benefits', value: '$197' },
  { label: 'Taxable social security benefits', value: '$197' },
  { label: 'Capital gain or loss', value: '$197' },
]

export default function PriorYearStep() {
  const [matchedOnly, setMatchedOnly] = useState(true)

  return (
    <div className={styles.splitContainer}>
      {/* LEFT COLUMN: same PDF viewer as screen 6 */}
      <div className={styles.leftColumn}>
        <div className={styles.fileHeader}>
          <div className={styles.fileHeaderInfo}>
            <span className={styles.fileHeaderName}>W2 Michael Yan.pdf</span>
            <span className={styles.fileHeaderMeta}>W2 - Uploaded Feb 8</span>
          </div>
          <button className={styles.fileHeaderMenu} aria-label="More options">
            <MoreVertical size="medium" />
          </button>
        </div>
        <div className={styles.pdfViewer}>
          <img src={pdfPreview} alt="1040 tax form preview" className={styles.pdfImage} />
        </div>
        <div className={styles.zoomControls}>
          <button className={styles.zoomButton} aria-label="Zoom in"><ZoomIn size="medium" /></button>
          <button className={styles.zoomButton} aria-label="Zoom out"><ZoomOut size="medium" /></button>
        </div>
      </div>

      {/* RIGHT COLUMN: Prior year data */}
      <div className={styles.rightColumn}>
        <h2 className={styles.rightHeading}>Prior year information</h2>

        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleBtn} ${!matchedOnly ? styles.toggleBtnActive : ''}`}
            onClick={() => setMatchedOnly(false)}
          >
            All fields
          </button>
          <button
            className={`${styles.toggleBtn} ${matchedOnly ? styles.toggleBtnActive : ''}`}
            onClick={() => setMatchedOnly(true)}
          >
            Matched fields
          </button>
        </div>

        <span className={styles.sectionLabel}>Prior year summary (For comparison)</span>

        {PRIOR_YEAR_FIELDS.map(({ label, value }) => (
          <div key={label} className={styles.fieldRow}>
            <span className={styles.fieldLabel}>{label}</span>
            <span className={styles.fieldValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire PriorYearStep into ImportPage**

In `src/pages/ImportPage.tsx`, add import:
```tsx
import PriorYearStep from './import/PriorYearStep'
```

Replace the empty third `<Step>` ("Other information"):
```tsx
<Step title="Other information">
  <PriorYearStep />
</Step>
```

- [ ] **Step 3: Verify screen 7 in browser**

Navigate to screen 7 (Next × 3 from start).

Expected:
- Same left column PDF viewer as screen 6
- Right column heading changes to "Prior year information"
- No tabs — just the toggle and a list of financial fields
- All 12 data fields visible, scrollable

- [ ] **Step 4: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/import/PriorYearStep.tsx src/pages/ImportPage.tsx
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: screen 7 prior year information with financial data fields"
```

---

## Task 7: Screens 8 & 9 — Loading States

**Files:**
- Create: `src/pages/import/CreatingReturnStep.tsx`
- Create: `src/styles/import/CreatingReturnStep.module.css`
- Modify: `src/pages/ImportPage.tsx`

**Goal:** Clicking Next on screen 7 transitions through screen 8 (empty loader ring) to screen 9 (active blue spinner) automatically after 1.5 seconds. Screen 9 shows Cancel + Next in footer.

- [ ] **Step 1: Create CreatingReturnStep CSS module**

Create `src/styles/import/CreatingReturnStep.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--space-row-gap-medium);
  min-height: 400px;
}

.loadingText {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-2);
}
```

- [ ] **Step 2: Create CreatingReturnStep**

Create `src/pages/import/CreatingReturnStep.tsx`:

```tsx
import { useEffect } from 'react'
import { Indeterminate } from '@ids-ts/indeterminate'
import '@ids-ts/indeterminate/dist/main.css'
import styles from '../../styles/import/CreatingReturnStep.module.css'

interface CreatingReturnStepProps {
  isActive: boolean        // false = screen 8 (empty ring), true = screen 9 (blue spinner)
  onComplete: () => void   // called after 1.5s to advance to screen 10
}

export default function CreatingReturnStep({ isActive, onComplete }: CreatingReturnStepProps) {
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(onComplete, 1500)
      return () => clearTimeout(timer)
    }
  }, [isActive, onComplete])

  return (
    <div className={styles.container}>
      <Indeterminate />
      <span className={styles.loadingText}>Creating new return...</span>
    </div>
  )
}
```

- [ ] **Step 3: Wire CreatingReturnStep into ImportPage**

In `src/pages/ImportPage.tsx`, add import:
```tsx
import CreatingReturnStep from './import/CreatingReturnStep'
```

Update `handleNext` — when advancing from step 3 (screen 7), go to step 4 then auto-advance to step 5:
```tsx
const handleNext = () => {
  if (currentStep === 0 && !hasFile) {
    setShowUploadError(true)
    return
  }
  setShowUploadError(false)
  if (currentStep === 3) {
    // Screen 7 → Screen 8 (empty loader), then auto to Screen 9
    setCurrentStep(4)
    setTimeout(() => setCurrentStep(5), 400)
    return
  }
  if (currentStep < 6) setCurrentStep(s => s + 1)
}
```

Replace the empty fourth `<Step>` ("Client details"):
```tsx
<Step title="Client details">
  <CreatingReturnStep
    isActive={currentStep === 5}
    onComplete={() => setCurrentStep(6)}
  />
</Step>
```

- [ ] **Step 4: Verify screens 8 + 9 in browser**

Navigate to screen 8 (Next × 4 from start).

Expected:
- Empty loader ring centered on screen with "Creating new return..." text
- Footer: no buttons
- After ~400ms: loader ring becomes active blue spinner
- Footer: Cancel + Next appear
- After ~1.5 more seconds: auto-advances to screen 10

- [ ] **Step 5: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/import/CreatingReturnStep.tsx src/styles/import/CreatingReturnStep.module.css src/pages/ImportPage.tsx
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: screens 8+9 loading states with auto-transition to success"
```

---

## Task 8: Screen 10 — Success State

**Files:**
- Create: `src/pages/import/SuccessStep.tsx`
- Create: `src/styles/import/SuccessStep.module.css`
- Modify: `src/pages/ImportPage.tsx`

**Goal:** Screen 10 shows success circle icon, confirmation copy, and AI onboarding CTA. Footer has "View client profile" (secondary) + "Open return" (primary).

**⚠️ Before coding:** Verify `CheckCircle` (or similar) at https://icons.app.intuit.com/search for the green success icon. Also verify the AI sparkle icon again for the CTA button.

- [ ] **Step 1: Create SuccessStep CSS module**

Create `src/styles/import/SuccessStep.module.css`:

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  gap: var(--space-row-gap-medium);
  text-align: center;
  padding: var(--space-container-padding-large);
  min-height: 400px;
}

.successIcon {
  color: var(--color-feedback-success);
  width: 56px;
  height: 56px;
}

.heading {
  color: var(--color-text-primary);
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  margin: 0;
}

.body {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-2);
  max-width: 480px;
}

.ctaButton {
  display: flex;
  align-items: center;
  gap: var(--space-component-gap-small);
}

.subCopy {
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-3);
  font-style: italic;
  max-width: 480px;
}
```

- [ ] **Step 2: Create SuccessStep component**

Create `src/pages/import/SuccessStep.tsx`:

```tsx
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
// ⚠️ Verify CheckCircle at https://icons.app.intuit.com/search
// ⚠️ Verify IntuitAssist (AI sparkle) at https://icons.app.intuit.com/search
// Replace with verified names or designer-supplied SVG
import { CheckCircle, IntuitAssist } from '@design-systems/icons'
import styles from '../../styles/import/SuccessStep.module.css'

export default function SuccessStep() {
  return (
    <div className={styles.container}>
      {/* ⚠️ Replace CheckCircle with verified icon */}
      <CheckCircle size="xxlarge" className={styles.successIcon} />

      <h2 className={styles.heading}>Client and return created</h2>

      <p className={styles.body}>
        Jordan Wells' 1040 return for Tax Year 2025 is set up and ready to go.
      </p>

      <Button priority="secondary" onClick={() => {}}>
        <span className={styles.ctaButton}>
          {/* ⚠️ Replace IntuitAssist with verified AI sparkle icon */}
          <IntuitAssist size="small" />
          Start automated onboarding
        </span>
      </Button>

      <p className={styles.subCopy}>
        Intuit AI is ready to draft a client data request and return summary using last year's info.
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Wire SuccessStep into ImportPage**

In `src/pages/ImportPage.tsx`, add import:
```tsx
import SuccessStep from './import/SuccessStep'
```

Replace the empty fifth `<Step>` ("Create return"):
```tsx
<Step title="Create return">
  <SuccessStep />
</Step>
```

- [ ] **Step 4: Verify screen 10 in browser**

Navigate to screen 10 (let the auto-transition complete from screen 9).

Expected:
- Large green checkmark icon centered
- "Client and return created" heading
- Confirmation body copy
- "Start automated onboarding" outlined button with AI icon
- Italic sub-copy below
- Footer: Cancel (left) + "View client profile" (secondary) + "Open return" (primary)

- [ ] **Step 5: Commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/pages/import/SuccessStep.tsx src/styles/import/SuccessStep.module.css src/pages/ImportPage.tsx
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: screen 10 success state with client created confirmation"
```

---

## Task 9: Polish & Interactions

**Files:**
- Modify: `src/styles/ImportPage.module.css`
- Modify: `src/pages/ImportPage.tsx`

**Goal:** All screens are visually complete. This task adds cross-fade transitions between steps, verifies token compliance, and does a final quality pass.

- [ ] **Step 1: Add step transition animation**

Append to `src/styles/ImportPage.module.css`:

```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.stepContent {
  animation: fadeIn var(--duration-quick, 200ms) var(--easing-standard, ease-out);
}
```

Wrap each step's content `<div className={styles.contentArea}>` with:
```tsx
<div className={styles.stepContent}>
  {/* existing content */}
</div>
```

Apply `key={currentStep}` to force remount and re-trigger animation:
```tsx
<div key={currentStep} className={styles.stepContent}>
```

- [ ] **Step 2: Run style audit**

```bash
cd /Users/agupta69/Desktop/ClaudeXFigma/ids-starter && grep -r "color: #\|background: #\|font-size: [0-9]" src/styles/import/
```

Expected: No output. If any hardcoded values appear, replace with the appropriate `var(--token-name)`.

- [ ] **Step 3: Final visual check — walk through all screens**

Open `http://localhost:5174/#/import` and click through the full flow:

| Screen | Check |
|--------|-------|
| 4 | Info banner, upload zone, dropdown, link visible |
| 4 → error | Click Next without file → page-message error appears |
| 5 | Click upload → zone transforms, file chip visible |
| 6 | Split view, PDF image, tabs, fields, toggle works |
| 7 | Same split, prior year data, 12 fields visible |
| 8→9 | Auto-transition from empty ring to blue spinner |
| 10 | Success icon, copy, CTA, footer buttons |

- [ ] **Step 4: Final commit**

```bash
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter add src/styles/ImportPage.module.css src/pages/ImportPage.tsx
git -C /Users/agupta69/Desktop/ClaudeXFigma/ids-starter commit -m "feat: step transitions and final polish for 1040 import prototype"
```

---

## Self-Review Against Spec

| Spec requirement | Covered in |
|-----------------|-----------|
| Trowser shell with correct titles per screen | Task 1, Task 2 |
| Step flow 5 steps, correct active/complete states | Task 2 |
| Screen 4: banner, upload zone, dropdown, link | Task 3 |
| Screen 4: Next always enabled, page-message on empty submit | Task 3 |
| Screen 5: file attached state, chip, zone transform | Task 4 |
| Screen 6: split view, PDF left, client info right | Tasks 5a + 5b |
| Screen 6: tabs, toggle, taxpayer + spouse fields | Task 5b |
| Screen 7: same split, prior year financial fields | Task 6 |
| Screens 8+9: loading states, auto-transition | Task 7 |
| Screen 10: success icon, copy, CTA, footer buttons | Task 8 |
| Icon pre-flight check before every screen | Pre-flight + each task |
| No hardcoded colors/spacing | Task 9 step 2 |
| Static 1040 image (no real PDF rendering) | Task 5a step 3 |
| No real file upload API | Task 3 (click simulates attach) |

All spec sections covered. No gaps found.
