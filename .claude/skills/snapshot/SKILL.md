---
name: snapshot
description: Save the current prototype as a named snapshot. Use when the user wants to save their work before experimenting or making changes.
argument-hint: "snapshot name (e.g., v1, before-sidebar, working-version)"
user-invocable: true
model: inherit
---

Save the current prototype as a named snapshot: $ARGUMENTS

Follow these steps in order:

## Before Starting

If no name was given, ask the designer what to call this snapshot before proceeding. A good name describes the current state (e.g., "before-sidebar", "v2-with-nav", "working-form"). If they're unsure, suggest a name based on what the prototype currently shows.

## 1. Parse the Snapshot Name

- If `$ARGUMENTS` is provided, use it as the snapshot name.
- If no name is given and the designer provided one after being asked, use that.
- As a last resort, generate one from the current timestamp: `snapshot-YYYY-MM-DD-HHmm`.

## 2. Sanitize the Name

Clean the name to be filesystem-safe:
- Convert to lowercase
- Replace spaces with hyphens
- Remove any characters that aren't alphanumeric, hyphens, or underscores
- Trim leading/trailing hyphens

## 3. Check for Existing Snapshot

Check if `.claude/snapshots/<name>/` already exists.
- If it does, **warn the user** and ask for confirmation before overwriting.
- Do NOT proceed until they confirm.

## 4. Capture the Prototype Files

Collect all files that make up the current prototype:
1. `src/App.tsx` — the router shell
2. All `.tsx` files in `src/pages/` — every page component
3. All `.module.css` files in `src/styles/` — **except** `index.css`, `fonts.css`, and `intuit.css`

## 5. Write the Snapshot

1. Create the directory `.claude/snapshots/<name>/`
2. Write `src/App.tsx` → `.claude/snapshots/<name>/App.tsx`
3. For each `src/pages/[File].tsx` → write to `.claude/snapshots/<name>/pages/[File].tsx`
4. For each `src/styles/[File].module.css` → write to `.claude/snapshots/<name>/styles/[File].module.css`

## 6. Write Snapshot Metadata

Generate a one-sentence description of the current prototype by reading the page files and summarizing what they show.

Write `.claude/snapshots/<name>/snapshot.json`:
```json
{
  "name": "<name>",
  "created": "<ISO timestamp>",
  "pages": ["<list of page file names without extension>"],
  "description": "<one sentence description>"
}
```

## 7. Confirm

Tell the user:

> Saved snapshot **<name>** — <page count> page(s) captured. "<description>" Use `/restore <name>` to return to this version.

## Rules

- Never modify the current prototype files when snapshotting
- Always capture ALL pages — a partial snapshot is worse than none
- Keep snapshot names short and filesystem-safe
- The description should be plain language, not code

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:
- **Snapshot write fails mid-way** — tell the designer which files were written before the failure; do not report the snapshot as saved. Ask if they want to retry or continue without saving.
- **No snapshot name provided and designer doesn't respond** — use a timestamp name (`snapshot-YYYY-MM-DD-HHmm`) and proceed.
