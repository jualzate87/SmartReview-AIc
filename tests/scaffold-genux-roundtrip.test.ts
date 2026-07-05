import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// The exact App.tsx content after a /reset (PAGES-array format, no GenUX)
// ---------------------------------------------------------------------------
const BASE_APP_TSX = `// App.tsx — Router shell. Skills manage the imports and PAGES array. Do not edit manually.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'
import HomePage from './pages/HomePage'
import OnboardingPage from './pages/OnboardingPage'
import WorkspacePage from './pages/WorkspacePage'

const PAGES = [
  { label: 'Home', path: '/home', component: HomePage },
  { label: 'Onboarding', path: '/onboarding', component: OnboardingPage },
  { label: 'Workspace', path: '/workspace', component: WorkspacePage },
]

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          {PAGES.map(({ path, component: Page }) => (
            <Route key={path} path={path} element={<Page />} />
          ))}
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  )
}
`

// ---------------------------------------------------------------------------
// applyGenuxScaffold — replicates the PAGES-array branch of scaffold-genux.mjs
// ---------------------------------------------------------------------------
function applyGenuxScaffold(content: string): string {
  // Skip if already injected
  if (content.includes('IntuitAssist')) {
    return content
  }

  let result = content

  const bubbleImport = "import IntuitAssistBubble from './pages/IntuitAssistPage'"

  // Add bubble import after the last import line
  const lastImportIdx = result.lastIndexOf('\nimport ')
  const endOfLastImport = result.indexOf('\n', lastImportIdx + 1)
  result =
    result.slice(0, endOfLastImport + 1) + bubbleImport + '\n' + result.slice(endOfLastImport + 1)

  // Add useLocation to the react-router-dom import
  if (!result.includes('useLocation')) {
    result = result.replace(
      /import \{([^}]+)\} from 'react-router-dom'/,
      (_match, imports: string) => {
        if (imports.includes('useLocation')) return _match
        const trimmed = imports.trim().replace(/,\s*$/, '')
        return `import { ${trimmed}, useLocation } from 'react-router-dom'`
      },
    )
  }

  // Replace <Routes>...</Routes> with <AppContent />
  if (result.includes('<Routes>')) {
    // Step 1: Replace <Routes>...</Routes> inside App() with <AppContent />
    result = result.replace(/<Routes>[\s\S]*?<\/Routes>/, '<AppContent />')

    // Step 2: Build the AppContent function
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

`
    // Step 3: Insert AppContent before the App function
    const appFuncIdx = result.indexOf('export default function App()')
    if (appFuncIdx !== -1) {
      result = result.slice(0, appFuncIdx) + appContentFn + result.slice(appFuncIdx)
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// removeGenuxScaffold — replicates the PAGES-array branch of unscaffold-genux.mjs
// ---------------------------------------------------------------------------
function removeGenuxScaffold(content: string): string {
  let result = content

  if (!result.includes('IntuitAssist')) {
    return result
  }

  // Remove the bubble import (PAGES format)
  result = result.replace(/import IntuitAssistBubble from '\.\/pages\/IntuitAssistPage'\n/, '')

  // Remove the page import (AppShell format)
  result = result.replace(/import IntuitAssistPage from '\.\/pages\/IntuitAssistPage'\n/, '')

  // Remove the AppContent function and replace <AppContent /> with inline <Routes>
  if (result.includes('function AppContent()')) {
    // Remove the entire AppContent function definition
    result = result.replace(/function AppContent\(\) \{[\s\S]*?\n\}\n\n/, '')
    // Replace <AppContent /> with the standard PAGES-format Routes block
    result = result.replace(
      /\s*<AppContent \/>\n/,
      `\n        <Routes>\n          <Route path="/" element={<Navigate to="/onboarding" replace />} />\n          {PAGES.map(({ path, component: Page }) => (\n            <Route key={path} path={path} element={<Page />} />\n          ))}\n        </Routes>\n`,
    )
  }

  // Remove useLocation from react-router-dom import if no longer needed
  if (!result.includes('useLocation(')) {
    result = result.replace(
      /import \{([^}]*)\} from 'react-router-dom'/,
      (_match, imports: string) => {
        const cleaned = imports
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s && s !== 'useLocation')
          .join(', ')
        return `import { ${cleaned} } from 'react-router-dom'`
      },
    )
  }

  // Clean up any double blank lines introduced by removal
  result = result.replace(/\n{3,}/g, '\n\n')

  return result
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('scaffold-genux roundtrip (PAGES-array format)', () => {
  it('scaffolds the bubble into base App.tsx', () => {
    const result = applyGenuxScaffold(BASE_APP_TSX)

    expect(result).toContain("import IntuitAssistBubble from './pages/IntuitAssistPage'")
    expect(result).toContain('function AppContent()')
    expect(result).toContain('useLocation')
    expect(result).toContain('{showBubble && <IntuitAssistBubble />}')
  })

  it('produces valid JSX structure after scaffold', () => {
    const result = applyGenuxScaffold(BASE_APP_TSX)

    // <AppContent /> should appear inside <HashRouter>
    const hashRouterStart = result.indexOf('<HashRouter>')
    const hashRouterEnd = result.indexOf('</HashRouter>')
    const appContentTag = result.indexOf('<AppContent />')

    expect(hashRouterStart).toBeGreaterThan(-1)
    expect(hashRouterEnd).toBeGreaterThan(-1)
    expect(appContentTag).toBeGreaterThan(hashRouterStart)
    expect(appContentTag).toBeLessThan(hashRouterEnd)

    // The original <Routes>...</Routes> inside App() should be replaced
    // (only <Routes> inside AppContent should remain)
    const appFuncIdx = result.indexOf('export default function App()')
    const appFuncBody = result.slice(appFuncIdx)
    expect(appFuncBody).not.toContain('<Routes>')
    expect(appFuncBody).toContain('<AppContent />')
  })

  it('round-trips back to the original', () => {
    const scaffolded = applyGenuxScaffold(BASE_APP_TSX)
    const restored = removeGenuxScaffold(scaffolded)

    expect(restored).toBe(BASE_APP_TSX)
  })

  it('skips injection if IntuitAssist already present', () => {
    const first = applyGenuxScaffold(BASE_APP_TSX)
    const second = applyGenuxScaffold(first)

    // Should be identical — no double injection
    expect(second).toBe(first)

    // Only one IntuitAssistBubble import line
    const importMatches = second.match(
      /import IntuitAssistBubble from '\.\/pages\/IntuitAssistPage'/g,
    )
    expect(importMatches).toHaveLength(1)
  })

  it('removes useLocation from any position in the import', () => {
    // useLocation as the last import (the normal scaffold position)
    const withLast =
      `import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'\n` +
      `const x = 1\n`
    const cleanedLast = removeGenuxScaffold(
      // We need IntuitAssist present so the function doesn't bail early
      withLast.replace(
        'const x',
        "import IntuitAssistBubble from './pages/IntuitAssistPage'\nconst x",
      ),
    )
    expect(cleanedLast).toContain(
      "import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'",
    )
    expect(cleanedLast).not.toContain('useLocation')

    // useLocation as the first import
    const withFirst =
      `import { useLocation, HashRouter, Routes, Route, Navigate } from 'react-router-dom'\n` +
      `import IntuitAssistBubble from './pages/IntuitAssistPage'\n` +
      `const x = 1\n`
    const cleanedFirst = removeGenuxScaffold(withFirst)
    expect(cleanedFirst).toContain(
      "import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'",
    )
    expect(cleanedFirst).not.toContain('useLocation')

    // useLocation in the middle
    const withMiddle =
      `import { HashRouter, useLocation, Routes, Route, Navigate } from 'react-router-dom'\n` +
      `import IntuitAssistBubble from './pages/IntuitAssistPage'\n` +
      `const x = 1\n`
    const cleanedMiddle = removeGenuxScaffold(withMiddle)
    expect(cleanedMiddle).toContain(
      "import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'",
    )
    expect(cleanedMiddle).not.toContain('useLocation')
  })
})
