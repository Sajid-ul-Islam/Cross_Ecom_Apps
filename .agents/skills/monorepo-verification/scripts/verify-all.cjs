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

// 1. API Typecheck
if (!runStep('API Typecheck (Fastify)', 'npm run typecheck:api')) {
  allPassed = false;
}

// 2. Web Typecheck
if (!runStep('Web Typecheck (Next.js 15)', 'npm run typecheck:web')) {
  allPassed = false;
}

// 3. Mobile Typecheck
if (!runStep('Mobile Typecheck (Expo / React Native)', 'npm run typecheck:mobile')) {
  allPassed = false;
}

// 4. API Automated Unit Tests
if (!runStep('API Unit Tests (Pricing, BOGO, Cashback, Phone, Chatbot)', 'npm test')) {
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
