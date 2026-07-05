---
name: explain
description: Explain the current prototype in plain language. Use when the user wants to understand what components, tokens, and patterns are in their current prototype.
user-invocable: true
model: inherit
---

Explain the current prototype in plain language.

## Before Starting

If there are multiple pages (check `src/App.tsx` PAGES array), ask: "Should I explain all pages, or a specific one?" Wait for the answer before proceeding.

## 1. Read the Current Prototype
Read `src/App.tsx` to get the list of pages.
Read all files in `src/pages/` (or just the specific page if requested).
Read the matching CSS module file(s) in `src/styles/`.

## 2. Identify Everything in Use
- **Components:** List every `@ids-ts/*` component and what it's used for
- **Icons:** List every `@design-systems/icons` icon and its purpose
- **Tokens:** List design tokens used in `App.module.css` and what they control
- **Layout:** Describe the overall layout structure (Flexbox/Grid patterns)

## 3. Present the Explanation

Write a designer-friendly explanation structured as:

### What This Prototype Does
One paragraph describing the overall UI and its purpose.

### Components Used
| Component | Package | Purpose |
|-----------|---------|---------|
| (for each component) |

### Design Tokens Applied
| Token | Property | Purpose |
|-------|----------|---------|
| (for key tokens used) |

### Layout Structure
Describe the layout in plain language — "sidebar on the left, main content on the right, header across the top" etc.

### Interactions
List any interactive behaviors — button clicks, dropdowns opening, form submissions, etc.

### What's Custom vs. IDS
Note anything that's custom CSS vs. provided by IDS components.

## Rules
- Read the actual code — don't guess
- Use designer-friendly language — avoid React jargon
- Be concise but complete — don't skip components or tokens
- If the prototype is empty or minimal, say so clearly

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.
