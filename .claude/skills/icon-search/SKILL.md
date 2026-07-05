---
name: icon-search
description: Find an IDS icon by name or description. Use when the user needs to find the right icon from @design-systems/icons.
argument-hint: "what icon to find"
user-invocable: true
model: inherit
---

Find an IDS icon matching: $ARGUMENTS

## 1. Read the Icon Rules
Read `.cursor/rules/icons.mdc` to load the complete list of available icons and their import patterns.

## 2. Search for Matches
Search the icon list for icons matching the user's description. Consider:
- Exact name matches (e.g., "settings" → `Settings`)
- Semantic matches (e.g., "delete" → `Trash`, "close" → `Close`, "add" → `Plus`)
- Category matches (e.g., "navigation" → `ChevronLeft`, `ChevronRight`, `ArrowBack`)

## 3. Present Results
For each matching icon, show:

- **Icon name:** The component name (e.g., `Settings`)
- **Import:**
  ```tsx
  import { Settings } from '@design-systems/icons';
  ```
- **Usage:**
  ```tsx
  <Settings size={24} />
  ```
- **Common sizes:** 16 (small), 20 (default), 24 (medium), 32 (large)

## 4. Show Alternatives
If the exact match isn't clear, show 3-5 related icons and let the designer choose.

## 5. Offer to Add
Ask if the designer wants this icon added to their current prototype. If yes, ask which page it should go on (check `src/pages/` for existing pages).

## Rules
- Only use icons from `@design-systems/icons` — never inline SVGs or third-party icon packs
- Always read `.cursor/rules/icons.mdc` before suggesting icons — don't guess at icon names
- Show the import statement so the designer can see the correct package

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **No icon closely matches the description** — show the 3-5 nearest alternatives and explain the semantic difference between them
- **Icon name is ambiguous** — present all plausible matches (e.g., "Close" vs "X" vs "Cancel") and let the designer choose
- **Designer wants to add the icon but the prototype target isn't clear** — ask which page and which element the icon should be placed on
