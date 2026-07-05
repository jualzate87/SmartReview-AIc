---
name: navigation
description: Add navigation to the prototype. Use when the user wants tabs, sidebar nav, pagination, step flow, breadcrumbs, or accordion navigation.
argument-hint: "nav type (tabs, sidebar, pagination, step-flow, accordion)"
user-invocable: true
model: inherit
---

Add navigation to the prototype: $ARGUMENTS

## Before Starting

If the navigation type isn't clear from `$ARGUMENTS`, ask: "What type of navigation do you want — tabs, sidebar, pagination, step-flow, or accordion?" Also ask which page it should be added to if multiple pages exist. Wait for the answer before proceeding.

## 1. Read the Navigation Patterns
Read `.claude/skills/navigation/templates/nav-patterns.md` for available navigation patterns and their implementations.

## 2. Read Component Rules
Based on the navigation type, read the relevant component rule files:
- **Tabs:** `.cursor/rules/components/tabs.mdc`
- **Sidebar:** `.cursor/rules/components/leftnavigation.mdc`
- **Pagination:** `.cursor/rules/components/pagination.mdc`
- **Step flow:** `.cursor/rules/components/stepflow.mdc`
- **Accordion:** `.cursor/rules/components/accordion.mdc`

Also read `.cursor/rules/design-system.mdc` for core rules.

## 3. Match the Request
Identify which navigation pattern best matches:
- **tabs** — horizontal tab bar for switching between content sections
- **sidebar** — vertical left navigation for app-level navigation
- **pagination** — numbered page navigation for paginated content
- **step-flow** — sequential step indicator for multi-step processes
- **accordion** — expandable/collapsible sections

## 4. Read the Current Prototype
Read `src/App.tsx` to get the PAGES array. Then read the target page file in `src/pages/` and its matching CSS module in `src/styles/` to understand the existing structure. The navigation should integrate with what's already there.

## 5. Add the Navigation
Update the target page file and its matching CSS module:
- Add the navigation component with proper props
- Wire up basic state management for active tab/page/step
- Include realistic labels for navigation items
- Ensure it integrates with the existing layout

## 6. Install & Preview
Install missing packages with `yarn add`, start the dev server with `npm run dev`.

## 7. Explain & Customize
Describe what was added and offer to:
- Rename navigation items
- Add/remove items
- Change the navigation type
- Adjust the position or style

## Evaluation Criteria
1. Navigation component from `@ids-ts/*`
2. Component CSS imported
3. All styling via design tokens
4. Basic state management for active item
5. Keyboard accessible
6. Integrates with existing prototype layout

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Navigation type not recognized** — list the five supported types (tabs, sidebar, pagination, step-flow, accordion) and ask the designer to pick one
- **Navigation conflicts with existing layout** — describe the conflict and ask if they want to replace the existing structure or integrate alongside it
- **Missing navigation package** — run `yarn add @ids-ts/<package>` for the relevant component before proceeding
