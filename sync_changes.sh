#!/usr/bin/env bash
# Auto-commit & push script: commits only if there are staged changes.
set -euo pipefail

REPO_DIR="/home/bearded/Documents/GitHub/Cross_Ecom_Apps"
cd "$REPO_DIR"

# Stage all changes
git add -A

# Check if there is anything staged
if git diff --cached --quiet; then
    echo "Working tree is clean (no changes to commit)."
    echo "--- git status summary ---"
    git status
    exit 0
fi

# Build commit message with timestamp
TS="$(date '+%Y-%m-%d %H:%M:%S')"
COMMIT_MSG="Auto-commit: sync changes (${TS})"

# Commit using the bengali@example.com identity
GIT_AUTHOR_NAME="bengali" GIT_AUTHOR_EMAIL="bengali@example.com" \
GIT_COMMITTER_NAME="bengali" GIT_COMMITTER_EMAIL="bengali@example.com" \
git commit -m "$COMMIT_MSG"

echo "Commit created: ${COMMIT_MSG}"

# Push to origin master
git push origin master

echo "--- git status summary after push ---"
git status
