#!/usr/bin/env node

/**
 * scaffold-genux.mjs
 *
 * Installs GenUX (@genux-ds/*) packages and adds the Intuit Assist starter page.
 * Unlike AppShell, GenUX is additive — it never replaces App.tsx, only injects
 * an import + route/bubble into whatever version is currently present.
 *
 * - PAGES-array format (no AppShell): Injects a floating bubble overlay
 * - AppShell format (with AppLayout): Injects a route for /intuit-assist
 *
 * Usage: node scripts/scaffold-genux.mjs
 */

import { cpSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const TEMPLATES = resolve(ROOT, '.templates/genux');
const SRC = resolve(ROOT, 'src');

function log(msg) {
  console.log(`[scaffold-genux] ${msg}`);
}

// 1. Copy page template
log('Copying Intuit Assist page...');
mkdirSync(resolve(SRC, 'pages'), { recursive: true });
cpSync(
  resolve(TEMPLATES, 'pages/IntuitAssistPage.tsx'),
  resolve(SRC, 'pages/IntuitAssistPage.tsx')
);

// 2. Copy styles
log('Copying styles...');
mkdirSync(resolve(SRC, 'styles'), { recursive: true });
cpSync(
  resolve(TEMPLATES, 'styles/IntuitAssistPage.module.css'),
  resolve(SRC, 'styles/IntuitAssistPage.module.css')
);

// 3. Inject into App.tsx
log('Injecting Intuit Assist into App.tsx...');
const appPath = resolve(SRC, 'App.tsx');

if (!existsSync(appPath)) {
  console.error('App.tsx not found — cannot inject.');
  process.exit(1);
}

let appContent = readFileSync(appPath, 'utf-8');

// Skip if already injected
if (appContent.includes('IntuitAssist')) {
  log('  Intuit Assist already present — skipping injection');
} else {
  // Detect format: original (has `const PAGES`) vs AppShell (has `AppLayout`)
  const isOriginalFormat = appContent.includes('const PAGES');

  if (isOriginalFormat) {
    log('  Detected PAGES-array format — injecting floating bubble overlay');
    // --- Original PAGES array format: inject floating bubble ---
    const bubbleImport = "import IntuitAssistBubble from './pages/IntuitAssistPage'";

    // Add bubble import after the last import line
    const lastImportIdx = appContent.lastIndexOf('\nimport ');
    const endOfLastImport = appContent.indexOf('\n', lastImportIdx + 1);
    appContent =
      appContent.slice(0, endOfLastImport + 1) +
      bubbleImport + '\n' +
      appContent.slice(endOfLastImport + 1);

    // Add useLocation to the react-router-dom import
    if (!appContent.includes('useLocation')) {
      appContent = appContent.replace(
        /import \{([^}]+)\} from 'react-router-dom'/,
        (match, imports) => {
          if (imports.includes('useLocation')) return match;
          const trimmed = imports.trim().replace(/,\s*$/, '');
          return `import { ${trimmed}, useLocation } from 'react-router-dom'`;
        }
      );
    }

    // Wrap the existing route rendering with AppContent that shows the bubble.
    // IMPORTANT: Replace <Routes> with <AppContent /> FIRST (while there's only
    // one <Routes> block), then insert the AppContent function definition.
    if (appContent.includes('<Routes>')) {
      // Step 1: Replace <Routes>...</Routes> inside App() with <AppContent />
      appContent = appContent.replace(/<Routes>[\s\S]*?<\/Routes>/, '<AppContent />');

      // Step 2: Build the AppContent function. In PAGES format, the Routes block
      // always uses the PAGES.map pattern with a default redirect.
      const appContentFn = `function AppContent() {
  const location = useLocation()
  const showBubble = location.pathname !== '/onboarding'
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        {PAGES.map(({ path, component: Page }) => (
          <Route key={path} path={path} element={<Page />} />
        ))}
      </Routes>
      {showBubble && <IntuitAssistBubble />}
    </>
  )
}

`;
      // Step 3: Insert AppContent before the App function
      const appFuncIdx = appContent.indexOf('export default function App()');
      if (appFuncIdx !== -1) {
        appContent = appContent.slice(0, appFuncIdx) + appContentFn + appContent.slice(appFuncIdx);
      }
    }
  } else {
    log('  Detected AppShell format — injecting /intuit-assist route');
    // --- AppShell format (Routes with <AppLayout />) ---
    const importLine = "import IntuitAssistPage from './pages/IntuitAssistPage'";

    // Add import after the last import line
    const lastImportIdx = appContent.lastIndexOf('\nimport ');
    const endOfLastImport = appContent.indexOf('\n', lastImportIdx + 1);
    appContent =
      appContent.slice(0, endOfLastImport + 1) +
      importLine + '\n' +
      appContent.slice(endOfLastImport + 1);

    // Add route inside the AppLayout block, before the catch-all <Route path="*"
    const catchAllPattern = /<Route path="\*"/;
    const catchAllMatch = appContent.match(catchAllPattern);
    if (catchAllMatch && catchAllMatch.index != null) {
      const insertPos = catchAllMatch.index;
      const routeLine = '<Route path="/intuit-assist" element={<IntuitAssistPage />} />\n              ';
      appContent =
        appContent.slice(0, insertPos) +
        routeLine +
        appContent.slice(insertPos);
    }
  }

  writeFileSync(appPath, appContent);
  log('  Intuit Assist injected successfully');
}

// 4. Ensure Yarn registry scopes
log('Checking Yarn registry configuration...');
const yarnrcPath = resolve(ROOT, '.yarnrc.yml');
if (existsSync(yarnrcPath)) {
  let yarnrc = readFileSync(yarnrcPath, 'utf-8');
  const intuitRegistry = 'https://registry.npmjs.intuit.com';
  const scopesToCheck = ['genux-ds', 'cgds', 'design-tokens', 'appfabric', 'qbds'];
  let modified = false;
  for (const scope of scopesToCheck) {
    if (!yarnrc.includes(`${scope}:`)) {
      yarnrc = yarnrc.trimEnd() + `\n  ${scope}:\n    npmRegistryServer: "${intuitRegistry}"\n`;
      modified = true;
    }
  }
  if (modified) {
    writeFileSync(yarnrcPath, yarnrc);
    log('  Added missing registry scopes to .yarnrc.yml');
  } else {
    log('  Registry scopes already configured');
  }
}

// 5. Install all @genux-ds packages
log('Installing GenUX packages...');
const genuxPackages = [
  '@genux-ds/access-point-button',
  '@genux-ds/animated-brand',
  '@genux-ds/assistants',
  '@genux-ds/avatar',
  '@genux-ds/badge',
  '@genux-ds/brand',
  '@genux-ds/card',
  '@genux-ds/chat',
  '@genux-ds/code-block',
  '@genux-ds/dac-suggestion-chip',
  '@genux-ds/embedded-drawer',
  '@genux-ds/flyout-menu',
  '@genux-ds/greeting',
  '@genux-ds/jump-to-button',
  '@genux-ds/link-button',
  '@genux-ds/message-bubble',
  '@genux-ds/rich-link',
  '@genux-ds/rich-text-input',
  '@genux-ds/starter-prompt',
  '@genux-ds/suggestion-chip',
  '@genux-ds/timeline',
];

// Check which packages are missing
const pkgPath = resolve(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const deps = pkg.dependencies || {};
const toInstall = genuxPackages.filter((p) => !deps[p]);

if (toInstall.length > 0) {
  try {
    execSync(`yarn add ${toInstall.join(' ')}`, { cwd: ROOT, stdio: 'inherit' });
    log(`  Installed ${toInstall.length} GenUX packages`);
  } catch (err) {
    console.warn('  Warning: Failed to install some packages. You may need to run:');
    console.warn(`  yarn add ${toInstall.join(' ')}`);
  }
} else {
  log('  All GenUX packages already installed');
}

log('');
log('GenUX scaffolding complete!');
log('The Intuit Assist bubble will appear on all pages (except Onboarding).');
log('');
log('To remove GenUX later, run: yarn unscaffold:genux');
