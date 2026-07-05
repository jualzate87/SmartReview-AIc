---
name: theme
description: Switch the prototype between IDS themes or explore theme token values. Use when the user wants to change the visual theme or test theme compatibility.
argument-hint: "theme name"
user-invocable: true
model: inherit
---

Switch or explore IDS themes: $ARGUMENTS

## Before Starting

If `$ARGUMENTS` doesn't specify a theme or intent, ask: "Do you want to switch to a different theme (e.g., dark, TurboTax, QuickBooks), or would you like to preview and explore the available token values for a theme?" Wait for the answer before proceeding.

## 1. Read Theme Information
Read `.cursor/rules/tokens.mdc` for the overview of available themes and how theming works in IDS.

Read `.cursor/rules/tokens/intuit/color.mdc` to understand the semantic color tokens that change between themes.

## 2. Understand IDS Theming
IDS themes work through CSS custom properties. Semantic tokens (like `--color-text-primary`) resolve to different values depending on the active theme. This is why using semantic tokens is critical — they automatically adapt.

### Available Themes
Check the token files for supported themes. Common IDS themes include:
- **Intuit (default)** — the standard Intuit brand theme
- **Dark** — dark mode variant
- **TurboTax**, **QuickBooks**, **Mint**, **Credit Karma** — product-specific themes

### Additional Theme Token Sets
The following additional token sets exist in `.cursor/rules/tokens/`:
- `gbsgexperimental` — GBSG experimental theme
- `intuitaccountantsuite` — Intuit Accountants Suite theme
- `intuitenterprisesuite` — Intuit Enterprise Suite theme

Read the token files in these directories to explore their available tokens.

## 3. Apply the Theme
The theme is controlled by the CSS loaded in `src/styles/intuit.css` (synced from DDMS CDN).

To switch themes:
- If the requested theme is available as a CDN variant, update the sync script or CSS import
- Show the user how semantic tokens change between themes
- Verify the prototype looks correct under the new theme

## 4. Validate Theme Compatibility
Check the current prototype for theme compatibility:
- [ ] All colors use semantic tokens (not primitives or hardcoded)
- [ ] No color values assume a specific theme (e.g., dark text on assumed-light background)
- [ ] Elevation/shadow tokens adapt to the theme
- [ ] All contrast ratios remain valid

## 5. Report
Explain:
- What theme was applied
- How the visual appearance changed
- Any token compatibility issues found
- Suggestions for improving theme support

## Rules
- Semantic tokens are the key to theme support — always prefer them
- Never hardcode colors — they break when themes change
- Don't edit `src/styles/intuit.css` directly — it's auto-generated
- If a theme isn't available, explain clearly and suggest alternatives

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Requested theme isn't available** — explain which themes are supported and offer the closest alternative
- **Prototype uses hardcoded colors that don't adapt** — flag each instance and offer to fix them using semantic tokens before switching themes
- **Theme switch causes contrast or readability issues** — report specific problem areas and ask if the designer wants to adjust or revert
