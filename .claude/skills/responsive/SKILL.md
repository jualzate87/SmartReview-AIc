---
name: responsive
description: Make the current prototype responsive across mobile, tablet, and desktop breakpoints. Use when the user wants responsive behavior or media queries added.
user-invocable: true
model: inherit
---

Make the current prototype responsive across all breakpoints.

## Before Starting

If there are multiple pages, ask: "Which page should I make responsive, or should I do all of them?" Wait for the answer before reading page files.

## 1. Read the Current Prototype
Read `src/App.tsx` to get the page list.
Read the target page file(s) in `src/pages/` and their CSS modules in `src/styles/`.

## 2. Read the Rules
Read `.cursor/rules/design-system.mdc` for core rules.
Read `.cursor/rules/tokens/intuit/space.mdc` for spacing tokens.
Read `.cursor/rules/tokens/intuit/fontSize.mdc` for font size tokens.

## 3. Analyze the Layout
Identify:
- Layout containers (Grid/Flexbox)
- Sidebar patterns
- Multi-column grids
- Navigation elements
- Typography scale
- Fixed-width elements that could break on small screens

## 4. Plan Responsive Transformations
For each breakpoint, determine what changes:

| Breakpoint | Width | Common Changes |
|------------|-------|---------------|
| Mobile | 320px+ | Single column, stacked elements, hidden sidebars, hamburger nav, smaller headings |
| Tablet | 768px+ | 2-column layouts, collapsible sidebars, medium headings |
| Desktop | 1200px+ | Full layout, all sidebars visible, full navigation, large headings |

## 5. Apply Media Queries
Update the target page's CSS module in `src/styles/` with mobile-first media queries:

```css
/* Base styles = mobile */

@media (min-width: 768px) {
  /* Tablet overrides */
}

@media (min-width: 1200px) {
  /* Desktop overrides */
}
```

Use `min-width` (mobile-first), not `max-width`.

## 6. Modify JSX if Needed
If responsive behavior requires structural changes (e.g., hiding a sidebar component, switching from a table to card list), update the target page component in `src/pages/`.

## 7. Add Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 8. Test & Report
Start the dev server with `npm run dev` and report:
- What changes at each breakpoint
- Any elements that needed special handling
- Touch target sizes on mobile (minimum 44x44px)

## Rules
- Mobile-first approach — base styles target mobile
- Use `min-width` media queries, not `max-width`
- Use design tokens for all spacing and typography adjustments
- Don't hide critical content on mobile — reflow it
- Maintain 44x44px minimum touch targets on mobile
- Test at 320px, 768px, and 1200px

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Component doesn't reflow well at a breakpoint** — show the designer what's possible and ask if they'd prefer a structural change (e.g., switching from table to card list on mobile)
