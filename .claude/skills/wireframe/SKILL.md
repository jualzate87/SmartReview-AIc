---
name: wireframe
description: Generate a quick wireframe using IDS skeleton loading components. Use when the user wants a low-fidelity structural preview before building the full prototype.
argument-hint: "describe the layout (e.g., dashboard with sidebar)"
user-invocable: true
model: inherit
---

Generate a wireframe using IDS skeleton components: $ARGUMENTS

## Before Starting

If multiple pages exist in `src/pages/`, ask: "Which page should I wireframe, or would you like me to create a new one?" Wait for the answer before proceeding.

## 1. Read the Rules
Read `.cursor/rules/components/skeleton.mdc` for the Skeleton component API.
Read `.cursor/rules/design-system.mdc` for core rules.
Read `.cursor/rules/tokens/intuit/space.mdc` for spacing tokens.

## 2. Parse the Layout Description
Identify the structural elements the user wants:
- Header area
- Sidebar / navigation
- Content areas
- Cards / widgets
- Tables / lists
- Forms
- Footer

## 3. Map to Skeleton Elements
Replace content with Skeleton placeholders:

| UI Element | Skeleton Representation |
|-----------|----------------------|
| Heading | `<Skeleton variant="text" width="200px" height="32px" />` |
| Paragraph | Multiple `<Skeleton variant="text" />` lines |
| Avatar | `<Skeleton variant="circle" width="40px" height="40px" />` |
| Button | `<Skeleton variant="rect" width="120px" height="40px" />` |
| Card | `<Skeleton variant="rect" height="200px" />` |
| Image | `<Skeleton variant="rect" height="150px" />` |
| Table row | `<Skeleton variant="text" />` repeated for columns |
| Nav item | `<Skeleton variant="text" width="150px" />` |
| Input field | `<Skeleton variant="rect" height="40px" />` |

## 4. Build the Wireframe
**If replacing an existing page:** Write to that page's existing file (e.g. `src/pages/HomePage.tsx`) and its matching CSS module.

**If creating a new page:**
1. Create `src/pages/[Name].tsx`
2. Create `src/styles/[Name].module.css`
3. Add the import and entry to `PAGES` in `src/App.tsx`

Use:
- `@ids-ts/skeleton` for all placeholder content
- CSS Grid/Flexbox for the layout structure
- Design tokens for spacing
- Proper semantic HTML (header, nav, main, aside, footer)
- Comments in JSX marking what each skeleton represents

Example:
```tsx
{/* Header */}
<header className={styles.header}>
  <Skeleton variant="text" width="150px" height="24px" /> {/* Logo */}
  <Skeleton variant="text" width="300px" height="20px" /> {/* Nav links */}
</header>
```

## 5. Install & Preview
Install `@ids-ts/skeleton` with `yarn add` if needed, start dev server with `npm run dev`.

## 6. Explain & Offer Upgrade
Describe the wireframe structure and ask:
- "Does this layout match what you had in mind?"
- "Want me to fill in real IDS components now?"

## Rules
- Use `@ids-ts/skeleton` for all placeholder content
- Import the skeleton CSS: `import '@ids-ts/skeleton/dist/main.css'`
- Use design tokens for all spacing
- Add JSX comments explaining what each skeleton represents
- Make the wireframe responsive
- Keep it simple — the point is structure, not detail

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Skeleton component not installed** — run `yarn add @ids-ts/skeleton` before proceeding
- **Layout description is too vague** — ask one focused question: "What are the main sections? (e.g., header, sidebar, content cards)"
- **Requested layout conflicts with existing page structure** — show the designer what's already there and ask if they want to replace it or start a new page
