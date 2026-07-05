// App.tsx — Router shell. Skills manage the imports and PAGES array. Do not edit manually.
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'
import HomePage from './pages/HomePage'
import OnboardingPage from './pages/OnboardingPage'
import WorkspacePage from './pages/WorkspacePage'
import IntuitAssistBubble from './pages/IntuitAssistPage'

const PAGES = [
  { label: 'Home', path: '/home', component: HomePage },
  { label: 'Onboarding', path: '/onboarding', component: OnboardingPage },
  { label: 'Workspace', path: '/workspace', component: WorkspacePage },
]

function AppContent() {
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

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ErrorBoundary>
  )
}
