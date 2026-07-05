---
name: token-preview
description: Render a visual preview of IDS design tokens in the prototype. Use when the user wants to see colors, spacing, or typography tokens as a visual reference.
argument-hint: "token category (colors, spacing, typography, all)"
user-invocable: true
model: inherit
---

Render a visual token preview: $ARGUMENTS

## Before Starting

If no token category is specified in `$ARGUMENTS`, ask: "Which token category do you want to preview — colors, spacing, typography, elevation, radius, or all?" Wait for the answer before proceeding.

1. **Determine the category** from `$ARGUMENTS`:
   - "colors" or "color" → color token swatches
   - "spacing" or "space" → spacing scale visualization
   - "typography" or "type" or "fonts" → typography samples
   - "elevation" or "shadows" → elevation/shadow preview
   - "radius" or "border-radius" → border radius preview
   - "all" or no argument → show all categories

2. **Read the relevant token files:**
   - Colors: `.cursor/rules/tokens/intuit/color.mdc`
   - Spacing: `.cursor/rules/tokens/intuit/space.mdc`
   - Typography: `.cursor/rules/tokens/intuit/fontSize.mdc`, `fontWeight.mdc`, `fontFamily.mdc`, `lineHeight.mdc`
   - Elevation: `.cursor/rules/tokens/intuit/elevation.mdc`
   - Radius: `.cursor/rules/tokens/intuit/radius.mdc`

3. **Generate a visual preview page** in `src/pages/TokenPreviewPage.tsx` and `src/styles/TokenPreviewPage.module.css` that renders token swatches. Add it to the `PAGES` array in `src/App.tsx`.

   - **Color tokens:** Rows of colored squares with token name and value below each
   - **Spacing tokens:** Bars of increasing width showing each space token
   - **Typography tokens:** Sample text at each font size with the token name
   - **Elevation tokens:** Cards with each elevation level applied
   - **Radius tokens:** Boxes with each border-radius applied

   Use the actual CSS custom properties (e.g., `var(--color-text-primary)`) so the preview is live and theme-aware.

4. **Since this creates a new page**, the designer's existing prototype is preserved. No snapshot is needed.

5. **Start the dev server** with `npm run dev`.

6. **Tell the user** the token preview is at `/#/token-preview` and their prototype is untouched.

Rules:
- Use only `var(--token-name)` syntax — the preview should be live, not hardcoded values
- Group tokens by category with clear headings
- Keep the layout clean and scannable
- Always auto-save before overwriting the prototype

## Evaluation Criteria
1. All token values sourced from the actual token rule files — never guessed
2. Every displayed token uses `var(--token-name)` CSS variable syntax
3. Token categories clearly labeled
4. Output is visually scannable — grouped by category, not a flat list

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Token file for the requested category doesn't exist** — check `.cursor/rules/tokens/` for what's available and offer the closest match
- **Auto-save fails before overwriting** — stop and warn the designer; do not overwrite the prototype until the snapshot is confirmed
- **Token values don't render visibly** — check that `src/styles/intuit.css` is loaded and that the correct `var(--token-name)` syntax is used
