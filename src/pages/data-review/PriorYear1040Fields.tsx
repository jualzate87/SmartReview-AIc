import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Comment } from '@design-systems/icons'
import Tooltip from './Tooltip'
import { PRIOR_YEAR_1040_FIELDS } from './priorYear1040Data'
import styles from '../../styles/data-review/DetailFields.module.css'

// Real 2024 figures — matches PRIOR_YEAR_1040_VALUES in priorYear1040Data.ts (the single
// source of truth for YoY comparisons and the prior-year document preview).
const FIELDS = PRIOR_YEAR_1040_FIELDS

interface PriorYear1040FieldsProps {
  onMarkReviewed?: (field: string) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  onAddFieldNote?: (text: string, context: string) => void
  verifiedDocs?: Set<string>
  onVerifyDoc?: (docKey: string) => void
}

const DOC_KEY = 'prior-1040'

export default function PriorYear1040Fields({ onMarkReviewed, reviewedFields, onAddFieldNote, verifiedDocs, onVerifyDoc }: PriorYear1040FieldsProps) {
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

  const docVerified = verifiedDocs?.has(DOC_KEY) ?? false

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <h2 className={styles.title} style={{ flex: 1, textAlign: 'left' }}>Prior Year 1040 (2024) — Jessica Drake</h2>
          {docVerified ? (
            <button className={styles.verifiedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => onVerifyDoc?.(DOC_KEY)}><CircleCheck size="small" /> Verified</button>
          ) : (
            <button className={styles.markVerifiedBtn} onClick={() => onVerifyDoc?.(DOC_KEY)}>Mark as verified</button>
          )}
        </div>
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
