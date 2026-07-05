---
name: compose
description: Help combining multiple IDS components together. Use when the user wants to compose several components into a cohesive UI pattern.
argument-hint: "components to combine"
user-invocable: true
model: inherit
---

Help compose these IDS components together: $ARGUMENTS

## Before Starting

Ask: "Which page should this composition be added to, or would you like a new one?" If the components to compose aren't specified in `$ARGUMENTS`, ask which ones they have in mind. Wait for the answer before proceeding.

## 1. Identify the Components
Parse the user's request to identify which `@ids-ts/*` components they want to combine. If the names are ambiguous, clarify.

## 2. Read Component Rules
For each component, read its rule file at `.cursor/rules/components/<name>.mdc`. Pay attention to:
- Required props
- Children/slot patterns
- Composition constraints (what can nest inside what)

## 3. Read the Design System Rules
Read `.cursor/rules/design-system.mdc` for overall composition patterns.

## 4. Design the Composition
Figure out how the components fit together:
- **Nesting:** Which component is the parent, which are children?
- **Layout:** How should they be arranged? (Flexbox/Grid)
- **Spacing:** What tokens should control gaps between components?
- **Interactions:** Do any components need to share state?

## 5. Generate the Code
Write a working composition example showing:
- All required imports (components + CSS)
- The JSX with correct nesting and props
- Any CSS needed for layout (using tokens)

## 6. Offer to Add
Ask if the designer wants this composition added to their prototype. If yes, add it to the target page file and its matching CSS module.

## Example Compositions
- **Card with actions:** `Cards` → `Typography` + `Button`
- **Form field with validation:** `TextField` + `InlineValidationMessage`
- **Navigation with badges:** `Tabs` + `Badge`
- **Header with dropdown:** `ProductHeader` + `DropdownButton`
- **Modal with form:** `ModalDialog` → `TextField` + `Dropdown` + `Button`

## Evaluation Criteria
1. All components from `@ids-ts/*` only
2. Every component CSS imported
3. All spacing/styling via design tokens
4. No wrapper components — use IDS components directly
5. Correct nesting and prop usage per `.mdc` files

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Component nesting isn't supported** — check the `.mdc` file for composition constraints and suggest a valid alternative structure
- **Components conflict visually** — ask the designer which one should take visual precedence, then adjust spacing and layout tokens accordingly
- **A component name is ambiguous** — list the closest matches from the available `@ids-ts/*` packages and ask the designer to confirm
