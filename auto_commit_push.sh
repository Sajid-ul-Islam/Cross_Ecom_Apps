#!/usr/bin/env bash
set -uo pipefail

REPO_DIR="/home/bearded/Documents/GitHub/Cross_Ecom_Apps"
cd "$REPO_DIR" || { echo "ERROR: cannot cd to $REPO_DIR"; exit 1; }

echo "=== Git Status (pre-add) ==="
git -c color.ui=always status

echo ""
echo "=== Staging all changes ==="
git add -A

# Check if there is anything staged
if git diff --cached --quiet; then
    echo ""
    echo "=== Working tree clean — nothing to commit ==="
    echo "(No new changes after staging.)"
    exit 0
fi

# Build commit timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MSG="Auto-commit: sync changes (YYYY-MM-DD HH:MM:SS)"
COMMIT_MSG=$(echo "$COMMIT_MSG" | sed "s/YYYY-MM-DD HH:MM:SS/${TIMESTAMP}/")

# Commit using the bengali@example.com identity
echo ""
echo "=== Committing ==="
COMMIT_OUTPUT=$(git -c user.name="Bengali User" \
                 -c user.email="bengali@example.com" \
                 commit -m "$COMMIT_MSG" 2>&1)
echo "$COMMIT_OUTPUT"

if [ $? -ne 0 ]; then
    echo ""
    echo "=== Commit failed ==="
    echo "$COMMIT_OUTPUT"
    exit 1
fi

# Push to origin master
echo ""
echo "=== Pushing to origin master ==="
PUSH_OUTPUT=$(git push origin master 2>&1)
echo "$PUSH_OUTPUT"

PUSH_EXIT=$?
if [ $PUSH_EXIT -ne 0 ]; then
    echo ""
    echo "=== Push may have failed ==="
    exit $PUSH_EXIT
fi

echo ""
echo "=== Final Git Status ==="
git -c color.ui=always status
