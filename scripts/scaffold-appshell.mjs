#!/usr/bin/env node

/**
 * scaffold-appshell.mjs
 *
 * Copies the AppShell (Fusion Shell) template files into the project's src/ directory
 * and installs required dependencies.
 *
 * Usage: node scripts/scaffold-appshell.mjs
 */

import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEMPLATES = resolve(ROOT, '.templates/appshell');
const SRC = resolve(ROOT, 'src');

function log(msg) {
  console.log(`[scaffold-appshell] ${msg}`);
}

function copyDir(src, dest) {
  if (!existsSync(src)) {
    console.error(`Template directory not found: ${src}`);
    process.exit(1);
  }
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true });
}

// 1. Copy components
log('Copying components...');
copyDir(resolve(TEMPLATES, 'components'), resolve(SRC, 'components'));

// 2. Copy contexts
log('Copying contexts...');
copyDir(resolve(TEMPLATES, 'contexts'), resolve(SRC, 'contexts'));

// 3. Copy navigation.ts
log('Copying navigation config...');
cpSync(resolve(TEMPLATES, 'navigation.ts'), resolve(SRC, 'navigation.ts'));

// 4. Copy SVG assets
log('Copying SVG assets...');
copyDir(resolve(TEMPLATES, 'assets'), resolve(SRC, 'assets'));

// 5. Replace App.tsx with the FusionShell version
log('Replacing App.tsx with FusionShell version...');
const appShellSrc = resolve(TEMPLATES, 'App.appshell.tsx');
const appDest = resolve(SRC, 'App.tsx');
const appBackup = resolve(SRC, 'App.original.tsx');

// Warn if GenUX was already scaffolded — AppShell replaces App.tsx entirely
if (existsSync(appDest)) {
  const currentApp = readFileSync(appDest, 'utf-8');
  if (currentApp.includes('IntuitAssist')) {
    log('  ⚠ GenUX was already scaffolded into App.tsx.');
    log('    AppShell will replace App.tsx — the GenUX bubble injection will be deactivated.');
    log('    The GenUX page files remain on disk. After AppShell scaffolding, run');
    log('    scaffold:genux again to re-inject as a route inside the AppShell layout.');
  }
}

// Back up the original App.tsx — but only if a backup doesn't already exist.
// This prevents double-runs from overwriting the real original with the
// already-scaffolded version.
if (existsSync(appDest) && !existsSync(appBackup)) {
  cpSync(appDest, appBackup);
  log('  Backed up original App.tsx → App.original.tsx');
} else if (existsSync(appBackup)) {
  log('  App.original.tsx backup already exists — skipping backup (preserving original)');
}
cpSync(appShellSrc, appDest);

// 6. Ensure Yarn registry scopes are configured for internal packages
log('Checking Yarn registry configuration...');
const yarnrcPath = resolve(ROOT, '.yarnrc.yml');
if (existsSync(yarnrcPath)) {
  let yarnrc = readFileSync(yarnrcPath, 'utf-8');
  const intuitRegistry = 'https://registry.npmjs.intuit.com';
  const scopesToAdd = ['genux-ds', 'cgds', 'design-tokens', 'appfabric', 'qbds'];
  let modified = false;
  for (const scope of scopesToAdd) {
    if (!yarnrc.includes(`${scope}:`)) {
      yarnrc = yarnrc.trimEnd() + `\n  ${scope}:\n    npmRegistryServer: "${intuitRegistry}"\n`;
      modified = true;
    }
  }
  if (modified) {
    writeFileSync(yarnrcPath, yarnrc);
    log('  Added internal registry scopes to .yarnrc.yml');
  }
}

// 7. Install dependencies
log('Installing dependencies...');
const pkgPath = resolve(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const deps = pkg.dependencies || {};
const depsToAdd = [];

if (!deps['@floating-ui/react']) depsToAdd.push('@floating-ui/react');
if (!deps['classnames']) depsToAdd.push('classnames');
if (!deps['@genux-ds/animated-brand']) depsToAdd.push('@genux-ds/animated-brand');

if (depsToAdd.length > 0) {
  try {
    execSync(`yarn add ${depsToAdd.join(' ')}`, { cwd: ROOT, stdio: 'inherit' });
    log(`  Installed: ${depsToAdd.join(', ')}`);
  } catch (err) {
    console.warn('  Warning: Failed to install some dependencies. You may need to run:');
    console.warn(`  yarn add ${depsToAdd.join(' ')}`);
  }
} else {
  log('  All dependencies already installed');
}

log('');
log('AppShell scaffolding complete!');
log('Refresh your browser to see the QBO-like shell.');
log('');
log('To remove the shell later, run: yarn unscaffold:appshell');
