#!/usr/bin/env node

/**
 * unscaffold-appshell.mjs
 *
 * Removes the AppShell (Fusion Shell) files from src/ and restores the original App.tsx.
 *
 * Usage: node scripts/unscaffold-appshell.mjs
 */

import { existsSync, rmSync, cpSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');

function log(msg) {
  console.log(`[unscaffold-appshell] ${msg}`);
}

function removeIfExists(path, label) {
  if (existsSync(path)) {
    rmSync(path, { recursive: true, force: true });
    log(`  Removed ${label}`);
  }
}

// 1. Remove scaffolded component directories
log('Removing AppShell components...');
const componentDirs = [
  'FusionShell',
  'OmniPanel',
  'GlobalCreate',
  'Avatar',
  'StackLayout',
  'ClusterLayout',
  'Portal',
  'DelayedContent',
];
for (const dir of componentDirs) {
  removeIfExists(resolve(SRC, 'components', dir), `components/${dir}/`);
}

// Remove components dir if empty
const componentsDir = resolve(SRC, 'components');
if (existsSync(componentsDir)) {
  try {
    const { readdirSync } = await import('fs');
    if (readdirSync(componentsDir).length === 0) {
      rmSync(componentsDir, { recursive: true });
      log('  Removed empty components/ directory');
    }
  } catch {
    // ignore
  }
}

// 2. Remove contexts
log('Removing contexts...');
removeIfExists(resolve(SRC, 'contexts', 'fusion.tsx'), 'contexts/fusion.tsx');
const contextsDir = resolve(SRC, 'contexts');
if (existsSync(contextsDir)) {
  try {
    const { readdirSync } = await import('fs');
    if (readdirSync(contextsDir).length === 0) {
      rmSync(contextsDir, { recursive: true });
      log('  Removed empty contexts/ directory');
    }
  } catch {
    // ignore
  }
}

// 3. Remove navigation.ts
removeIfExists(resolve(SRC, 'navigation.ts'), 'navigation.ts');

// 4. Remove AppShell SVG assets (keep ids-logo.svg)
log('Removing AppShell SVG assets...');
const shellAssets = [
  'qbo_ball_logo.svg',
  'qbo_wordmark_black.svg',
  'accounting_icon.svg',
  'customers_icon.svg',
  'expenses_icon.svg',
  'sales-payments_icon.svg',
  'team_icon.svg',
  'time_icon.svg',
  'projects_icon.svg',
  'inventory_icon.svg',
  'business-tax_icon.svg',
  'lending_icon.svg',
  'payroll_icon.svg',
];
for (const asset of shellAssets) {
  removeIfExists(resolve(SRC, 'assets', asset), `assets/${asset}`);
}

// 5. Restore original App.tsx
log('Restoring App.tsx...');
const originalApp = resolve(SRC, 'App.original.tsx');
const appPath = resolve(SRC, 'App.tsx');
if (existsSync(originalApp)) {
  cpSync(originalApp, appPath);
  rmSync(originalApp);
  log('  Restored App.tsx from App.original.tsx');
} else {
  log('  No App.original.tsx backup found — App.tsx left as-is');
}

log('');
log('AppShell removed successfully!');
log('Refresh your browser to see the default layout.');
