---
name: table-builder
description: Build a data table with IDS components from a list of columns. Use when the user wants to create a table with data, sorting, pagination, or row actions.
argument-hint: "column names (e.g., name, email, status, date)"
user-invocable: true
model: inherit
---

Build an IDS data table with these columns: $ARGUMENTS

## Before Starting

Ask: "Should this table go on a new page, or would you like it added to an existing one?" If a new page, ask what to name it. Wait for the answer before proceeding.

## 1. Read the Table Patterns
Read `.claude/skills/table-builder/templates/table-patterns.md` for column type mapping, sample data patterns, and configuration options.

## 2. Read Component Rules
Read the rule files for table-related components:
- `.cursor/rules/components/table.mdc`
- `.cursor/rules/components/pagination.mdc`
- `.cursor/rules/components/badge.mdc` (for status columns)
- `.cursor/rules/components/button.mdc` (for actions)
- `.cursor/rules/components/dropdownbutton.mdc` (for row action menus)
- `.cursor/rules/components/textfield.mdc` (for search)
- `.cursor/rules/components/chip.mdc` (for filters)
- `.cursor/rules/components/typography.mdc`

Read `.cursor/rules/design-system.mdc` for core rules.

## 3. Parse the Column List
For each column the user listed, determine:
- **Column type:** text, email, status, date, number, currency, actions
- **Header label:** Human-readable header from the column name
- **Sortable:** Should this column be sortable?
- **Cell renderer:** Plain text, Badge, Link, formatted date, etc.

Use the column type mapping from `table-patterns.md`.

## 4. Build the Table
Write the table to the page the designer chose (new page in `src/pages/` with a matching CSS module in `src/styles/`, or an existing page). If a new page, add it to the `PAGES` array in `src/App.tsx`.

Include:
- Table header with column labels
- 5-10 rows of realistic sample data
- Status columns rendered as `Badge` components
- A search/filter bar above the table
- Pagination below the table
- Row actions (view, edit, delete) via `DropdownButton`
- Responsive behavior (horizontal scroll on mobile)

## 5. Install & Preview
Install missing packages with `yarn add`, start the dev server with `npm run dev`.

## 6. Explain & Customize
List the columns, their types, and rendering. Offer to:
- Add more columns
- Change column types
- Add/remove sorting
- Adjust sample data
- Add bulk actions

## Evaluation Criteria
1. All components from `@ids-ts/*` only
2. Every component CSS imported (`@ids-ts/<name>/dist/main.css`)
3. All visual values via design tokens (zero hardcoded)
4. Semantic tokens preferred over primitives
5. No wrapper components
6. CSS Modules only
7. Responsive — table scrolls horizontally on small screens

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Column type is ambiguous** — ask the designer what type of data goes in that column (text, number, date, status, etc.) before building
- **A required package isn't installed** — run `yarn add @ids-ts/<package>` for each missing component before writing code
- **Table doesn't fit the existing page layout** — describe the conflict and ask if they want to restructure the layout or create a new page
