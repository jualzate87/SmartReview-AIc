---
name: help
description: Show a friendly guide to all available commands and skills. Use when the user asks for help, is confused, or seems new to the environment.
user-invocable: true
model: inherit
---

No clarification needed — help is informational only. Output the guide below immediately without asking any questions.

When this skill is invoked, print the following guide directly. Do not read any files — just output this text as-is:

```
# Welcome to the IDS Prototyping Environment

You don't need to be a developer — just describe what you want and I'll build it with real Intuit Design System components.

## Getting Started
- `/prototype a settings page with toggles` — describe any UI and I'll build it
- `/figma <URL>` — paste a Figma link and I'll translate it to code
- `/preview` — see your prototype in the browser at localhost:5174
- `/reset` — start over with a clean slate

## Build Faster
- `/layout sidebar` — start with a layout structure (sidebar, dashboard, split-view, centered, holy-grail)
- `/page settings` — generate a full page (settings, form, list, table, detail, empty-state, error, onboarding)
- `/form name, email, message` — build a form from field names
- `/table-builder name, email, status, date` — build a data table from column names
- `/navigation tabs` — add navigation (tabs, sidebar, pagination, step-flow, accordion)
- `/wireframe dashboard with sidebar` — quick wireframe with skeleton placeholders

## Customize
- `/compose button + modal` — combine components together
- `/animate hover effects` — add animations with IDS tokens
- `/theme dark` — switch themes
- `/responsive` — make it work on mobile, tablet, and desktop
- `/icon-search settings` — find the right icon

## Review & Quality
- `/audit-a11y` — check accessibility (WCAG AA)
- `/audit-style` — check design token compliance
- `/explain` — get a plain-language explanation of what's built
- `/spec` — generate a design specification for developers
- `/compare dropdown vs dropdown-typeahead` — compare two components

## Save Your Work
- `/snapshot v1` — save current prototype
- `/snapshots` — list saved versions
- `/restore v1` — go back to a saved version

## Look Things Up
- `/component button` — look up any IDS component
- `/token-lookup error red` — find the right design token
- `/token-preview` — see a visual reference of token categories
```
