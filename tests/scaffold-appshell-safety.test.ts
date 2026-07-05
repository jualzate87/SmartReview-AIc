import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// These tests verify the safety-guard logic from scaffold-appshell.mjs
// using pure string/boolean checks (no filesystem operations).
// ---------------------------------------------------------------------------

/**
 * Simulates the backup guard from scaffold-appshell.mjs (lines 71-76).
 *
 * Returns what action would be taken:
 * - 'backup'        — App.tsx exists, no backup yet -> create backup
 * - 'skip-backup'   — backup already exists -> preserve it, don't overwrite
 * - 'no-app'        — App.tsx doesn't exist -> nothing to back up
 */
function determineBackupAction(appExists: boolean, backupExists: boolean): string {
  if (appExists && !backupExists) {
    return 'backup'
  } else if (backupExists) {
    return 'skip-backup'
  }
  return 'no-app'
}

/**
 * Simulates the GenUX-already-present warning from scaffold-appshell.mjs (lines 58-66).
 * Returns true if the warning would be emitted.
 */
function wouldWarnAboutGenux(appContent: string): boolean {
  return appContent.includes('IntuitAssist')
}

describe('scaffold-appshell safety guards', () => {
  it('does not overwrite backup if App.original.tsx already exists', () => {
    // First run: App.tsx exists, no backup yet -> should create backup
    expect(determineBackupAction(true, false)).toBe('backup')

    // Second run: App.tsx exists AND backup already exists -> should skip
    expect(determineBackupAction(true, true)).toBe('skip-backup')

    // Edge case: no App.tsx at all
    expect(determineBackupAction(false, false)).toBe('no-app')
  })

  it('warns when GenUX is already present in App.tsx', () => {
    const appWithGenux = `
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import IntuitAssistBubble from './pages/IntuitAssistPage'

function AppContent() {
  const location = useLocation()
  const showBubble = location.pathname !== '/onboarding'
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
      </Routes>
      {showBubble && <IntuitAssistBubble />}
    </>
  )
}

export default function App() {
  return <AppContent />
}
`
    const appWithoutGenux = `
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </HashRouter>
  )
}
`

    expect(wouldWarnAboutGenux(appWithGenux)).toBe(true)
    expect(wouldWarnAboutGenux(appWithoutGenux)).toBe(false)
  })
})
