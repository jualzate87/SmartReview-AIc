---
name: page
description: Generate a complete page prototype from a page type. Use when the user wants a settings page, form page, list page, table page, detail page, empty state, error page, or onboarding page.
argument-hint: 'page type (settings, form, list, table, detail, empty-state, error, onboarding)'
user-invocable: true
model: inherit
---

Generate an IDS page prototype: $ARGUMENTS

## Before Starting

Confirm which page type you're building and ask: "Should this be a new page, or replace the current one?" If a new page, ask what to call it. Don't write any code until confirmed.

**Check if AppShell is active:** Read `src/App.tsx`. If it imports `FusionShell` and has an `APP_PAGES` array, the prototype is running in AppShell mode. In AppShell mode, new pages should be registered in `APP_PAGES` with an app path (e.g., `accounting/bank-transactions`) rather than as standalone routes.

When in AppShell mode, ask the designer which app path this page should live at. If they navigated from a SubNav item, use the corresponding path from `src/components/FusionShell/SubNav.tsx`.

## 1. Read the Page Templates

Read `.claude/skills/page/templates/page-templates.md` for available page patterns and their component compositions.

## 2. Read the Rules

Read `.cursor/rules/design-system.mdc` for core IDS rules.
Read `.cursor/rules/routing.mdc` for the multi-page file structure and AppShell routing.
Read `.cursor/rules/tokens.mdc` for token overview.

## 3. Match the Request to a Page Type

Identify which page template best matches:

- **settings** — toggle switches, sections, save button
- **form** — input fields, validation, submit action
- **list** — scrollable list with items, search, filters
- **table** — data table with columns, sorting, pagination
- **detail** — single item view with metadata and actions
- **empty-state** — placeholder when no data exists
- **error** — error page (404, 500, permission denied)
- **onboarding** — step-flow with guided setup

## 4. Identify Components

For the chosen page type, determine which `@ids-ts/*` components are needed. Read each component's rule file at `.cursor/rules/components/<name>.mdc`.

## 5. Build the Page

**If replacing the current page:** Write to the existing page file and its CSS module.

**If creating a new page:**

1. Create `src/pages/[Name]Page.tsx`
2. Create `src/styles/[Name]Page.module.css`
3. Add the import and route entry to `src/App.tsx`:

**AppShell mode (has `APP_PAGES` array):**

- Add import: `import [Name]Page from './pages/[Name]Page'`
- Add entry to `APP_PAGES`: `{ path: 'section/page-name', component: [Name]Page }`
- The path is relative to `/app/` — e.g., `'accounting/bank-transactions'` maps to `/app/accounting/bank-transactions`

**Standard mode (has `PAGES` array):**

- Add import: `import [Name]Page from './pages/[Name]Page'`
- Add entry to `PAGES`: `{ label: '[Label]', path: '/[path]', component: [Name]Page }`

- Include realistic placeholder content (names, dates, descriptions)
- Wire up basic interactions (toggles toggle, buttons have hover states)
- Make it responsive
- Use semantic HTML structure
- CSS import path from pages/: `import styles from '../styles/[Name]Page.module.css'`

## 6. Install & Preview

Install missing packages with `yarn add`, start the dev server with `npm run dev`.
If a new page was created, tell the designer the URL:

- AppShell mode: "Your new page is at `http://localhost:5174/#/app/[section]/[page-name]`"
- Standard mode: "Your new page is at `http://localhost:5174/#/[path]`"

## 7. Explain & Customize

Describe what was built, what components are used, and offer to customize content, add sections, or adjust the layout.

## Evaluation Criteria

1. All components from `@ids-ts/*` only
2. Every component CSS imported
3. All visual values via design tokens
4. Semantic tokens preferred over primitives
5. Icons from `@design-systems/icons` only
6. No wrapper components
7. CSS Modules only
8. Flexbox/Grid for layout
9. Semantic HTML
10. Responsive at 320px, 768px, 1200px

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`. Always present options in plain language — never show raw error messages to the designer.

Common scenarios:

- **Page type is ambiguous** — describe what each matching type would look like and ask which fits best
- **A needed component isn't available** — offer a functionally equivalent alternative and explain the difference
- **AppShell path is unclear** — show the available SubNav sections and ask which one this page belongs to
