/**
 * Monorepo Unified Verification Script
 * Cross_Ecom_Apps (API + Web + Mobile)
 *
 * Runs typechecks and automated unit tests across the monorepo.
 */

const { execSync } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');

console.log('====================================================');
console.log('🚀 Running Cross_Ecom_Apps Unified Verification');
console.log('====================================================\n');

function runStep(title, command, cwd = repoRoot) {
  console.log(`▶ [STEP] ${title}...`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
    console.log(`✔ [PASS] ${title}\n`);
    return true;
  } catch (error) {
    console.error(`❌ [FAIL] ${title} (Command: ${command})\n`);
    return false;
  }
}

let allPassed = true;

// 1. Web Typecheck
if (!runStep('Web Typecheck (Next.js)', 'npm run typecheck:web')) {
  allPassed = false;
}

// 2. Mobile Typecheck
if (!runStep('Mobile Typecheck (Expo / React Native)', 'npm run typecheck:mobile')) {
  allPassed = false;
}

// 3. Monorepo Automated Unit Tests (Web + Mobile)
if (!runStep('Monorepo Unit Tests (Pricing, BOGO, Cashback, AI & Usecases)', 'npm test')) {
  allPassed = false;
}

console.log('====================================================');
if (allPassed) {
  console.log('🎉 ALL MONOREPO VERIFICATION CHECKS PASSED (0 ERRORS)');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('⚠️ ONE OR MORE CHECKS FAILED. See details above.');
  console.log('====================================================');
  process.exit(1);
}
