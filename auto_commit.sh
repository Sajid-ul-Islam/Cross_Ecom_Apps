#!/usr/bin/env bash
set -u

cd /home/bearded/Documents/GitHub/Cross_Ecom_Apps || { echo "ERROR: cannot cd to repo"; exit 1; }

echo "=== GIT STATUS (before) ==="
git status --short

echo ""
echo "=== STAGING ==="
git add -A

# Check if anything is staged
if git diff --cached --quiet; then
    echo "No changes to commit. Working tree is clean."
    echo ""
    echo "=== GIT STATUS SUMMARY ==="
    git status -s
    exit 0
fi

# There are staged changes — commit
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Auto-commit: sync changes (${TIMESTAMP})"

echo "Committing staged changes: ${COMMIT_MSG}"
git -c user.email='bengali@example.com' \
    -c user.name='bengali@example.com' \
    commit -m "${COMMIT_MSG}"

echo ""
echo "=== PULL (integrate remote changes before push) ==="
git pull --no-edit -X ours origin master

echo ""
echo "=== PUSH ==="
git push origin master

echo ""
echo "=== GIT STATUS SUMMARY ==="
git status -s
