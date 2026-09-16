import { useEffect, useState } from 'react'
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
import { STARTER_PROMPT_CATCH_UP, STARTER_PROMPT_FULL_REVIEW } from './agent-review/agentReviewConstants'
import AgentWelcomePane from './agent-review/AgentWelcomePane'
import AgentReviewDiagnosticsPane, {
  type DiagnosticCardId,
} from './agent-review/AgentReviewDiagnosticsPane'
import AgentReviewProcessingPane from './agent-review/AgentReviewProcessingPane'
import ChatInput from './automated/ChatInput'
import DataReviewPage from './DataReviewPage'
import styles from '../styles/AgentReviewPage.module.css'

type AgentStep = 'welcome' | 'diagnostics' | 'processing' | 'workspace'

export default function AgentReviewPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<AgentStep>('welcome')

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
    }
  }, [])

  const handleClose = () => {
    navigate('/check-return')
  }

  const beginDiagnostics = () => {
    setStep('diagnostics')
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

  const showChatInput = step !== 'workspace'

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
              <AgentReviewDiagnosticsPane
                onFixIssue={openWorkspace}
                onFixIndividually={() => openWorkspace()}
                onAcceptAll={beginProcessing}
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
              placeholder="Ask anything"
              onSend={() => {
                if (step === 'welcome') beginDiagnostics()
                else if (step === 'diagnostics') beginProcessing()
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
