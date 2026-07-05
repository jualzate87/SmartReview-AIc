# Contributing

This guide is for engineers extending the IDS Prototyping Environment tooling -- component rules, skills, agents, scaffold scripts, and token files. If you are a designer using this environment to build prototypes, see `CLAUDE.md` instead.

## Overview

The IDS Prototyping Environment lets designers build prototypes using real Intuit Design System components via AI assistants (Claude Code and Cursor). The tooling layer consists of:

- **Component rule files** (`.cursor/rules/components/*.mdc`) -- consumed by both Cursor and Claude Code to understand component APIs
- **Token rule files** (`.cursor/rules/tokens/{theme}/{category}.mdc`) -- design token references organized by theme and category
- **Skills** (`.claude/skills/{name}/SKILL.md`) -- slash-command workflows for Claude Code
- **Agents** (`.claude/agents/{name}.md`) -- specialist personas that skills can delegate to
- **Scaffold scripts** (`scripts/scaffold-*.mjs` / `scripts/unscaffold-*.mjs`) -- project-level framework setup with templates in `.templates/`

## Adding a Component Rule

Component rules live at `.cursor/rules/components/{name}.mdc` where `{name}` is the package name without the `@ids-ts/` prefix and without hyphens (e.g., `button.mdc`, `modaldialog.mdc`, `leftnavigation.mdc`).

### Required Structure

Every component rule file must include these sections:

#### 1. Front Matter

```yaml
---
description: Complete guide for using the ComponentName component -- props, variants, design properties, accessibility, and usage patterns
globs:
alwaysApply: false
---
```

- `description` is required and must be non-empty (validated by `validate-rules.mjs`)
- `globs` can be left empty; Cursor uses this to scope when the rule is auto-applied
- `alwaysApply` should be `false` for component rules (only `design-system.mdc` uses `true`)

#### 2. Installation & Import

The section heading must be one of: `## Installation & Import`, `## Installation`, or `## Import`. The validator checks for this.

```markdown
## Installation & Import

\`\`\`bash
yarn add @ids-ts/component-name
\`\`\`

\`\`\`tsx
import { ComponentName } from '@ids-ts/component-name';
import '@ids-ts/component-name/dist/main.css';
\`\`\`
```

#### 3. Props API

The section heading must be one of: `## Props API`, `## Props`, or `## Sub-Components`. The validator checks for this.

Props tables must use a consistent column count across all rows. The validator counts pipe-delimited columns and will fail if any data row has a different column count than the header. Union types inside backticks (e.g., `` `string | number` ``) are handled correctly -- pipes inside backticks are not counted as column separators.

Standard format:

```markdown
## Props API

| Prop       | Type                             | Required | Description         |
| ---------- | -------------------------------- | -------- | ------------------- |
| `size`     | `'small' \| 'medium' \| 'large'` | No       | Button size         |
| `disabled` | `boolean`                        | No       | Disables the button |
```

Do not truncate cell content with `...` -- the validator flags this as an error.

#### 4. Token Usage

List the design tokens the component uses, grouped by category (Color, Space, Font, Size, etc.).

#### 5. Usage Patterns

Describe common usage patterns and features documented in Storybook.

#### 6. Accessibility

Note any ARIA requirements, keyboard interactions, or screen reader considerations.

#### 7. Code Example

A complete, copy-pasteable JSX example showing typical usage with required imports.

#### 8. Composes With

List other IDS components this one is commonly used alongside.

### Full Example

See `.cursor/rules/components/button.mdc` as the canonical reference for a well-structured component rule.

## Adding a Skill

Skills are Claude Code slash commands. Each skill lives in its own directory under `.claude/skills/{name}/` with a `SKILL.md` file.

### SKILL.md Format

```yaml
---
name: skill-name
description: One-line description of what this skill does. Shown in /help output.
argument-hint: "describe what arguments the user provides"
user-invocable: true
model: inherit
---

Instructions for the AI agent when this skill is invoked: $ARGUMENTS

## Before Starting
(confirmation step -- skills should confirm intent before writing code)

## Step-by-step instructions
(numbered sections the agent follows)

## Evaluation Criteria
(checklist the agent verifies before finishing)

## On Error
(how to handle failures -- present options in plain language)
```

Key fields:

- `name` -- must match the directory name; this becomes the `/name` slash command
- `argument-hint` -- shown to the user as a placeholder (e.g., "describe the UI you want to build")
- `user-invocable: true` -- makes it available as a slash command (set `false` for internal-only skills)
- `model: inherit` -- uses whatever model the user has configured
- `$ARGUMENTS` -- replaced at runtime with whatever the user typed after the slash command

### Wiring

Skills are automatically discovered by Claude Code from the `.claude/skills/` directory. No manual registration is needed. To add the skill to the help listing in `CLAUDE.md`, add it to the appropriate section under `## Available Skills`.

### Testing

Invoke the skill with `/skill-name some arguments` in Claude Code and verify the full workflow.

## Adding an Agent

Agents are specialist personas that skills can delegate to for deep, focused work. Each agent is a single markdown file at `.claude/agents/{name}.md`.

### Agent File Format

```yaml
---
name: agent-name
description: When to delegate to this agent -- one sentence.
model: inherit
maxTurns: 15
tools:
  - Read
  - Grep
  - Glob
---

## Role
(who this agent is and what it specializes in)

## Knowledge Base
(which rule files to read before answering)

## Workflow
(numbered steps the agent follows)

## Output Format
(how responses should be structured)

## Collaboration
(how the agent interacts with the user -- when to ask, when to stop)

## Rules
(hard constraints)
```

Key fields:

- `maxTurns` -- limits how many tool-use rounds the agent can take before returning
- `tools` -- restrict which tools the agent can access (agents that only analyze should not have Write/Bash)

### Registering

After creating the agent file, add a row to the agents table in `CLAUDE.md`:

```markdown
| `agent-name` | One-line description of what this agent does |
```

## Adding a Scaffold Framework

Scaffold scripts set up project-level frameworks (e.g., AppShell, GenUX) by copying template files and wiring them into the app. Each framework needs four pieces:

1. **Template directory:** `.templates/{framework}/` -- contains all source files to copy
2. **Scaffold script:** `scripts/scaffold-{framework}.mjs` -- copies templates and installs deps
3. **Unscaffold script:** `scripts/unscaffold-{framework}.mjs` -- removes everything the scaffold added
4. **Package.json scripts:** Add both to `package.json`:
   ```json
   "scaffold:{framework}": "node scripts/scaffold-{framework}.mjs",
   "unscaffold:{framework}": "node scripts/unscaffold-{framework}.mjs"
   ```

### Idempotency Requirements

Both scaffold and unscaffold scripts must be safe to run multiple times:

- **Scaffold:** Check if content is already present before injecting (e.g., `if (appContent.includes('IntuitAssist')) { ... skip ... }`). Check if dependencies are already installed before running `yarn add`.
- **Unscaffold:** Use `existsSync` before removing files. Handle the case where App.tsx has already been cleaned up.

### App.tsx Format Detection

The project supports two App.tsx formats, and scaffold scripts must detect which is active:

- **PAGES array format** (default): Contains `const PAGES = [...]` with route objects. This is the standard multi-page router.
- **AppShell format** (after `scaffold:appshell`): Contains `<AppLayout>` and a different routing structure.

Detection pattern:

```javascript
const isOriginalFormat = appContent.includes('const PAGES')
```

Scripts that inject into App.tsx (like `scaffold-genux.mjs`) must handle both formats with different injection strategies.

### Backup/Restore Pattern

When a scaffold script replaces App.tsx entirely (as `scaffold-appshell` does):

1. **Scaffold:** Back up the original before overwriting:
   ```javascript
   cpSync(appDest, resolve(SRC, 'App.original.tsx'))
   ```
2. **Unscaffold:** Restore from backup:
   ```javascript
   if (existsSync(originalApp)) {
     cpSync(originalApp, appPath)
     rmSync(originalApp)
   }
   ```

When a scaffold script modifies App.tsx in place (as `scaffold-genux` does), the unscaffold script must reverse the exact string transformations using regex replacements.

### Template Directory Structure

Mirror the `src/` directory structure inside `.templates/{framework}/`:

```
.templates/{framework}/
  components/       --> copied to src/components/
  contexts/         --> copied to src/contexts/
  pages/            --> copied to src/pages/
  styles/           --> copied to src/styles/
  assets/           --> copied to src/assets/
  App.{framework}.tsx  --> replaces src/App.tsx (if applicable)
```

### Logging Convention

Use a prefixed log function for clear output:

```javascript
function log(msg) {
  console.log(`[scaffold-{framework}] ${msg}`)
}
```

## Token Rule Files

Token files live at `.cursor/rules/tokens/{theme}/{category}.mdc`. Current themes:

- `intuit` -- the default Intuit theme
- `intuitenterprisesuite` -- Enterprise Suite variant
- `intuitaccountantsuite` -- Accountant Suite variant
- `gbsgexperimental` -- GBSG experimental variant

Categories (same across all themes): `color`, `space`, `fontSize`, `fontWeight`, `fontFamily`, `fontName`, `lineHeight`, `radius`, `elevation`, `opacity`, `duration`, `ease`, `size`.

### Token File Structure

```yaml
---
description: Theme Name - Category Token Library - brief description
globs: ["src/**/*.{ts,tsx,js,jsx,scss,css}"]
alwaysApply: false
---

# Theme Name - Category Token Library

## Primitive Tokens (DO NOT USE DIRECTLY IN PLUGINS)
- `--token-name`: value
...

## Semantic Tokens
- `--semantic-token-name`: value
...
```

The validator checks that token files contain at least one CSS custom property reference (a `--` string). Token files are auto-generated by `yarn sync-tokens` from the DDMS CDN -- do not edit them by hand.

## Running Validation

The rule validator checks all `.mdc` files in `.cursor/rules/` for structural issues:

```bash
# Validate and print results to stdout
yarn validate-rules

# Validate and also write validate-report.md
yarn validate-rules:report
```

### What It Checks

| Check                | Applies To       | Description                                                             |
| -------------------- | ---------------- | ----------------------------------------------------------------------- |
| Front matter exists  | All `.mdc` files | File must start with `---` and have a closing `---`                     |
| Description field    | All `.mdc` files | Front matter must contain a non-empty `description:`                    |
| Code blocks closed   | All `.mdc` files | Every opening ` ``` ` must have a matching closing ` ``` `              |
| Installation section | Component files  | Must have `## Installation & Import`, `## Installation`, or `## Import` |
| Props section        | Component files  | Must have `## Props API`, `## Props`, or `## Sub-Components`            |
| Props table columns  | Component files  | All rows in a props table must have the same column count               |
| No truncated cells   | Component files  | Cell content must not contain `...` mid-content                         |
| Token references     | Token files      | Must contain at least one `--` (CSS custom property)                    |

Exit code is `1` if any errors are found, `0` if all pass.

## Code Style

These rules are enforced across the codebase and apply to all contributed code:

- **CSS Modules only** -- no Tailwind, SASS, styled-components, or CSS-in-JS. Every page gets a `src/styles/{Name}.module.css` file.
- **Design tokens only** -- never hardcode colors, spacing, font sizes, or other visual values. Use `var(--token-name)` from the token system.
- **IDS components only** -- no Material UI, Chakra, Ant Design, Headless UI, Radix, or any other UI library. Use `@ids-ts/*` packages directly.
- **IDS icons only** -- always `@design-systems/icons`, never inline SVGs or third-party icon libraries.
- **Always import component CSS** -- every `@ids-ts/*` component import requires a matching `import '@ids-ts/<name>/dist/main.css'`.
- **No wrapper components** -- use `@ids-ts/*` components directly in JSX, do not create abstractions around them.
- **Flexbox/Grid for layout** -- never absolute positioning unless a specific use case demands it.

### ESLint Enforcement

The `no-restricted-imports` rule in `eslint.config.js` blocks imports from banned libraries at lint time:

- `antd`, `@mui/*`, `@chakra-ui/react`, `@headlessui/react`, `@radix-ui/*` -- blocked with messages directing to `@ids-ts/*`
- `tailwindcss`, `bootstrap` -- blocked as forbidden CSS frameworks
- `classnames`, `clsx` -- blocked to discourage utility-first patterns

Run `yarn lint` to check.

## Architecture Decision: Why Not AST Transforms

The scaffold and unscaffold scripts currently manipulate `App.tsx` using regex-based string operations (e.g., `appContent.replace(/pattern/, replacement)`). This works but is fragile:

- Regex patterns are sensitive to whitespace changes, import ordering, and formatting
- Adding a new scaffold that also injects into App.tsx requires careful ordering of replacements
- The unscaffold regex must exactly reverse what the scaffold did, which is error-prone when the two scripts are edited independently

A more robust approach would be to use `@babel/parser` + `@babel/traverse` + `@babel/generator` to parse App.tsx into an AST, perform structural transforms (add/remove imports, insert/remove JSX elements, modify arrays), and regenerate the source. This would:

- Eliminate the whitespace/ordering class of bugs entirely
- Make it safe for multiple scaffolds to modify App.tsx independently
- Provide clear error messages when the file structure is unexpected

This is approximately a one-day investment. The current regex approach is adequate for the two existing scaffolds (AppShell and GenUX) but should be revisited before adding a third.
