---
name: restore
description: Restore a previously saved prototype snapshot. Use when the user wants to go back to a saved version.
argument-hint: 'snapshot name to restore'
user-invocable: true
model: inherit
---

Restore a previously saved prototype snapshot: $ARGUMENTS

Follow these steps in order:

## Before Starting

Tell the designer which snapshot you're about to restore and that their current work will be auto-saved first. Do not proceed until they confirm.

Example: "I'm going to restore **before-sidebar**. Your current prototype will be auto-saved first so nothing is lost. Ready to go?"

## 1. Parse the Snapshot Name

Extract the snapshot name from `$ARGUMENTS`.

## 2. Verify the Snapshot Exists

Check if `.claude/snapshots/<name>/` exists and contains `App.tsx`.

- If the snapshot does **not** exist, list all available snapshots (read `snapshot.json` in each directory for the name and description) and ask the user which one they want to restore.
- If no snapshots exist at all, tell the user: "No snapshots found. Use `/snapshot <name>` to save your current prototype first."
- Do NOT proceed until a valid snapshot is identified.

## 3. Auto-Save Current State

Before touching anything, automatically save the current prototype so nothing is lost:

1. Generate a backup name: `before-restore-YYYY-MM-DD-HHmm`
2. Capture all current prototype files (same logic as the `/snapshot` skill):
   - `src/App.tsx`
   - All `src/pages/*.tsx`
   - All `src/styles/*.module.css` (excluding `index.css`, `fonts.css`, `intuit.css`)
3. Write them to `.claude/snapshots/<backup-name>/` preserving `pages/` and `styles/` subdirectories
4. Write a `snapshot.json` with `"name": "<backup-name>"`, current timestamp, and auto-generated description

## 4. Restore the Snapshot

1. Write `.claude/snapshots/<name>/App.tsx` → `src/App.tsx`
2. For each file in `.claude/snapshots/<name>/pages/` → write to `src/pages/`
3. For each file in `.claude/snapshots/<name>/styles/` → write to `src/styles/`

## 5. Remove Orphaned Files

After restoring, check for files in `src/pages/` and `src/styles/` that are NOT present in the restored snapshot. Delete any orphans — they belong to the previous state that was just auto-saved.

## 6. Check for Missing Packages

Read the restored page files and look for any `@ids-ts/*` imports. Check `package.json` to see if all referenced packages are installed.

- If any packages are missing, run `yarn add <package1> <package2> ...` to install them.

## 7. Handle Legacy Snapshots

If the snapshot directory has no `pages/` subdirectory (old format with just `App.tsx` and `App.module.css`):

- Restore `App.tsx` to `src/App.tsx`
- Restore `App.module.css` to `src/styles/App.module.css`
- Note to the designer: "This was a legacy single-page snapshot."

## 8. Show What Changed

After the restore is complete, run `git diff --stat` to get a summary of what changed. Present the results to the designer in plain language:

- Say: "Here's what changed since your snapshot: **X files modified**, **Y lines added**, **Z lines removed**."
- If the diff is small (fewer than 5 files changed), list the specific file names so the designer knows exactly what was affected.
- If the diff is larger, just provide the summary counts.

This gives the designer visibility into what the restore actually did without requiring them to understand git.

## 9. Confirm

Tell the user:

> Restored **<name>** — <page count from snapshot.json> page(s) restored. Your previous state was auto-saved as **<backup-name>**.

## Rules

- Always auto-save before restoring — the user should never lose work
- Always ask for confirmation before restoring (see Before Starting)
- Verify the snapshot exists before doing anything
- Remove orphaned page/style files after restore
- Check for and install missing packages after restore
- Never delete any snapshots during a restore

## On Error

Follow the collaboration protocol in `.cursor/rules/collaboration.mdc`.

Common scenarios:

- **Snapshot is incomplete** — tell the designer what's missing and ask if they want to restore what's available or pick a different snapshot
- **Package install fails after restore** — offer to continue without the missing package (using a placeholder) or try an alternative component
