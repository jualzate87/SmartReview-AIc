#!/usr/bin/env node

/**
 * unscaffold-genux.mjs
 *
 * Removes the GenUX Intuit Assist page and cleans up the injection from App.tsx.
 * Handles both formats:
 * - PAGES-array format: removes the floating bubble (AppContent wrapper + import)
 * - AppShell format: removes the /intuit-assist route
 *
 * Does NOT uninstall npm packages (same pattern as AppShell unscaffold).
 *
 * Usage: node scripts/unscaffold-genux.mjs
 */

import { existsSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');

function log(msg) {
  console.log(`[unscaffold-genux] ${msg}`);
}

function removeIfExists(path, label) {
  if (existsSync(path)) {
    rmSync(path, { force: true });
    log(`  Removed ${label}`);
  }
}

// 1. Remove page template
log('Removing Intuit Assist page...');
removeIfExists(resolve(SRC, 'pages/IntuitAssistPage.tsx'), 'pages/IntuitAssistPage.tsx');

// 2. Remove styles
log('Removing styles...');
removeIfExists(resolve(SRC, 'styles/IntuitAssistPage.module.css'), 'styles/IntuitAssistPage.module.css');

// 3. Remove injected code from App.tsx
log('Cleaning up App.tsx...');
const appPath = resolve(SRC, 'App.tsx');

if (existsSync(appPath)) {
  let appContent = readFileSync(appPath, 'utf-8');

  if (appContent.includes('IntuitAssist')) {
    // Remove the bubble import (PAGES format)
    appContent = appContent.replace(
      /import IntuitAssistBubble from '\.\/pages\/IntuitAssistPage'\n/,
      ''
    );

    // Remove the page import (AppShell format)
    appContent = appContent.replace(
      /import IntuitAssistPage from '\.\/pages\/IntuitAssistPage'\n/,
      ''
    );

    // Remove the AppContent function and replace <AppContent /> with inline <Routes>
    // This handles the PAGES-array bubble pattern
    if (appContent.includes('function AppContent()')) {
      // Remove the entire AppContent function definition
      appContent = appContent.replace(
        /function AppContent\(\) \{[\s\S]*?\n\}\n\n/,
        ''
      );
      // Replace <AppContent /> with the standard PAGES-format Routes block
      appContent = appContent.replace(
        /\s*<AppContent \/>\n/,
        `\n        <Routes>\n          <Route path="/" element={<Navigate to="/onboarding" replace />} />\n          {PAGES.map(({ path, component: Page }) => (\n            <Route key={path} path={path} element={<Page />} />\n          ))}\n        </Routes>\n`
      );
    }

    // Remove useLocation from react-router-dom import if no longer needed.
    // Handle both positions: ", useLocation" (middle/end) and "useLocation, " (first).
    if (!appContent.includes('useLocation(')) {
      appContent = appContent.replace(
        /import \{([^}]*)\} from 'react-router-dom'/,
        (match, imports) => {
          const cleaned = imports
            .split(',')
            .map(s => s.trim())
            .filter(s => s && s !== 'useLocation')
            .join(', ');
          return `import { ${cleaned} } from 'react-router-dom'`;
        }
      );
    }

    // Remove PAGES array entry (legacy format, in case of older injection)
    appContent = appContent.replace(
      /\s*\{ label: 'Intuit Assist', path: '\/intuit-assist', component: IntuitAssistPage \},?\n/,
      '\n'
    );

    // Remove Route element (AppShell format)
    appContent = appContent.replace(
      /\s*<Route path="\/intuit-assist" element=\{<IntuitAssistPage \/>\} \/>\n/,
      '\n'
    );

    // Clean up any double blank lines introduced by removal
    appContent = appContent.replace(/\n{3,}/g, '\n\n');

    writeFileSync(appPath, appContent);
    log('  Removed Intuit Assist from App.tsx');
  } else {
    log('  No Intuit Assist found in App.tsx — nothing to remove');
  }
} else {
  log('  App.tsx not found — skipping cleanup');
}

log('');
log('GenUX removed successfully!');
log('Refresh your browser to see the changes.');
