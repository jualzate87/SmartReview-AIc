#!/usr/bin/env node

/**
 * check-tokens.mjs
 *
 * Validates that all CSS custom property references (var(--name)) in
 * src/styles/*.module.css files correspond to tokens defined in
 * src/styles/intuit.css or by IDS component stylesheets (--ids-* prefix).
 *
 * Usage:
 *   node scripts/check-tokens.mjs          # Report invalid tokens
 *   node scripts/check-tokens.mjs --fix    # Report with fix labels (future use)
 *
 * Exit codes:
 *   0 — all token references are valid
 *   1 — one or more invalid token references found
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const fixMode = process.argv.includes('--fix');

// ---------------------------------------------------------------------------
// Step 1: Parse intuit.css to extract all defined CSS custom property names
// ---------------------------------------------------------------------------

const intuitCssPath = join(ROOT, 'src', 'styles', 'intuit.css');
const intuitCss = readFileSync(intuitCssPath, 'utf-8');

const definedTokens = new Set();

// Match property declarations like `--color-text-primary: #393A3D;`
// These appear as `  --name: value;` inside :root / [data-theme] blocks
const declarationRegex = /^\s*(--[\w-]+)\s*:/gm;
let match;
while ((match = declarationRegex.exec(intuitCss)) !== null) {
  definedTokens.add(match[1]);
}

// ---------------------------------------------------------------------------
// Step 2: Find all .module.css files in src/styles/ and extract var() refs
// ---------------------------------------------------------------------------

const stylesDir = join(ROOT, 'src', 'styles');
const moduleCssFiles = readdirSync(stylesDir)
  .filter((f) => f.endsWith('.module.css'))
  .map((f) => join(stylesDir, f));

// Regex to match var(--name) or var(--name, fallback)
const varRefRegex = /var\((--[\w-]+)/g;

/**
 * @typedef {{ token: string, line: number, column: number, text: string }} TokenRef
 */

/**
 * Extract all var(--name) references from a CSS file, with line numbers.
 * @param {string} filePath
 * @returns {TokenRef[]}
 */
function extractVarRefs(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const refs = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let lineMatch;
    // Reset regex lastIndex for each line since we reuse the regex
    const lineRegex = /var\((--[\w-]+)/g;
    while ((lineMatch = lineRegex.exec(line)) !== null) {
      refs.push({
        token: lineMatch[1],
        line: i + 1,
        column: lineMatch.index + 1,
        text: line.trim(),
      });
    }
  }

  return refs;
}

// ---------------------------------------------------------------------------
// Step 3 & 4: Check each reference against the defined tokens set.
//             Skip tokens starting with --ids- (defined by IDS components).
// ---------------------------------------------------------------------------

/** @type {Map<string, TokenRef[]>} */
const errorsByFile = new Map();
let totalErrors = 0;

for (const file of moduleCssFiles) {
  const refs = extractVarRefs(file);

  for (const ref of refs) {
    // Skip --ids-* tokens — these are defined by @ids-ts component CSS
    if (ref.token.startsWith('--ids-')) {
      continue;
    }

    if (!definedTokens.has(ref.token)) {
      const fileName = basename(file);
      if (!errorsByFile.has(fileName)) {
        errorsByFile.set(fileName, []);
      }
      errorsByFile.get(fileName).push(ref);
      totalErrors++;
    }
  }
}

// ---------------------------------------------------------------------------
// Step 5: Print results
// ---------------------------------------------------------------------------

const label = fixMode ? 'FIXABLE' : 'INVALID';

if (totalErrors === 0) {
  console.log('\x1b[32m%s\x1b[0m', 'All token references are valid.');
  process.exit(0);
} else {
  console.log(
    '\x1b[31m%s\x1b[0m',
    `Found ${totalErrors} ${label.toLowerCase()} token reference${totalErrors === 1 ? '' : 's'}:\n`
  );

  for (const [fileName, errors] of errorsByFile) {
    console.log(`  \x1b[1m${fileName}\x1b[0m`);
    for (const err of errors) {
      console.log(
        `    \x1b[33mline ${String(err.line).padStart(3)}\x1b[0m  [${label}] \x1b[36m${err.token}\x1b[0m`
      );
      console.log(`             ${err.text}`);
    }
    console.log();
  }

  if (fixMode) {
    console.log(
      '\x1b[33m%s\x1b[0m',
      'Note: --fix flag is reserved for future auto-fix support. No changes were made.'
    );
  }

  console.log(
    `\x1b[90mToken source: src/styles/intuit.css (${definedTokens.size} tokens defined)\x1b[0m`
  );
  console.log(
    '\x1b[90mTokens prefixed with --ids-* are assumed valid (defined by IDS components).\x1b[0m'
  );

  process.exit(1);
}
