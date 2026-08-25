#!/usr/bin/env bash
# Auto-commit and push uncommitted changes to origin master.
# Does nothing (no error) if the working tree is clean.
set -u  # treat unset vars as errors, but do NOT use -e (we handle errors ourselves)

cd /home/bearded/Documents/GitHub/Cross_Ecom_Apps

echo "===== GIT STATUS ====="
git status

# Stage everything
git add -A

# Check if there is anything staged to commit
if git diff --cached --quiet; then
    echo ""
    echo "===== RESULT ====="
    echo "Nothing to commit. Working tree is clean. No push performed."
    exit 0
fi

# There are staged changes — commit with the specified identity
TS="$(date '+%Y-%m-%d %H:%M:%S')"
COMMIT_MSG="Auto-commit: sync changes (${TS})"

echo ""
echo "===== STAGED CHANGES (short) ====="
git status -s

git -c user.name="Bengali Auto-Bot" -c user.email="bengali@example.com" commit -m "${COMMIT_MSG}"

echo ""
echo "===== COMMIT RESULT ====="
echo "Committed as: Bengali Auto-Bot <bengali@example.com>"
echo "Commit message: ${COMMIT_MSG}"

echo ""
echo "===== GIT PUSH ====="
git push origin master

echo ""
echo "===== PUSH RESULT ====="
git status --short
echo "Push finished."
