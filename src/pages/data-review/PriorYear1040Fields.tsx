import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Comment } from '@design-systems/icons'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/DetailFields.module.css'

// Real 2024 figures — matches PRIOR_YEAR in LeftPanel1040.tsx (the single
// source of truth for YoY comparisons). Previously this tab showed a
// different, much larger set of numbers left over from an earlier persona
// (total income $646,776, amount owed $97,355) that never matched the
// prior-year values used everywhere else in the app.
const FIELDS: { section?: string; key?: string; line?: string; label?: string; amount?: string; bold?: boolean }[] = [
  { section: 'INCOME' },
  { key: '1a',  line: '1a',  label: 'Total wages, salaries, tips (W-2)',       amount: '105,000' },
  { key: '1z',  line: '1z',  label: 'Add lines 1a–1h',                         amount: '105,000' },
  { key: '2b',  line: '2b',  label: 'Taxable interest',                         amount: '1,400' },
  { key: '3a',  line: '3a',  label: 'Qualified dividends',                      amount: '0' },
  { key: '3b',  line: '3b',  label: 'Ordinary dividends',                       amount: '500' },
  { key: '7',   line: '7',   label: 'Capital gain or (loss)',                   amount: '2,500' },
  { key: '9',   line: '9',   label: 'Total income',                             amount: '109,400', bold: true },
  { section: 'ADJUSTMENTS TO INCOME' },
  { key: '11',  line: '11',  label: 'Adjusted gross income',                    amount: '109,400', bold: true },
  { section: 'DEDUCTIONS' },
  { key: '12',  line: '12',  label: 'Standard deduction',                       amount: '13,850' },
  { key: '15',  line: '15',  label: 'Taxable income',                           amount: '95,550', bold: true },
  { section: 'TAX AND CREDITS' },
  { key: '16',  line: '16',  label: 'Tax (see instructions)',                   amount: '20,638' },
  { key: '24',  line: '24',  label: 'Total tax',                                amount: '20,638', bold: true },
  { section: 'PAYMENTS' },
  { key: '25a', line: '25a', label: 'Federal income tax withheld (W-2)',        amount: '15,987' },
  { key: '33',  line: '33',  label: 'Total payments',                           amount: '15,987', bold: true },
  { key: '37',  line: '37',  label: 'Amount you owe',                           amount: '4,651' },
]

interface PriorYear1040FieldsProps {
  onMarkReviewed?: (field: string) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  onAddFieldNote?: (text: string, context: string) => void
}

export default function PriorYear1040Fields({ onMarkReviewed, reviewedFields, onAddFieldNote }: PriorYear1040FieldsProps) {
  const [commentField, setCommentField] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentAnchor, setCommentAnchor] = useState<{ top: number; right: number } | null>(null)
  const commentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!commentField) return
    const onDown = (e: MouseEvent) => {
      if (commentRef.current && !commentRef.current.contains(e.target as Node)) {
        setCommentField(null)
        setCommentDraft('')
        setCommentAnchor(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [commentField])

  const openComment = (fieldKey: string, btn: HTMLElement) => {
    const row = btn.closest('[class*="fieldRow"]') as HTMLElement | null
    const target = row ?? btn
    const rect = target.getBoundingClientRect()
    setCommentAnchor({ top: rect.top, right: 8 })
    setCommentField(fieldKey)
    setCommentDraft('')
  }

  const postComment = (context: string) => {
    if (!commentDraft.trim()) return
    onAddFieldNote?.(commentDraft.trim(), context)
    setCommentField(null)
    setCommentDraft('')
    setCommentAnchor(null)
  }

  const renderCommentBtn = (fieldKey: string, label: string) => {
    const context = `Prior Year 1040 · ${label}`
    const isOpen = commentField === fieldKey
    return (
      <>
        <Tooltip text="Add a comment" placement="top"><button
          className={`${styles.commentBtn} ${isOpen ? styles.commentBtnActive : ''}`}
          aria-label={`Add comment for ${label}`}
          onClick={e => { e.stopPropagation(); isOpen ? (setCommentField(null), setCommentDraft(''), setCommentAnchor(null)) : openComment(fieldKey, e.currentTarget) }}
        >
          <Comment size="small" />
        </button></Tooltip>
        {isOpen && commentAnchor && createPortal(
          <div
            className={styles.commentPopover}
            style={{ top: commentAnchor.top - 4, right: commentAnchor.right, transform: 'translateY(-100%)' }}
            ref={commentRef}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.commentPopoverContext}>
              <span className={styles.commentPopoverChip}>{context}</span>
            </div>
            <textarea
              autoFocus
              className={styles.commentPopoverInput}
              placeholder="Add a comment…"
              value={commentDraft}
              onChange={e => setCommentDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment(context) }}
              rows={3}
            />
            <div className={styles.commentPopoverActions}>
              <button className={styles.commentPopoverCancel} onClick={e => { e.stopPropagation(); setCommentField(null); setCommentDraft(''); setCommentAnchor(null) }}>Cancel</button>
              <button
                className={`${styles.commentPopoverPost} ${commentDraft.trim() ? styles.commentPopoverPostActive : ''}`}
                disabled={!commentDraft.trim()}
                onClick={e => { e.stopPropagation(); postComment(context) }}
              >
                Post
              </button>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Prior Year 1040 (2024) — Jessica Drake</h2>
      </div>
      <div className={styles.inputContainer}>
        {FIELDS.map((row, i) => {
          if (row.section) {
            return <div key={i} className={styles.sectionHeader}>{row.section}</div>
          }
          const fieldKey = `prior1040-${row.key}`
          const isReviewed = reviewedFields?.has(fieldKey)
          const isCommentOpen = commentField === fieldKey
          return (
            <div key={i} className={`${styles.fieldRow} ${isCommentOpen ? styles.fieldRowCommentOpen : ''}`}>
              <span className={styles.fieldLabel} style={row.bold ? { fontWeight: 600 } : undefined}>
                {row.line}&nbsp;&nbsp;{row.label}
              </span>
              <input
                className={styles.fieldInput}
                readOnly
                value={row.amount}
                style={row.bold ? { fontWeight: 600 } : undefined}
              />
              {isReviewed ? (
                <Tooltip text="Click to unmark" placement="top">
                  <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button>
                </Tooltip>
              ) : (
                <div className={styles.fieldActions}>
                  <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button></Tooltip>
                  {renderCommentBtn(fieldKey, row.label ?? '')}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
