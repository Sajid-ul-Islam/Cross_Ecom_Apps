#!/usr/bin/env bash
# Auto-commit + push script for Cross_Ecom_Apps
# Only commits if there are actual changes; does NOT fail if the tree is clean.
set -u

cd /home/bearded/Documents/GitHub/Cross_Ecom_Apps

# This script's own filename, so it doesn't commit itself on every run.
SELF="$(basename "$0")"

echo "=== Git status summary ==="
git status

# Check for ANY changes: tracked (staged/unstaged) OR untracked files,
# EXCLUDING this script itself. Empty output == clean tree.
PORCELAIN="$(git status --porcelain)"
CHANGED="$(printf '%s\n' "$PORCELAIN" | grep -v -F "$SELF" | sed '/^$/d')"
if [ -z "$CHANGED" ]; then
  echo ""
  echo "=== Result ==="
  echo "Working tree clean (excluding this script) — nothing to commit, nothing to push."
  exit 0
fi

echo "Detected changes to commit (excluding self):"
printf '%s\n' "$CHANGED"
echo ""

# Stage everything (including untracked files) except this script
git add -A
git reset -q -- "$SELF"

# Re-check after staging (safety: ignore-only files won't appear)
if git diff --cached --quiet; then
  echo ""
  echo "=== Result ==="
  echo "No meaningful changes to commit after staging — nothing to push."
  exit 0
fi

# Commit using the bengali@example.com identity
TS="$(date '+%Y-%m-%d %H:%M:%S')"
COMMIT_MSG="Auto-commit: sync changes (${TS})"

git -c user.name="bengali" -c user.email="bengali@example.com" commit -m "$COMMIT_MSG"

echo ""
echo "=== Committing with identity bengali <bengali@example.com> ==="
echo "Commit message: $COMMIT_MSG"

# Push to origin master
echo ""
echo "=== Pushing to origin master ==="
git push origin master

echo ""
echo "=== Done ==="
