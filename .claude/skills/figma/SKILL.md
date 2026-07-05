---
name: figma
description: Build an IDS prototype from a Figma design URL or pasted Figma export. Use when the user provides a Figma link or Figma design data.
argument-hint: "Figma URL or paste design data"
user-invocable: true
model: inherit
---

Build an IDS prototype from this Figma design: $ARGUMENTS

## Before Starting

Figma is pre-configured and ready to use. If this is your first time running this skill, you may be prompted to authenticate with Figma — just follow the prompt.

Ask the designer: "Should this build into a new page, or replace the current one?" If a new page, ask what to call it. Don't write any code until confirmed.

## 1. Read the Figma Workflow Rules
Read `.cursor/rules/figma.mdc` first — it defines the mandatory Figma-to-code workflow.
Read `.cursor/rules/routing.mdc` for the multi-page file structure.

## 2. Fetch the Figma Design
Use the Figma MCP to fetch design data from the provided Figma URL. This retrieves the actual design data — layers, components, styles, and structure — directly from Figma.

## 3. Analyze the Design
Follow the analysis workflow from `figma.mdc`:
- **Identify IDS components** — map Figma components to `@ids-ts/*` packages
- **Extract design tokens** — colors (hex values), spacing (px values), typography, border radius
- **Map tokens** — match extracted values to IDS design tokens by reading the relevant token rule files:
  - Colors: `.cursor/rules/tokens/intuit/color.mdc`
  - Spacing: `.cursor/rules/tokens/intuit/space.mdc`
  - Typography: `.cursor/rules/tokens/intuit/fontSize.mdc`, `fontWeight.mdc`, `fontFamily.mdc`, `lineHeight.mdc`
  - Radius: `.cursor/rules/tokens/intuit/radius.mdc`
  - Elevation: `.cursor/rules/tokens/intuit/elevation.mdc`

Present the analysis to the designer **before writing any code**:
- List of IDS components detected
- Design tokens extracted and mapped
- Any gaps (Figma elements without IDS equivalents)

Ask for confirmation before proceeding to implementation.

## 4. Read Component Rules
For each identified `@ids-ts/*` component, read its rule file at `.cursor/rules/components/<name>.mdc`.

## 5. Build the Prototype
After the designer confirms the analysis:

**If replacing the current page:** Write to the existing page file and its CSS module.

**If creating a new page:**
1. Create `src/pages/[Name].tsx`
2. Create `src/styles/[Name].module.css`
3. Add the import and entry to `PAGES` in `src/App.tsx`

- Use `@ids-ts/*` components with the correct props and variants
- Apply extracted design tokens as CSS variables
- Match the Figma layout using Flexbox/Grid
- Install any missing packages with `yarn add @ids-ts/<name>`
- CSS import path from pages/: `import styles from '../styles/[Name].module.css'`

## 6. Start the Dev Server
Run `npm run dev` to preview at `http://localhost:5174`.
If a new page was created, tell the designer: "Your new page is at `http://localhost:5174/#/[path]`"

## 7. Compare & Iterate
Explain what was built and note any differences from the Figma design. Offer to adjust.

## Evaluation Criteria
Before finishing, verify:
1. All components from `@ids-ts/*` only
2. Every component CSS imported (`@ids-ts/<name>/dist/main.css`)
3. All visual values via design tokens (zero hardcoded)
4. Semantic tokens preferred over primitives
5. Icons from `@design-systems/icons` only
6. No wrapper components
7. CSS Modules only (no Tailwind/SASS/CSS-in-JS)
8. Flexbox/Grid for layout
9. Semantic HTML
10. Responsive at 320px, 768px, 1200px

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`. Always present options in plain language — never show raw error messages to the designer.

Common scenarios:
- **Figma connection fails** — offer to build from a text description instead; ask the designer to describe what they were trying to import
- **Figma component has no IDS equivalent** — flag it clearly in the analysis, propose the closest IDS alternative, and ask for direction before building
