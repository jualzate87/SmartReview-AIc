Find the right IDS design token for: $ARGUMENTS

## What to Do

1. **Figure out the token category** from the description:
   - Colors (text, background, border, status) → read `.cursor/rules/tokens/intuit/color.mdc`
   - Spacing (padding, margin, gap) → read `.cursor/rules/tokens/intuit/space.mdc`
   - Font size → read `.cursor/rules/tokens/intuit/fontSize.mdc`
   - Font weight → read `.cursor/rules/tokens/intuit/fontWeight.mdc`
   - Font family → read `.cursor/rules/tokens/intuit/fontFamily.mdc`
   - Line height → read `.cursor/rules/tokens/intuit/lineHeight.mdc`
   - Border radius → read `.cursor/rules/tokens/intuit/radius.mdc`
   - Shadows/elevation → read `.cursor/rules/tokens/intuit/elevation.mdc`
   - Opacity → read `.cursor/rules/tokens/intuit/opacity.mdc`
   - Animation timing → read `.cursor/rules/tokens/intuit/duration.mdc`
   - Animation easing → read `.cursor/rules/tokens/intuit/ease.mdc`

   If unsure which category, read `.cursor/rules/tokens.mdc` for the full overview.

2. **Search the token file** for tokens matching the description.

3. **Present the best matches** in a clear format:
   - **Token name** — the CSS variable (e.g., `--color-status-error`)
   - **Value** — what it resolves to (e.g., `#D13B3B`)
   - **Usage** — a ready-to-copy CSS snippet: `color: var(--color-status-error);`

4. **Show alternatives** if there are related tokens nearby (e.g., if they asked for "error red", also show `--color-status-error-secondary` and `--color-status-error-tertiary`).

5. **Remind about semantic tokens** — if the designer is asking with a raw value like "blue #205EA3", point them to the semantic token instead of a primitive one. Semantic tokens adapt to themes; primitives don't.
