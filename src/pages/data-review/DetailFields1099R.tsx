import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Comment } from '@design-systems/icons'
import Tooltip from './Tooltip'
import { CLIENT_ADDRESS } from '../../data/clientAddress'
import { parseAmountDraft, type LiveAmounts } from '../../data/liveReturn'
import styles from '../../styles/data-review/DetailFields.module.css'

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M19.0711 7.0506C18.8836 6.86313 18.6293 6.75781 18.3641 6.75781C18.099 6.75781 17.8447 6.86313 17.6571 7.0506L9.87916 14.8286L6.34316 11.2936C6.15456 11.1115 5.90195 11.0107 5.63976 11.0129C5.37756 11.0152 5.12675 11.1204 4.94134 11.3058C4.75593 11.4912 4.65076 11.742 4.64848 12.0042C4.6462 12.2664 4.747 12.519 4.92916 12.7076L9.17216 16.9506C9.35968 17.1381 9.61399 17.2434 9.87916 17.2434C10.1443 17.2434 10.3986 17.1381 10.5861 16.9506L19.0711 8.4646C19.2586 8.27707 19.3639 8.02276 19.3639 7.7576C19.3639 7.49244 19.2586 7.23813 19.0711 7.0506Z" fill="currentColor"/>
    </svg>
  )
}

export type RPayer = 'meridian'

export const R_PAYER_TABS: { key: RPayer; label: string }[] = [
  { key: 'meridian', label: 'Meridian Retirement Trust' },
]

// 1099-R — Meridian Retirement Trust (Jessica Drake TY 2025)
const PAYER_DATA = {
  ein: '22-3334444',
  name: 'Meridian Retirement Trust',
  street: '500 Financial Plaza',
  city: 'Boston',
  state: 'MA',
  zip: '02110',
}

const RECIPIENT_DATA = {
  ssn: 'XXX-XX-4321',
  ...CLIENT_ADDRESS,
}

const FORM_DATA = {
  box1_grossDistrib:    '150,000', // Box 1 — Gross distribution (source; flagged)
  box2a_taxableAmt:     '100,000', // Box 2a — Taxable amount on return (source $150,000)
  box3_capitalGain:     '',        // Box 3 — Capital gain (in box 2a)
  box4_fedTaxWithheld:  '',        // Box 4 — Dropped on return (source $30,000)
  box5_employeeContrib: '',        // Box 5 — Employee contributions
  box7_distCode:        '7',       // Box 7 — Distribution code(s)
}

interface DetailFields1099RProps {
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string) => void
  amounts?: LiveAmounts
  onAmountChange?: (patch: Partial<LiveAmounts>, editedKey?: string) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  editedFields?: Set<string>
  verifiedDocs?: Set<string>
  onVerifyDoc?: (docKey: string) => void
  onAddFieldNote?: (text: string, context?: string) => void
  flaggedFields?: Record<string, string>
}

export default function DetailFields1099R({
  selectedField,
  highlightMode = 'blue',
  onFieldSelect,
  amounts,
  onAmountChange,
  onMarkReviewed,
  onMarkReviewedBulk,
  reviewedFields,
  editedFields: syncedEditedFields,
  verifiedDocs,
  onVerifyDoc,
  onAddFieldNote,
  flaggedFields = {},
}: DetailFields1099RProps) {
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [localEdited, setLocalEdited] = useState<Set<string>>(new Set())
  const [staticValues, setStaticValues] = useState<Record<string, string>>({})
  const [commentField, setCommentField] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentAnchor, setCommentAnchor] = useState<{ top: number; left: number } | null>(null)
  const commentRef = useRef<HTMLDivElement>(null)
  const isEdited = (key: string) => syncedEditedFields?.has(key) || localEdited.has(key)

  useEffect(() => {
    if (selectedField && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedField])

  useEffect(() => {
    if (!commentField) return
    const handler = (e: MouseEvent) => {
      if (commentRef.current && !commentRef.current.contains(e.target as Node)) {
        setCommentField(null); setCommentDraft(''); setCommentAnchor(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [commentField])

  const startEdit = (field: string, currentValue: string) => {
    const clean = currentValue.replace(/,/g, '')
    setEditingField(field)
    setDraftValue(clean)
  }

  const cancelEdit = () => { setEditingField(null); setDraftValue('') }

  const commitStaticEdit = (fieldKey: string, resolveKey = fieldKey) => {
    setStaticValues(prev => ({ ...prev, [fieldKey]: draftValue }))
    setEditingField(null)
    setLocalEdited(prev => new Set(prev).add(fieldKey))
    setSavedField(fieldKey)
    setTimeout(() => setSavedField(null), 3500)
    // Flow Box 4 withholding / Box 2a taxable into live 1040 amounts
    if (fieldKey === 'r-fedTaxWithheld') {
      onAmountChange?.({ rWithholding: parseAmountDraft(draftValue) }, 'r-fedTaxWithheld')
    } else if (fieldKey === 'r-taxableAmt') {
      onAmountChange?.({ taxablePension: parseAmountDraft(draftValue) }, 'r-taxableAmt')
    }
    if (draftValue.trim() || fieldKey === 'r-fedTaxWithheld' || fieldKey === 'r-taxableAmt') {
      onMarkReviewed?.(resolveKey)
    }
  }

  const ValidationNote = ({ issueKey, resolveKey }: { issueKey: string; resolveKey: string }) => {
    const issue = flaggedFields[issueKey]
    if (!issue || reviewedFields?.has(resolveKey)) return null
    return (
      <div className={styles.validationNote}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="6" cy="6" r="5.5" fill="#c9500f"/>
          <path d="M6 3.5V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="6" cy="8.5" r="0.6" fill="white"/>
        </svg>
        <span>{issue}</span>
      </div>
    )
  }

  const openComment = (fieldKey: string, btn: HTMLElement) => {
    const rect = btn.getBoundingClientRect()
    const popoverWidth = 280
    let left = rect.left - popoverWidth - 8
    if (left < 8) left = rect.right + 8
    setCommentAnchor({ top: rect.bottom, left })
    setCommentField(fieldKey)
    setCommentDraft('')
  }

  const postComment = (context: string) => {
    if (!commentDraft.trim()) return
    onAddFieldNote?.(commentDraft.trim(), context)
    setCommentField(null); setCommentDraft(''); setCommentAnchor(null)
  }

  const renderCommentBtn = (fieldKey: string, label: string) => {
    const context = `1099-R · ${label}`
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
            style={{ top: commentAnchor.top + 4, left: commentAnchor.left }}
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
              >Post</button>
            </div>
          </div>,
          document.body
        )}
      </>
    )
  }

  const renderStaticRow = (
    fieldKey: string,
    label: string,
    defaultValue: string,
    inputClass = styles.fieldInputSmall,
    selectedKey?: string,
    flagKey?: string,
    reviewedKey?: string,
  ) => {
    const selectKey = selectedKey ?? fieldKey
    const issueKey = flagKey ?? fieldKey
    const resolveKey = reviewedKey ?? fieldKey
    const syncedDisplay =
      fieldKey === 'r-fedTaxWithheld' && amounts && (amounts.rWithholding > 0 || isEdited('r-fedTaxWithheld'))
        ? (amounts.rWithholding ? amounts.rWithholding.toLocaleString() : '')
        : fieldKey === 'r-taxableAmt' && amounts
          ? amounts.taxablePension.toLocaleString()
          : null
    const currentVal = syncedDisplay ?? staticValues[fieldKey] ?? defaultValue
    const isEditing = editingField === fieldKey
    const isFlagged = !!flaggedFields[issueKey] && !reviewedFields?.has(resolveKey)
    const isReviewed = reviewedFields?.has(resolveKey)
    const isCommentOpen = commentField === fieldKey
    const isSelected = selectedField === selectKey || selectedField === fieldKey
    const flowsTo1040 = fieldKey === 'r-fedTaxWithheld' || fieldKey === 'r-taxableAmt'
    return (
      <>
      <div
        ref={isSelected ? highlightedRef : undefined}
        className={`${styles.fieldRow} ${isFlagged ? styles.fieldRowHasNote : ''} ${isCommentOpen ? styles.fieldRowCommentOpen : ''} ${isSelected ? (highlightMode === 'orange' && isFlagged ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
        onClick={() => onFieldSelect?.(selectKey)}
        style={{ cursor: 'pointer' }}
      >
        {flaggedFields[issueKey] ? (
          <span className={`${styles.fieldLabel} ${isFlagged ? styles.fieldLabelFlagged : ''}`}>
            {isFlagged && <span className={styles.issueIndicator} />}
            {label}
          </span>
        ) : (
          <span className={styles.fieldLabel}>{label}</span>
        )}
        <input
          className={`${styles.fieldInput} ${inputClass} ${isEditing ? styles.fieldInputEditing : isFlagged ? styles.fieldInputHighlightedOrange : isSelected ? styles.fieldInputHighlighted : ''}`}
          readOnly={!isEditing}
          value={isEditing ? draftValue : currentVal}
          onChange={e => setDraftValue(e.target.value)}
          autoFocus={isEditing}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitStaticEdit(fieldKey, resolveKey) }
            if (e.key === 'Escape') cancelEdit()
          }}
          onClick={e => { e.stopPropagation(); if (!isEditing) startEdit(fieldKey, currentVal) }}
        />
        {isEditing ? (
          <div className={styles.editActions}>
            <button className={styles.saveBtn} onClick={() => commitStaticEdit(fieldKey, resolveKey)}>Save</button>
            <button className={styles.undoBtn} onClick={cancelEdit}>Undo</button>
          </div>
        ) : isReviewed ? (
          (() => {
            const meta = reviewedFields?.get(resolveKey)
            const tip = meta ? `Reviewed by ${meta.by} · ${meta.at} — Click to unmark` : 'Click to unmark'
            return (
              <Tooltip text={tip} placement="top">
                <button className={styles.markCorrectBtn} style={{ color: '#108000' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(resolveKey) }}><CircleCheck size="small" /></button>
              </Tooltip>
            )
          })()
        ) : (
          <div className={styles.fieldActions}>
            <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(resolveKey) }}><CircleCheck size="small" /></button></Tooltip>
            {renderCommentBtn(fieldKey, label)}
          </div>
        )}
        {savedField === fieldKey && <span className={styles.recalcBadge}>{flowsTo1040 ? '1040 updated' : 'Saved'}</span>}
        {isEdited(fieldKey) && savedField !== fieldKey && <span className={styles.editedBadge}>Edited</span>}
      </div>
      {flaggedFields[issueKey] && <ValidationNote issueKey={issueKey} resolveKey={resolveKey} />}
      </>
    )
  }

  const rVerified = verifiedDocs?.has('1099-r')

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <h2 style={{ fontFamily: 'var(--font-family-component)', fontSize: 18, fontWeight: 500, color: '#21262a', margin: 0, flex: 1, textAlign: 'left' }}>Details: Retirement Distribution (1099-R)</h2>
          {rVerified ? (
            <button className={styles.verifiedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => onVerifyDoc?.('1099-r')}><CheckIcon /> Verified</button>
          ) : (
            <button className={styles.markVerifiedBtn} onClick={() => {
              onVerifyDoc?.('1099-r')
              const docFieldKeys = [
                'r-ein', 'r-payerName', 'r-street', 'r-cityStateZip',
                'r-ssn', 'r-recipientName', 'r-recipientStreet', 'r-recipientCityStateZip',
                'r-grossDistrib',
                // Phase 1 flag resolveKey for Box 1 — required to clear orange
                'grossDistrib-meridian',
                'r-taxableAmt', 'r-capitalGain', 'r-fedTaxWithheld',
                'r-employeeContrib', 'r-distCode',
              ]
              onMarkReviewedBulk?.(docFieldKeys)
            }}>Mark as verified</button>
          )}
        </div>
      </div>

      <div className={styles.inputContainer}>

        {/* ── Payer Information ── */}
        <div className={styles.sectionHeader}>
          Payer Information (MANDATORY for e-file)
        </div>

        {renderStaticRow('r-ein', '(a) Payer\'s federal ID number (EIN)', PAYER_DATA.ein)}
        {renderStaticRow('r-payerName', '(b) Payer\'s name', PAYER_DATA.name, styles.fieldInputWide)}
        {renderStaticRow('r-street', 'Street address', PAYER_DATA.street, styles.fieldInputWide)}
        {renderStaticRow('r-cityStateZip', 'City / State / ZIP code', `${PAYER_DATA.city}, ${PAYER_DATA.state} ${PAYER_DATA.zip}`, styles.fieldInputWide)}

        {/* ── Recipient Information ── */}
        <div className={styles.sectionHeader}>Recipient Information</div>

        {renderStaticRow('r-ssn', 'Recipient\'s TIN', RECIPIENT_DATA.ssn)}
        {renderStaticRow('r-recipientName', 'Recipient\'s name', RECIPIENT_DATA.name, styles.fieldInputWide)}
        {renderStaticRow('r-recipientStreet', 'Street address', RECIPIENT_DATA.street, styles.fieldInputWide)}
        {renderStaticRow('r-recipientCityStateZip', 'City / State / ZIP code', `${RECIPIENT_DATA.city}, ${RECIPIENT_DATA.state} ${RECIPIENT_DATA.zip}`, styles.fieldInputWide)}

        {/* ── Distribution Income ── */}
        <div className={styles.sectionHeader}>Distribution Income</div>

        {renderStaticRow('r-grossDistrib', '(1) Gross distribution', FORM_DATA.box1_grossDistrib, styles.fieldInputSmall, 'grossDistrib', 'grossDistrib', 'grossDistrib-meridian')}
        {renderStaticRow('r-taxableAmt', '(2a) Taxable amount', FORM_DATA.box2a_taxableAmt)}
        {renderStaticRow('r-capitalGain', '(3) Capital gain (in box 2a)', FORM_DATA.box3_capitalGain)}
        {renderStaticRow('r-fedTaxWithheld', '(4) Federal income tax withheld', FORM_DATA.box4_fedTaxWithheld, styles.fieldInputSmall, 'withholding1099')}
        {renderStaticRow('r-employeeContrib', '(5) Employee contributions', FORM_DATA.box5_employeeContrib)}
        {renderStaticRow('r-distCode', '(7) Distribution code(s)', FORM_DATA.box7_distCode)}

      </div>
    </div>
  )
}
