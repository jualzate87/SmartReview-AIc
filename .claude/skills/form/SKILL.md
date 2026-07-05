---
name: form
description: Build a form with IDS components from a list of fields. Use when the user wants to create a form with text fields, dropdowns, checkboxes, validation, or other form elements.
argument-hint: "list of form fields (e.g., name, email, message)"
user-invocable: true
model: inherit
---

Build an IDS form with these fields: $ARGUMENTS

## Before Starting

Ask: "Should this form go on a new page, or would you like it added to an existing one?" If a new page, ask what to name it. Wait for the answer before proceeding.

## 1. Read the Form Patterns
Read `.claude/skills/form/templates/form-patterns.md` for field type mapping and validation patterns.

## 2. Read Component Rules
Read the rule files for form-related components:
- `.cursor/rules/components/textfield.mdc`
- `.cursor/rules/components/textarea.mdc`
- `.cursor/rules/components/dropdown.mdc`
- `.cursor/rules/components/checkbox.mdc`
- `.cursor/rules/components/radio.mdc` (if radio buttons needed)
- `.cursor/rules/components/datepicker.mdc` (if date fields needed)
- `.cursor/rules/components/switch.mdc` (if toggles needed)
- `.cursor/rules/components/inlinevalidationmessage.mdc`
- `.cursor/rules/components/button.mdc`

Read `.cursor/rules/design-system.mdc` for core rules.

## 3. Parse the Field List
For each field the user listed, determine:
- **Field type:** text, email, password, number, date, select, checkbox, radio, textarea, toggle
- **Label:** Human-readable label from the field name
- **Validation:** Required? Pattern? Min/max length?
- **IDS component:** Which `@ids-ts/*` component to use

Use the field type mapping from `form-patterns.md`.

## 4. Build the Form
**If adding to an existing page:** Write to that page file and its matching CSS module.

**If creating a new page:**
1. Create `src/pages/[Name].tsx`
2. Create `src/styles/[Name].module.css`
3. Add the import and entry to `PAGES` in `src/App.tsx`

Include:
- Proper `<form>` element with `onSubmit` handler
- Labels for every field (accessibility)
- Validation messages for required fields
- Submit and cancel buttons
- Logical field grouping with spacing
- Responsive layout (single column on mobile, optionally 2-column on desktop)

## 5. Install & Preview
Install missing packages with `yarn add`, start the dev server with `npm run dev`.

## 6. Explain & Customize
List the fields created, their types, and validation rules. Offer to:
- Add more fields
- Change field types
- Adjust validation rules
- Change the layout (single/multi column)

## Evaluation Criteria
1. All form components from `@ids-ts/*`
2. Every component CSS imported
3. All spacing/styling via design tokens
4. Every field has an accessible label
5. Validation messages use `@ids-ts/inline-validation-message`
6. Form is inside a `<form>` element
7. Responsive layout

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Field type is ambiguous** — ask the designer what kind of input is needed (e.g., "Is 'phone' a text field or a formatted number input?") before building
- **A required package isn't installed** — run `yarn add @ids-ts/<package>` for each missing component before writing code
- **Form layout conflicts with the existing page** — describe the conflict and ask if they want to restructure or place the form on a new page
