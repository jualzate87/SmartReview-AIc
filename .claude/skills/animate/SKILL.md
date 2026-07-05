---
name: animate
description: Add animations to the current prototype using IDS duration and easing tokens. Use when the user wants transitions, hover effects, or entrance animations.
argument-hint: "what to animate"
user-invocable: true
model: inherit
---

Add animations to the prototype: $ARGUMENTS

## Before Starting

If there are multiple pages, ask: "Which page should I add animations to?" Wait for the answer before reading any page files.

## 1. Read the Current Prototype
Read `src/App.tsx` to see available pages.
Read the target page file in `src/pages/` and its CSS module in `src/styles/` to understand what elements exist.

## 2. Read Animation Tokens
Read the animation-related token files:
- **Duration:** `.cursor/rules/tokens/intuit/duration.mdc` — timing values (e.g., `--duration-fast`, `--duration-normal`)
- **Easing:** `.cursor/rules/tokens/intuit/ease.mdc` — easing curves (e.g., `--ease-in-out`, `--ease-out`)

## 3. Identify What to Animate
Based on the user's request, determine:
- Which elements need animation
- What type of animation (entrance, exit, hover, transition, loading)
- The appropriate timing and easing

## 4. Apply Animations
Add CSS animations to the target page's CSS module in `src/styles/` using design tokens:

### Common Patterns

**Hover transition:**
```css
.element {
  transition: background-color var(--duration-fast) var(--ease-in-out);
}
```

**Entrance fade-in:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.element {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}
```

**Slide in:**
```css
@keyframes slideIn {
  from { transform: translateY(var(--space-300)); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.element {
  animation: slideIn var(--duration-normal) var(--ease-out);
}
```

**Scale on hover:**
```css
.element {
  transition: transform var(--duration-fast) var(--ease-in-out);
}
.element:hover {
  transform: scale(1.02);
}
```

## 5. Update the Code
Edit the target page's CSS module in `src/styles/` to add the animations. If the animations require class changes, update the page component in `src/pages/` as well.

## 6. Explain What Was Added
Describe the animations in plain language and suggest adjustments.

## Rules
- Use `--duration-*` tokens for all timing — never hardcode `0.3s` or `300ms`
- Use `--ease-*` tokens for all easing — never hardcode `cubic-bezier()`
- Use `--space-*` tokens for any distance values in transforms
- Prefer `transform` and `opacity` for animations (GPU-accelerated)
- Respect `prefers-reduced-motion` — add a media query to disable animations
- Keep animations subtle — this is a business app, not a marketing site

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Animation causes layout issues** — offer to revert the specific animation, simplify it, or try a different animation type
- **Reduced motion query needed but design requires animation** — explain the trade-off and ask how to handle it
