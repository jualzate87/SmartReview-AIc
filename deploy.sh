#!/usr/bin/env bash
# Deploy SmartReview-ProtoC to GitHub Pages at jualzate87/SmartReview-AIc.
#
# Builds the app with the correct base path, force-pushes the static output to
# the gh-pages branch, and pushes main. Run this from a terminal outside any
# agent sandbox that blocks pushes to github.com.
#
# One-time setup (skip if already done):
#   git remote add origin https://github.com/jualzate87/SmartReview-AIc.git
#   Then on https://github.com/jualzate87/SmartReview-AIc/settings/pages:
#     Source: Deploy from a branch → Branch: gh-pages / (root)

set -euo pipefail
cd "$(dirname "$0")"

BRANCH="$(git symbolic-ref --short HEAD)"
if [ "$BRANCH" != "main" ]; then
  echo "Refusing to deploy from branch '$BRANCH' — switch to main first." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes present — commit or stash before deploying." >&2
  exit 1
fi

echo "==> Pushing main to origin"
git push origin main

echo "==> Building with GitHub Pages base path"
GITHUB_ACTIONS=true npx vite build

echo "==> Publishing dist/ to gh-pages"
REPO_ROOT="$(pwd)"
WORKTREE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/smartreview-protoc-gh-pages.XXXXXX")"
cleanup() {
  git worktree remove --force "$WORKTREE_DIR" 2>/dev/null || true
  rm -rf "$WORKTREE_DIR"
}
trap cleanup EXIT

# mktemp already created WORKTREE_DIR, but `git worktree add` requires the
# target path not to exist yet.
rmdir "$WORKTREE_DIR"

git worktree add -f "$WORKTREE_DIR" gh-pages 2>/dev/null || {
  # gh-pages branch doesn't exist yet — create it as an orphan in the worktree
  git worktree add -f --detach "$WORKTREE_DIR"
  (cd "$WORKTREE_DIR" && git checkout --orphan gh-pages && git rm -rf . >/dev/null)
}

find "$WORKTREE_DIR" -mindepth 1 -maxdepth 1 -not -name '.git' -exec rm -rf {} +
cp -r "$REPO_ROOT/dist/." "$WORKTREE_DIR/"
cd "$WORKTREE_DIR"
git add -A
git commit -m "Deploy $(date -u +%Y-%m-%dT%H:%M:%SZ)" --allow-empty
git push origin gh-pages --force
cd "$REPO_ROOT"

echo "==> Done. Site will be live at https://jualzate87.github.io/SmartReview-AIc/"
echo "    (first deploy: confirm Pages source = gh-pages branch in repo settings)"
