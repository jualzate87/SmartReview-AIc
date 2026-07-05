---
name: spec
description: Generate a design specification for the current prototype. Use when the user wants a component inventory, token list, and implementation notes for developers or for review.
user-invocable: true
model: inherit
---

Generate a design specification for the current prototype.

## Before Starting

If the prototype has multiple pages, ask the designer: "Should I generate a spec for all pages, or a specific one?" Wait for their answer before proceeding.

## 1. Read the Current Prototype

Read `src/App.tsx` to get the list of pages from the `PAGES` array.
Read all page files in `src/pages/`.
Read all `*.module.css` files in `src/styles/` (excluding `index.css`, `fonts.css`, `intuit.css`).

## 2. Read the Design System Rules
Read `.cursor/rules/design-system.mdc` for reference.
Read `.cursor/rules/tokens.mdc` for token categories.

## 3. Extract the Component Inventory
For each `@ids-ts/*` component used across all page files:
- **Component name** and package
- **Props** configured in the code
- **Variant** being used (if applicable)
- **Count** — how many instances
- **Page(s)** — which page(s) it appears on

## 4. Extract the Token Inventory
For each design token used across all CSS module files:
- **Token name** (CSS variable)
- **Category** (color, space, font, etc.)
- **Property** it's applied to
- **Semantic meaning** (what it's styling)

## 5. Extract the Icon Inventory
For each `@design-systems/icons` icon:
- **Icon name**
- **Size** being used
- **Context** (what it represents)

## 6. Document Layout Structure
For each page:
- Grid/Flexbox structure
- Responsive breakpoints and behavior
- Component hierarchy (what nests inside what)

## 7. Generate the Spec

```
## Design Specification

### Overview
[One paragraph describing the prototype — number of pages, overall purpose]

### Pages
| Page | Path | Description |
|------|------|-------------|

### Component Inventory
| Component | Package | Props | Page(s) | Instances |
|-----------|---------|-------|---------|-----------|

### Token Inventory
| Token | Category | Applied To | Purpose |
|-------|----------|------------|---------|

### Icon Inventory
| Icon | Size | Context |
|------|------|---------|

### Layout Structure
[Per-page layout description with breakpoint behavior]

### Dependencies
```
yarn add @ids-ts/button @ids-ts/... @design-systems/icons
```

### Implementation Notes
- [Key architectural decisions]
- [Any custom CSS beyond tokens]
- [Interaction behavior]
- [Accessibility requirements]

### Files
- `src/App.tsx` — Router shell with page registry
- `src/pages/[Name].tsx` — Page components
- `src/styles/[Name].module.css` — Page styles
```

## Rules
- Read the actual code — extract real values, don't guess
- Include every component, token, and icon — nothing left undocumented
- List exact props and values, not just component names
- Note anything custom that isn't provided by IDS
- Keep it developer-friendly — this is a spec, not a tutorial

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.
