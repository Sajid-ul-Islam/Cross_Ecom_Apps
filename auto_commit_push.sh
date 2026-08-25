#!/usr/bin/env bash
#
# auto_commit_push.sh
#
# Automatically stages, commits (if there are changes), and pushes
# uncommitted changes on the `master` branch.
#
# - Identity: uses bengali@example.com (via env-var override so it
#   works even if the local user.name/user.email differ).
# - Commit only runs when there are staged changes.
# - Never fails loudly when the working tree is clean.
# - Prints a git status summary and the push result.
#
set -uo pipefail

REPO_DIR="/home/bearded/Documents/GitHub/Cross_Ecom_Apps"
BRANCH="master"

# Identity to use for auto-commits
export GIT_AUTHOR_NAME="Bengali User"
export GIT_AUTHOR_EMAIL="bengali@example.com"
export GIT_COMMITTER_NAME="Bengali User"
export GIT_COMMITTER_EMAIL="bengali@example.com"

# --- Ensure we're inside the repo -------------------------------------------
if ! cd "$REPO_DIR" 2>/dev/null; then
  echo "ERROR: repository directory not found: $REPO_DIR" >&2
  exit 1
fi

# Verify this is actually a git repo
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "ERROR: not a git repository: $REPO_DIR" >&2
  exit 1
fi

# --- Stage everything -------------------------------------------------------
git add -A

# --- Determine if there's anything staged -----------------------------------
# Compare the index against HEAD.  If empty, there is nothing to commit.
staged_diff=$(git diff --cached --name-only)

if [ -z "$staged_diff" ]; then
  echo "=== nothing to commit — working tree clean ==="
  echo
  echo "=== git status ==="
  git status
  echo
  echo "=== (no push performed; nothing was committed) ==="
  exit 0
fi

# --- Commit with a timestamped message --------------------------------------
timestamp=$(date '+%Y-%m-%d %H:%M:%S')
commit_msg="Auto-commit: sync changes (${timestamp})"
git commit -m "$commit_msg"
commit_rc=$?

if [ $commit_rc -ne 0 ]; then
  echo "ERROR: git commit failed (exit ${commit_rc})" >&2
  echo "=== current git status ==="
  git status
  exit $commit_rc
fi

# --- Push ---------------------------------------------------------------
echo "=== git status (after commit) ==="
git status
echo
echo "=== pushing ${BRANCH} to origin ==="
push_output=$(git push origin "$BRANCH" 2>&1)
push_rc=$?
echo "$push_output"

if [ $push_rc -ne 0 ]; then
  echo "ERROR: git push failed (exit ${push_rc})" >&2
  exit $push_rc
fi

echo
echo "=== push result: SUCCESS ==="
exit 0
