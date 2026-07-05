---
name: snapshots
description: List all saved prototype snapshots. Use when the user wants to see what versions they've saved.
user-invocable: true
model: inherit
---

List all saved prototype snapshots.

Follow these steps in order:

## 1. Find All Snapshots

List all directories inside `.claude/snapshots/`.

## 2. Handle Empty State

If no snapshots exist, tell the user:

> No snapshots saved yet. Use `/snapshot <name>` to save your current prototype before making big changes.

Then stop — do not continue to step 3.

## 3. Build the Snapshot List

For each snapshot directory:

1. **Read `snapshot.json`** if it exists — use `name`, `created`, `pages`, and `description` from it
2. **Legacy fallback** (no `snapshot.json`): read the file modification timestamp of `App.tsx` and generate a one-sentence description from the first 15–20 lines of `App.tsx`. Note it as "(legacy format)".

## 4. Sort and Display

Sort snapshots by date, **newest first**.

Present as a formatted list:

> **Your Saved Snapshots**
>
> 1. **<name>** — <date> — <description> (<page count> page(s))
> 2. **<name>** — <date> — <description> (<page count> page(s))
> ...

## 5. Remind About Commands

After the list, add:

> Use `/restore <name>` to go back to a saved version, or `/snapshot <name>` to save a new one.

## Rules

- Sort by date, newest first
- Read `snapshot.json` first — prefer its data over filesystem inspection
- Keep the description brief — just enough to identify the version
- Never modify any files when listing snapshots
- If a snapshot directory is missing both `snapshot.json` and `App.tsx`, skip it and note it as "(incomplete)"
