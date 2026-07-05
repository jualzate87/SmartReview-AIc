---
name: compare
description: Compare two IDS components side by side. Use when the user is deciding between similar components (e.g., Dropdown vs DropdownTypeahead, Modal vs Trowser, Button vs LinkActionButton).
argument-hint: "component A vs component B"
user-invocable: true
model: inherit
---

Compare these IDS components: $ARGUMENTS

## Before Starting

If `$ARGUMENTS` doesn't clearly specify two components, ask: "Which two components would you like to compare?" If both are clear, proceed directly. Also ask: "Are you leaning toward one already, or do you want a neutral comparison?" — this shapes whether the output leads with a recommendation.

1. **Parse the input** — extract two component names from `$ARGUMENTS`. Handle formats like "dropdown vs dropdown-typeahead", "dropdown or typeahead", "modal, trowser".

2. **Read both component rule files** at `.cursor/rules/components/<name>.mdc`. Use the lowercase-no-hyphens naming convention (e.g., `dropdowntypeahead.mdc`, `modaldialog.mdc`, `linkactionbutton.mdc`).

3. **Read the design system rules** at `.cursor/rules/design-system.mdc` for context.

4. **Build a comparison table:**

```
## Component Comparison: <A> vs <B>

| | <A> | <B> |
|---|---|---|
| **Package** | @ids-ts/<a> | @ids-ts/<b> |
| **Purpose** | ... | ... |
| **Key Props** | ... | ... |
| **Supports search/filter** | Yes/No | Yes/No |
| **Keyboard accessible** | ... | ... |
| **Best for** | ... | ... |

### When to use <A>
- [bullet points]

### When to use <B>
- [bullet points]

### Recommendation
[Clear recommendation based on the user's likely need]
```

5. **Offer to add** the recommended component to the prototype.

Rules:
- Always read both `.mdc` files — never guess at props
- If a component doesn't exist, say so and suggest alternatives
- Keep it designer-friendly — focus on "when to use" not API details
- If the two components are very different (not comparable), say so and explain each independently

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **One or both component names aren't recognized** — check `.cursor/rules/design-system.mdc` for the full component list and suggest the closest match by name
- **A rule file doesn't exist for a component** — note this clearly and base the comparison only on what can be confirmed; don't guess at props
- **Components are too different to compare meaningfully** — explain each one independently and ask what the designer is actually trying to decide
