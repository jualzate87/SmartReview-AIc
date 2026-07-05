---
name: audit-a11y
description: Run an accessibility audit on the current prototype. Use when the user wants to check WCAG compliance, ARIA usage, keyboard navigation, or color contrast.
user-invocable: true
model: inherit
---

Run an accessibility audit on the current prototype.

## Before Starting

If there are multiple pages (check `src/App.tsx` PAGES array), ask: "Should I audit all pages, or a specific one?" Wait for the answer before proceeding.

## 1. Read the Current Prototype
Read `src/App.tsx` to get the list of pages.
Read all relevant page files in `src/pages/` and their matching CSS modules in `src/styles/`.

## 2. Read Component Rules
For each `@ids-ts/*` component used in the prototype, read its rule file at `.cursor/rules/components/<name>.mdc` to check for required accessibility props.

Also read:
- `.cursor/rules/components/a11yfocus.mdc` — focus management utility
- `.cursor/rules/design-system.mdc` — core rules

## 3. Run the Audit

### Semantic Structure
- [ ] Proper heading hierarchy (h1 → h2 → h3, no skipped levels)
- [ ] Landmark regions (`<main>`, `<nav>`, `<header>`, `<footer>`)
- [ ] Lists used for groups of related items (`<ul>`, `<ol>`)
- [ ] Semantic elements preferred over generic `<div>`
- [ ] Page has exactly one `<h1>`

### ARIA & Labels
- [ ] All interactive elements have accessible names
- [ ] Form fields have associated `<label>` elements or `aria-label`
- [ ] Images have `alt` text (or `aria-hidden="true"` if decorative)
- [ ] Icons used as buttons have `aria-label`
- [ ] No redundant ARIA (e.g., `role="button"` on a `<button>`)
- [ ] `aria-live` regions for dynamic content updates

### Keyboard Navigation
- [ ] All interactive elements are focusable via Tab
- [ ] Focus order matches visual reading order
- [ ] No keyboard traps
- [ ] Modal/drawer components trap focus correctly
- [ ] Escape key closes overlays
- [ ] Custom keyboard shortcuts don't conflict with assistive tech

### Color & Contrast
- [ ] Text meets 4.5:1 contrast ratio (regular text)
- [ ] Large text meets 3:1 contrast ratio
- [ ] Color is not the only means of conveying information
- [ ] Focus indicators are visible (at least 3:1 contrast)
- [ ] Using semantic color tokens (designed for contrast compliance)

### IDS-Specific
- [ ] Required a11y props are set on each IDS component
- [ ] Toast messages have `role="alert"` or `role="status"`
- [ ] Modals/trowsers manage focus correctly
- [ ] Form validation messages are announced to screen readers

## 4. Generate Report

```
## Accessibility Audit Report

### Score: X/10

### Critical Issues (must fix)
1. **[Issue]** — `[file:line]`
   Fix: [specific code change]

### Warnings (should fix)
1. **[Issue]** — `[file:line]`
   Fix: [specific code change]

### Passed Checks
- [List of checks that passed]

### Recommendations
- [Optional improvements for enhanced accessibility]
```

## 5. Offer to Fix
Ask if the designer wants the critical and warning issues auto-fixed in the code.

## Rules
- Read the actual code — never assume what's there
- Check each component's `.mdc` file for required a11y props
- Prioritize: Critical > Warning > Recommendation
- Provide specific code snippets for every fix
- Don't suggest changes that would break IDS component APIs
- Score fairly — a prototype with IDS components starts with a good baseline

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.
