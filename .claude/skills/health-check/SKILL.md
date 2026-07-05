---
name: health-check
description: Run a comprehensive health check on the current prototype — combines accessibility audit, style compliance, and token validation in one pass.
user-invocable: true
model: inherit
---

Run a full health check on the current prototype, combining token validation, accessibility auditing, and style compliance into a single report.

## Before Starting

Do not ask for arguments — this skill takes none. Run all three checks against the entire prototype automatically.

## 1. Read the Current Prototype

Read `src/App.tsx` to get the list of pages.
Read all page files in `src/pages/` and their matching CSS modules in `src/styles/`.

## 2. Token Compliance Check

Run `yarn check-tokens` and capture the output.

Parse the results:

- Count the total number of violations
- Identify the top 3 most impactful violations (if any)
- Determine pass/fail: **Pass** if zero violations, **Fail** if any violations

## 3. Accessibility Audit

Delegate to the **accessibility-auditor** agent.

Run the full accessibility audit as defined in the `audit-a11y` skill:

- Semantic structure (headings, landmarks, lists)
- ARIA and labels (accessible names, form labels, alt text)
- Keyboard navigation (focus order, traps, escape key)
- Color and contrast (contrast ratios, semantic color tokens)
- IDS-specific (required a11y props, toast roles, modal focus, validation messages)

Capture:

- Total issue count (critical + warnings)
- The top 3 most critical issues (if any)
- Pass/fail: **Pass** if zero critical issues, **Fail** if any critical issues

## 4. Style Compliance Audit

Delegate to the **style-validator** agent.

Run the full style compliance audit as defined in the `audit-style` skill:

- Forbidden libraries (MUI, Chakra, Ant, Tailwind, styled-components, SASS, Emotion, inline SVGs)
- Token compliance in CSS (hardcoded colors, spacing, font sizes, font weights, font families, border radius, box-shadows)
- Component imports in TSX (matching CSS imports, correct packages, no wrappers, no non-IDS components)
- Layout and structure (no absolute positioning for layout, flexbox/grid used, code in correct files)

Capture:

- Total violation count
- The top 3 most impactful violations (if any)
- Pass/fail: **Pass** if zero violations, **Fail** if any violations

## 5. Compile the Health Report

Present results in this exact format:

```
## Prototype Health Check

### Token Compliance — [PASS or FAIL]
[X violations found]
[If any violations, list top 3:]
1. **[Issue]** — `[file:line]` — Fix: [token replacement]
2. **[Issue]** — `[file:line]` — Fix: [token replacement]
3. **[Issue]** — `[file:line]` — Fix: [token replacement]

### Accessibility — [PASS or FAIL]
[X issues found (Y critical, Z warnings)]
[If any issues, list top 3:]
1. **[Issue]** — `[file:line]` — Fix: [specific change]
2. **[Issue]** — `[file:line]` — Fix: [specific change]
3. **[Issue]** — `[file:line]` — Fix: [specific change]

### Style Compliance — [PASS or FAIL]
[X violations found]
[If any violations, list top 3:]
1. **[Issue]** — `[file:line]` — Fix: [specific change]
2. **[Issue]** — `[file:line]` — Fix: [specific change]
3. **[Issue]** — `[file:line]` — Fix: [specific change]

---

### Overall: [HEALTHY or ACTION NEEDED]

[If HEALTHY:]
All checks passed — your prototype is in great shape.

[If ACTION NEEDED:]
Here's what to address:
- [ ] [Action item 1 — plain language]
- [ ] [Action item 2]
- [ ] [Action item 3]

Want me to auto-fix these issues?
```

## 6. Determine Overall Health

- **Healthy** — All three sections pass
- **Action Needed** — Any section has failures. List every actionable item as a checkbox.

## 7. Offer to Fix

If there are any issues, ask the designer if they want the agent to auto-fix them. Be clear about what will change and what won't.

## Rules

- Read the actual code — never assume what's there
- Run all three checks every time — do not skip any section
- Show every section in the report, even if it passes
- Keep the report concise — top 3 issues per section, not an exhaustive list
- Use plain language throughout — no TypeScript errors, no stack traces
- Provide specific file paths and line numbers for every issue
- Provide the exact fix (token name, prop, or code change) for every issue

## On Error

If `yarn check-tokens` fails to run, skip that section and note it:

```
### Token Compliance — SKIPPED
The token validation script is not available. The style compliance check below covers token usage in CSS.
```

Continue with the remaining checks. Never let one failed check block the entire health report.
