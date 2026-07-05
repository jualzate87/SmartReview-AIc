---
name: audit-style
description: Run a style compliance audit on the current prototype. Use when the user wants to check for hardcoded values, forbidden libraries, missing CSS imports, or token compliance.
user-invocable: true
model: inherit
---

Run an IDS style compliance audit on the current prototype.

## Before Starting

If there are multiple pages (check `src/App.tsx` PAGES array), ask: "Should I audit all pages, or a specific one?" Wait for the answer before proceeding.

## 1. Read the Current Prototype
Read `src/App.tsx` to get the list of pages.
Read all relevant page files in `src/pages/` and their matching CSS modules in `src/styles/`.

## 2. Read the Rules
Read `.cursor/rules/design-system.mdc` for core rules.
Read `.cursor/rules/tokens.mdc` for token overview.
Read `.cursor/rules/tokens/intuit/color.mdc` for color tokens.
Read `.cursor/rules/tokens/intuit/space.mdc` for spacing tokens.

## 3. Run the Validation

### Forbidden Libraries
- [ ] No Material UI (`@mui/*`, `@material-ui/*`)
- [ ] No Chakra UI (`@chakra-ui/*`)
- [ ] No Ant Design (`antd`)
- [ ] No Tailwind classes
- [ ] No styled-components (`styled.`, ``css` `` ``)
- [ ] No SASS/SCSS (`.scss`, `.sass`)
- [ ] No Emotion (`@emotion/*`)
- [ ] No inline SVGs (use `@design-systems/icons`)

### Token Compliance — CSS File
- [ ] No hardcoded hex colors (e.g., `#393A3D` → `var(--color-*)`)
- [ ] No hardcoded RGB/HSL colors
- [ ] No hardcoded pixel spacing for padding/margin/gap (e.g., `16px` → `var(--space-*)`)
- [ ] No hardcoded font sizes (e.g., `14px` → `var(--font-size-*)`)
- [ ] No hardcoded font weights (e.g., `700` → `var(--font-weight-*)`)
- [ ] No hardcoded font families
- [ ] No hardcoded border radius
- [ ] No hardcoded box-shadows (use elevation tokens)
- [ ] Semantic tokens preferred over primitive tokens

### Component Imports — TSX File
- [ ] Every `@ids-ts/*` component import has a matching CSS import
- [ ] Components imported from correct packages
- [ ] No wrapper components wrapping IDS components
- [ ] No components from non-IDS UI libraries

### Layout & Structure
- [ ] No `position: absolute` for page layout
- [ ] Flexbox or Grid used for layout
- [ ] Prototype code in `src/pages/*.tsx` and `src/styles/*.module.css` (not hardcoded in `src/App.tsx`)

## 4. Calculate Compliance Score
Score = (passed checks / total checks) × 100

## 5. Generate Report

```
## IDS Style Compliance Report

### Score: XX% (X/Y checks passed)

### Violations
| # | Rule | File:Line | Current | Fix |
|---|------|-----------|---------|-----|

### Passed Checks (X/Y)
- [List passed checks]

### Auto-fixable
[List violations that can be automatically fixed with the correct token]
```

## 6. Offer to Fix
Ask if the designer wants the violations auto-fixed. For each fixable violation, provide the exact token replacement.

## Rules
- Read the actual code — check every line
- Provide exact line numbers for violations
- Suggest the correct token for every hardcoded value
- Calculate a percentage score
- Offer to auto-fix simple violations (token swaps)

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.
