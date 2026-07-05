import { useState } from 'react'
import { List, ChevronDown, ChevronUp, CircleQuestion, OverflowWeb, Plus } from '@design-systems/icons'
import styles from '../../styles/automated/QuestionnaireSection.module.css'

interface QuestionnaireSectionProps {
  title: string
  items: string[]
  defaultExpanded?: boolean
  showAddButton?: boolean
  addButtonLabel?: string
  icon?: React.ReactNode
}

export default function QuestionnaireSection({
  title,
  items,
  defaultExpanded = false,
  showAddButton = false,
  addButtonLabel = 'Add question',
  icon,
}: QuestionnaireSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div className={styles.wrapper}>
      {/* Header — clickable, toggles expand */}
      <button
        className={`${styles.header} ${expanded ? styles.headerExpanded : ''}`}
        onClick={() => setExpanded(e => !e)}
      >
        <div className={styles.headRow}>
          <div className={styles.sectionTitle}>
            <span className={styles.titleIcon}>
              {icon ?? <List size="xsmall" />}
            </span>
            <span className={styles.titleText}>{title}</span>
          </div>
          <span className={styles.chevron}>
            {expanded
              ? <ChevronUp size="xsmall" />
              : <ChevronDown size="xsmall" />
            }
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <>
          {items.map((item, i) => (
            <div key={i} className={styles.itemRow}>
              <span className={styles.itemText}>{item}</span>
              <div className={styles.itemActions}>
                <button className={styles.iconBtn} aria-label="Help">
                  <CircleQuestion size="small" />
                </button>
                <button className={styles.iconBtn} aria-label="More options">
                  <OverflowWeb size="small" />
                </button>
              </div>
            </div>
          ))}

          {showAddButton && (
            <div className={styles.addRow}>
              <button className={styles.addBtn}>
                <Plus size="xsmall" className={styles.addIcon} />
                {addButtonLabel}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
