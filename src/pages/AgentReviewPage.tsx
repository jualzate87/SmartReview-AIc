import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Close,
  MenuExpand,
  CommentPencil,
  ClockCounterclockwise,
} from '@design-systems/icons'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import intuitWordmark from '../assets/intuit-wordmark.svg'
import {
  INTELLIGENCE_CHAT_PLACEHOLDER,
  INTELLIGENCE_LEGAL_DISCLAIMER,
  INTELLIGENCE_LOADING_SUBTEXT,
  INTELLIGENCE_LOADING_TITLE,
  STARTER_PROMPT_CATCH_UP,
  STARTER_PROMPT_FULL_REVIEW,
} from './agent-review/agentIntelligenceCopy'
import AgentWelcomePane from './agent-review/AgentWelcomePane'
import AgentReviewDiagnosticsPane, {
  type DiagnosticCardId,
} from './agent-review/AgentReviewDiagnosticsPane'
import AgentReviewProcessingPane from './agent-review/AgentReviewProcessingPane'
import AgentLoadingPane from './data-review/AgentLoadingPane'
import ChatInput from './automated/ChatInput'
import DataReviewPage from './DataReviewPage'
import styles from '../styles/AgentReviewPage.module.css'

type AgentStep = 'welcome' | 'diagnostics' | 'processing' | 'workspace'

const ASSESSING_MS = 3200

export default function AgentReviewPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<AgentStep>('welcome')
  const [isAssessing, setIsAssessing] = useState(false)
  const assessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    el.style.setProperty('--color-action-standard-active', '#174d87')
    return () => {
      if (prev) el.setAttribute('data-theme', prev)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
      el.style.removeProperty('--color-action-standard-active')
      if (assessTimerRef.current) clearTimeout(assessTimerRef.current)
    }
  }, [])

  const handleClose = () => {
    navigate('/check-return')
  }

  const startAssessing = () => {
    setIsAssessing(true)
    if (assessTimerRef.current) clearTimeout(assessTimerRef.current)
    assessTimerRef.current = setTimeout(() => {
      setIsAssessing(false)
      assessTimerRef.current = null
    }, ASSESSING_MS)
  }

  const beginDiagnostics = () => {
    setStep('diagnostics')
    startAssessing()
  }

  const beginProcessing = () => {
    setStep('processing')
  }

  const openWorkspace = (_issueId?: DiagnosticCardId) => {
    setStep('workspace')
  }

  const handlePromptClick = (prompt: string) => {
    if (prompt === STARTER_PROMPT_FULL_REVIEW) {
      beginDiagnostics()
      return
    }
    if (prompt === STARTER_PROMPT_CATCH_UP) {
      beginProcessing()
    }
  }

  const showChatInput = step !== 'workspace' && !(step === 'diagnostics' && isAssessing)

  return (
    <div className={styles.shell} data-theme="intuit">
      <header className={styles.header}>
        <img src={intuitWordmark} alt="Intuit" className={styles.wordmark} />
        <IconControl
          label="Close AI review"
          size="medium"
          shape="square"
          onClick={handleClose}
        >
          <Close size="medium" />
        </IconControl>
      </header>

      <div className={styles.body}>
        <aside className={styles.threadRail} aria-label="Chat navigation">
          <button type="button" className={styles.railBtn} aria-label="Hide chat history">
            <MenuExpand size="medium" />
          </button>
          <button type="button" className={styles.railBtn} aria-label="New chat">
            <CommentPencil size="medium" />
          </button>
          <button type="button" className={styles.railBtn} aria-label="Recent chats">
            <ClockCounterclockwise size="medium" />
          </button>
        </aside>

        <div className={styles.main}>
          <div className={styles.pane}>
            {step === 'welcome' && (
              <AgentWelcomePane onPromptClick={handlePromptClick} />
            )}
            {step === 'diagnostics' && (
              <AgentLoadingPane
                embedded
                loadingTitle={INTELLIGENCE_LOADING_TITLE}
                loadingSubtext={INTELLIGENCE_LOADING_SUBTEXT}
                isLoading={isAssessing}
                showReport={!isAssessing}
                reportContent={
                  <AgentReviewDiagnosticsPane
                    onFixIssue={openWorkspace}
                    onFixIndividually={() => openWorkspace()}
                    onAcceptAll={beginProcessing}
                  />
                }
              />
            )}
            {step === 'processing' && (
              <AgentReviewProcessingPane
                onViewUpdatedReturn={() => openWorkspace()}
                onViewSourceDocuments={() => navigate('/import-hub')}
                onViewReturnSummary={() => navigate('/check-return')}
                onGetCaughtUp={() => {}}
              />
            )}
            {step === 'workspace' && (
              <DataReviewPage embedded initialPhase="import" />
            )}
          </div>

          {showChatInput && (
            <ChatInput
              placeholder={INTELLIGENCE_CHAT_PLACEHOLDER}
              legalDisclaimer={INTELLIGENCE_LEGAL_DISCLAIMER}
              onSend={() => {
                if (step === 'welcome') beginDiagnostics()
                else if (step === 'diagnostics' && !isAssessing) beginProcessing()
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
