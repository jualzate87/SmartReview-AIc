---
name: prototype
description: Build an IDS prototype from a text description. Use when the user describes a UI they want built with Intuit Design System components.
argument-hint: "describe the UI you want to build"
user-invocable: true
model: inherit
---

Build an IDS prototype from this description: $ARGUMENTS

Follow these steps in order:

## Before Starting

State your interpretation of the request in one sentence and ask the designer to confirm before writing any code. Also ask: "Should this be a new page, or replace the current one?" If a new page, ask what to call it. Don't proceed until you have confirmation.

## 1. Read the Rules
Read `.cursor/rules/design-system.mdc` to refresh the core IDS rules.
Read `.cursor/rules/routing.mdc` to understand the multi-page file structure.

## 2. Identify Components
Figure out which `@ids-ts/*` components are needed. For each one, read its rule file at `.cursor/rules/components/<name>.mdc` to understand its props and usage.

## 3. Identify Tokens
If specific colors, spacing, or typography are mentioned, read the relevant token files:
- Colors: `.cursor/rules/tokens/intuit/color.mdc`
- Spacing: `.cursor/rules/tokens/intuit/space.mdc`
- Font sizes: `.cursor/rules/tokens/intuit/fontSize.mdc`
- Font weights: `.cursor/rules/tokens/intuit/fontWeight.mdc`
- Border radius: `.cursor/rules/tokens/intuit/radius.mdc`
- Elevation/shadows: `.cursor/rules/tokens/intuit/elevation.mdc`

For a full overview of available token categories, read `.cursor/rules/tokens.mdc`.

## 4. Build the Prototype

**If replacing the current page:** Write the code to the existing page file (e.g. `src/pages/HomePage.tsx`) and its matching CSS module.

**If creating a new page:**
1. Create `src/pages/[Name].tsx`
2. Create `src/styles/[Name].module.css`
3. Add the import and entry to `PAGES` in `src/App.tsx`

Rules to follow:
- Use `@ids-ts/*` components directly (no wrappers)
- Import each component's CSS: `import '@ids-ts/<name>/dist/main.css'`
- Use CSS Modules with design tokens for all custom styling
- Use `@design-systems/icons` for any icons (read `.cursor/rules/icons.mdc` if needed)
- Use Flexbox/Grid for layout
- CSS import path from pages/: `import styles from '../styles/[Name].module.css'`

## 5. Install Missing Packages
If any `@ids-ts/*` packages are used but not in `package.json`, install them:
```
yarn add @ids-ts/<package-name>
```

## 6. Start the Dev Server
Run `npm run dev` to start the preview at `http://localhost:5174`.
If a new page was created, tell the designer: "Your new page is at `http://localhost:5174/#/[path]`"

## 7. Explain What You Built
Give a brief, plain-language summary:
- What components were used and why
- What design tokens were applied
- Any notes about interactions or responsive behavior
- If anything was missing from IDS and had to be custom-built, flag it

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
- **A component can't be installed** — offer to use a similar available component, or build a placeholder so the rest of the prototype is functional
- **Request is too vague to build confidently** — ask one focused question about the most important unknown, explain why you need it
