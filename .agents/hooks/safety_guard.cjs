/**
 * Lifecycle Hook: Safety Guard (PreToolUse)
 * Intercepts run_command calls and prompts confirmation on destructive operations.
 */

const fs = require('fs');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf-8');
  } catch (err) {
    return '';
  }
}

function runSafetyCheck() {
  const rawInput = readStdin().trim();
  if (!rawInput) {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawInput);
  } catch (e) {
    console.log(JSON.stringify({ decision: 'allow' }));
    return;
  }

  const toolName = payload?.toolCall?.name;
  const commandLine = payload?.toolCall?.args?.CommandLine || '';

  if (toolName === 'run_command' && commandLine) {
    const dangerousPatterns = [
      { pattern: /git\s+push\s+.*(--force|-f\b)/i, reason: 'Force push can overwrite remote git history.' },
      { pattern: /git\s+reset\s+--hard/i, reason: 'Hard git reset will discard uncommitted changes.' },
      { pattern: /git\s+clean\s+-f/i, reason: 'Git clean forcefully removes untracked files.' },
      { pattern: /rm\s+-rf\s+(\/|\*|\.\/|\.\.\/)/i, reason: 'Recursive delete command on root/parent directory.' },
      { pattern: /drop\s+(database|table)\b/i, reason: 'Destructive SQL DROP operation.' },
      { pattern: /npm\s+publish\b/i, reason: 'Publishing packages to npm registry.' }
    ];

    for (const check of dangerousPatterns) {
      if (check.pattern.test(commandLine)) {
        console.log(
          JSON.stringify({
            decision: 'ask',
            reason: `Safety Guard: ${check.reason} (Command: "${commandLine}")`
          })
        );
        return;
      }
    }
  }

  console.log(JSON.stringify({ decision: 'allow' }));
}

runSafetyCheck();
