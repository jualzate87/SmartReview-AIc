Look up the IDS component: $ARGUMENTS

## What to Do

1. **Find the component rule file** in `.cursor/rules/components/`. The filenames are lowercase with no hyphens (e.g., `button.mdc`, `dropdown.mdc`, `modaldialog.mdc`, `textfield.mdc`). If the name doesn't match exactly, look for the closest match.

2. **Read the rule file** to understand the component's props, variants, and usage patterns.

3. **Present a concise summary** to the designer:
   - **What it does** — one sentence
   - **Package** — the `@ids-ts/*` package name
   - **Key props** — the most important props with their options
   - **Basic example** — a minimal JSX snippet showing typical usage
   - **Import** — the two import lines needed (component + CSS)

4. **Offer to add it** — Ask if the designer wants this component added to their current prototype.

## Tips
- If the component name is ambiguous (e.g., "input" could be `text-field` or `textarea`), show both options and ask which one they mean.
- If the component doesn't exist in IDS, say so clearly and suggest the closest alternative.
- Keep the explanation designer-friendly — avoid React jargon where possible.
