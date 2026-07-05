import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@design-systems/theme'
import { D4, H5, B1, B2, B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { Checkbox } from '@ids-ts/checkbox'
import '@ids-ts/checkbox/dist/main.css'
import Trowser from '@ids-ts/trowser'
import '@ids-ts/trowser/dist/main.css'
import StepFlow, { Step } from '@ids-ts/step-flow'
import '@ids-ts/step-flow/dist/main.css'
import { Activity } from '@ids-ts/loader'
import '@ids-ts/loader/dist/main.css'
import idsLogo from '../assets/ids-logo.svg'
import { THEME_OPTIONS, LIBRARY_OPTIONS, saveConfig } from '../config'
import type { PrototypeConfig } from '../config'
import styles from '../styles/OnboardingPage.module.css'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { setTheme } = useTheme({})
  const [trowserOpen, setTrowserOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('intuit')
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>(['ids-core'])
  const [isScaffolding, setIsScaffolding] = useState(false)
  const [scaffoldError, setScaffoldError] = useState<string | null>(null)

  const handleGetStarted = useCallback(() => {
    setTrowserOpen(true)
  }, [])

  const handleTrowserClose = useCallback(() => {
    if (!isScaffolding) setTrowserOpen(false)
  }, [isScaffolding])

  function handleThemeSelect(themeId: string) {
    setSelectedTheme(themeId)
    setTheme(themeId)
  }

  async function handleFinish() {
    const config: PrototypeConfig = {
      theme: selectedTheme,
      libraries: selectedLibraries,
      completedAt: new Date().toISOString(),
    }
    saveConfig(config)

    const librariesToScaffold = selectedLibraries.filter((id) => {
      const lib = LIBRARY_OPTIONS.find((l) => l.id === id)
      return lib && lib.available && !lib.required
    })

    if (librariesToScaffold.length > 0) {
      setIsScaffolding(true)
      setScaffoldError(null)
      try {
        const res = await fetch('/__api/scaffold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ libraries: librariesToScaffold }),
        })
        const data = await res.json()
        if (!data.success) {
          throw new Error(data.error || 'Scaffold failed')
        }
        window.location.href = '/#/workspace'
      } catch (err) {
        setIsScaffolding(false)
        setScaffoldError(err instanceof Error ? err.message : 'Something went wrong')
      }
    } else {
      setTrowserOpen(false)
      navigate('/workspace', { replace: true })
    }
  }

  function handleLibraryToggle(libraryId: string, checked: boolean) {
    setSelectedLibraries((prev) =>
      checked ? [...prev, libraryId] : prev.filter((id) => id !== libraryId),
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.stepContainer}>
        <img src={idsLogo} alt="Intuit Design System" className={styles.welcomeLogo} />
        <D4 className={styles.welcomeHeading}>Welcome to the IDS Prototyping Tool</D4>
        <B1 className={styles.welcomeBody}>
          This tool lets you build interactive prototypes using real Intuit Design System
          components. We'll walk you through a quick setup to configure your theme and component
          libraries.
        </B1>
        <div className={styles.actions}>
          <Button priority="primary" onClick={handleGetStarted}>
            Get started
          </Button>
        </div>
      </div>

      <Trowser
        open={trowserOpen}
        stepFlow
        hideOverflow
        dismissible={!isScaffolding}
        title="Set up your workspace"
        onClose={handleTrowserClose}
      >
        {isScaffolding && (
          <div className={styles.scaffoldingOverlay}>
            <Activity size="large" />
            <B1>Setting up your workspace...</B1>
            <B3 className={styles.scaffoldingHint}>
              This may take a moment while dependencies are installed.
            </B3>
          </div>
        )}
        {scaffoldError && (
          <div className={styles.scaffoldError}>
            <B2 weight="demi">Setup failed</B2>
            <B3>{scaffoldError}</B3>
            <B3>You can try again, or run the scaffold command manually in your terminal.</B3>
          </div>
        )}
        <StepFlow activeStepIndex={0} progressType="bar" width="medium">
          <Step title="Choose a theme" hasPreviousButton={false}>
            <div className={styles.stepContent}>
              <H5 className={styles.sectionTitle}>Choose a theme</H5>
              <B2 className={styles.sectionSubtitle}>
                Select the design system theme that matches your product area.
              </B2>
              <div className={styles.themeGrid}>
                {THEME_OPTIONS.map((theme) => (
                  <div
                    key={theme.id}
                    role="radio"
                    aria-checked={selectedTheme === theme.id}
                    tabIndex={0}
                    className={`${styles.themeCard} ${
                      selectedTheme === theme.id ? styles.themeCardSelected : ''
                    }`}
                    onClick={() => handleThemeSelect(theme.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleThemeSelect(theme.id)
                      }
                    }}
                  >
                    <B2 weight="demi" className={styles.themeCardName}>
                      {theme.name}
                    </B2>
                    <B3 className={styles.themeCardDesc}>{theme.description}</B3>
                  </div>
                ))}
              </div>
            </div>
          </Step>

          <Step title="Component libraries" nextButtonText="Finish setup" onNext={handleFinish}>
            <div className={styles.stepContent}>
              <H5 className={styles.sectionTitle}>Component libraries</H5>
              <B2 className={styles.sectionSubtitle}>
                Select which component libraries to include in your prototype.
              </B2>
              <div className={styles.libraryList}>
                {LIBRARY_OPTIONS.map((lib) => (
                  <div
                    key={lib.id}
                    className={`${styles.libraryCard} ${
                      lib.required || selectedLibraries.includes(lib.id)
                        ? styles.libraryCardActive
                        : ''
                    } ${!lib.available ? styles.libraryCardDisabled : ''}`}
                  >
                    <Checkbox
                      checked={lib.required || selectedLibraries.includes(lib.id)}
                      disabled={lib.required || !lib.available}
                      onChange={(e) => handleLibraryToggle(lib.id, !!e.target.checked)}
                      value={lib.id}
                    />
                    <div className={styles.libraryInfo}>
                      <div className={styles.libraryName}>
                        <B2 weight="demi">{lib.name}</B2>
                        {!lib.available && (
                          <Badge status="info" capitalization="sentence">
                            Coming soon
                          </Badge>
                        )}
                        {lib.required && (
                          <Badge status="success" capitalization="sentence">
                            Always included
                          </Badge>
                        )}
                      </div>
                      <B3 className={styles.libraryDesc}>{lib.description}</B3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Step>
        </StepFlow>
      </Trowser>
    </div>
  )
}
