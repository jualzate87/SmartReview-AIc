import { ChevronLeft, CircleCheck } from '@design-systems/icons'
import styles from '../../styles/data-review/YoYDetailPane.module.css'
import qStyles from '../../styles/data-review/QuestionnairePane.module.css'

interface QuestionnairePaneProps {
  onBack?: () => void
  closing?: boolean
  /** 'overlay' (default): slides in over the agent panel, with a back link.
   *  'tab': renders inline as a Phase 1 source-doc tab — no overlay, no back link. */
  variant?: 'overlay' | 'tab'
}

// ProtoC: answers only confirm documents Jessica actually sent — the imported set is
// W-2 (Tech Circle), 1099-INT (Unwavering Financial), 1099-DIV (Unwavering Financial),
// and her Prior Year 1040. No 1098, 1099-R, or other document exists for this return.
const QA_ITEMS = [
  // ── Employment & wages ──
  {
    id: 'employment-change',
    number: 1,
    section: 'Employment & wages',
    question: 'Did your employment situation change in 2024? Please list all employers, whether you started or left any jobs, and upload your W-2(s).',
    answer: 'I worked at Tech Circle all year. I\'ve uploaded my W-2.',
    date: 'Mar 15, 2025',
  },
  {
    id: 'side-income',
    number: 2,
    section: 'Employment & wages',
    question: 'Did you receive any freelance, consulting, or self-employment income in 2024? If so, please provide a summary of income and related business expenses.',
    answer: 'No, nothing on the side this year. All income was from Tech Circle.',
    date: 'Mar 15, 2025',
  },
  // ── Interest & dividends ──
  {
    id: 'interest',
    number: 3,
    section: 'Interest & dividends',
    question: 'Did you open any new bank or savings accounts in 2024? Please upload all 1099-INT forms for interest income earned during the year.',
    answer: 'Yes, I have interest income from Unwavering Financial. I\'ve uploaded the 1099-INT.',
    date: 'Mar 15, 2025',
  },
  {
    id: 'dividends',
    number: 4,
    section: 'Interest & dividends',
    question: 'Did you sell, transfer, or close any investment or brokerage accounts in 2024? Please upload all 1099-DIV and 1099-B forms.',
    answer: 'Yes, I have dividend and capital gain activity through Unwavering Financial. I\'ve uploaded the 1099-DIV.',
    date: 'Mar 16, 2025',
  },
  // ── Real estate & deductions ──
  {
    id: 'home-ownership',
    number: 5,
    section: 'Real estate & deductions',
    question: 'Do you own a home? If yes, please upload your Form 1098 (mortgage interest statement) and any property tax bills paid in 2024.',
    answer: 'No, I rent — no mortgage or property tax documents to send.',
    date: 'Mar 15, 2025',
  },
  {
    id: 'charitable',
    number: 6,
    section: 'Real estate & deductions',
    question: 'Did you make any charitable contributions in 2024? Please provide a total amount and upload receipts for donations over $250.',
    answer: 'I donated $600 to the Red Cross and $200 to my church. Both were cash, so I don\'t have receipts above $250. That\'s it for the year.',
    date: 'Mar 15, 2025',
  },
  // ── Retirement accounts ──
  {
    id: 'ira-contribution',
    number: 7,
    section: 'Retirement accounts',
    question: 'Did you contribute to a traditional IRA, Roth IRA, or HSA in 2024? If yes, please provide the amounts and account type.',
    answer: 'I contributed $2,000 to my Roth IRA at Fidelity. Nothing to an HSA — my employer covers health insurance.',
    date: 'Mar 16, 2025',
  },
  {
    id: 'ira-distribution',
    number: 8,
    section: 'Retirement accounts',
    question: 'Did you take any distributions from an IRA, 401(k), or other retirement account in 2024? If yes, please describe the reason and upload your 1099-R.',
    answer: 'No, I didn\'t take any distributions this year — nothing to send there.',
    date: 'Mar 16, 2025',
  },
  // ── Life changes ──
  {
    id: 'filing-status',
    number: 9,
    section: 'Life changes',
    question: 'Did your filing status change in 2024? (e.g., marriage, divorce, spouse\'s death, or a new dependent)',
    answer: 'No changes. Still filing single, no dependents.',
    date: 'Mar 14, 2025',
  },
  {
    id: 'health-coverage',
    number: 10,
    section: 'Life changes',
    question: 'Were you covered by health insurance for all 12 months of 2024? If you purchased coverage through a marketplace, please upload Form 1095-A.',
    answer: 'Yes, covered the whole year through my employer at Tech Circle. No marketplace plan.',
    date: 'Mar 14, 2025',
  },
]

// Group items by section
const SECTIONS = Array.from(new Set(QA_ITEMS.map(i => i.section)))

export default function QuestionnairePane({ onBack, closing = false, variant = 'overlay' }: QuestionnairePaneProps) {
  const isTab = variant === 'tab'
  const content = (
    <div className={isTab ? qStyles.tabChat : styles.chat}>

          {/* Back link — overlay variant only; a tab has its own top-level tab nav */}
          {!isTab && (
            <div className={styles.navRow}>
              <button className={styles.backLink} onClick={onBack}>
                <ChevronLeft size="small" />
                <span>Back to overview</span>
              </button>
            </div>
          )}

          {/* Product header */}
          <div className={qStyles.productHeader}>
            <div className={qStyles.productBrand}>
              <span className={qStyles.productLogo}>TaxCaddy</span>
              <span className={qStyles.productSeparator}>·</span>
              <span className={qStyles.productSub}>Tax Organizer · 2024</span>
            </div>
            <div className={qStyles.completionBadge}>
              <CircleCheck size="small" />
              <span>Completed</span>
            </div>
          </div>

          {/* Client + preparer meta */}
          <div className={qStyles.metaRow}>
            <div className={qStyles.metaItem}>
              <span className={qStyles.metaLabel}>Client</span>
              <span className={qStyles.metaValue}>Jessica Drake</span>
            </div>
            <div className={qStyles.metaDivider} />
            <div className={qStyles.metaItem}>
              <span className={qStyles.metaLabel}>Sent by firm</span>
              <span className={qStyles.metaValue}>Jan 28, 2025</span>
            </div>
            <div className={qStyles.metaDivider} />
            <div className={qStyles.metaItem}>
              <span className={qStyles.metaLabel}>Completed</span>
              <span className={qStyles.metaValue}>Mar 16, 2025</span>
            </div>
            <div className={qStyles.metaDivider} />
            <div className={qStyles.metaItem}>
              <span className={qStyles.metaLabel}>Responses</span>
              <span className={qStyles.metaValue}>10 of 10</span>
            </div>
          </div>

          {/* Q&A sections */}
          {SECTIONS.map(section => (
            <div key={section} className={qStyles.sectionGroup}>
              <div className={qStyles.sectionHeader}>
                <span className={qStyles.sectionName}>{section}</span>
              </div>

              {QA_ITEMS.filter(i => i.section === section).map(item => (
                <div key={item.id} className={qStyles.qaCard}>
                  {/* Question */}
                  <div className={qStyles.questionBlock}>
                    <span className={qStyles.qNumber}>Q{item.number}</span>
                    <p className={qStyles.questionText}>{item.question}</p>
                  </div>

                  {/* Answer */}
                  <div className={qStyles.answerBlock}>
                    <div className={qStyles.answerHeader}>
                      <span className={qStyles.avatar}>JD</span>
                      <span className={qStyles.answerMeta}>Jessica Drake · {item.date}</span>
                      <span className={qStyles.answeredChip}>
                        <CircleCheck size="small" /> Answered
                      </span>
                    </div>
                    <p className={qStyles.answerText}>{item.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}

    </div>
  )

  if (isTab) {
    return <div className={qStyles.tabContainer}>{content}</div>
  }

  return (
    <div className={`${styles.panel} ${closing ? styles.panelClosing : ''}`}>
      <div className={styles.pane}>
        {content}
      </div>
    </div>
  )
}
