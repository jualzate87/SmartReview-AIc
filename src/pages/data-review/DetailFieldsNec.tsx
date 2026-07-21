import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Comment } from '@design-systems/icons'
import Tooltip from './Tooltip'
import { DestinationFieldLabel } from './DestinationFieldLabel'
import { CLIENT_ADDRESS } from '../../data/clientAddress'
import { NEC_SOURCE_AMOUNT, parseAmountDraft, type LiveAmounts } from '../../data/liveReturn'
import styles from '../../styles/data-review/DetailFields.module.css'

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M19.0711 7.0506C18.8836 6.86313 18.6293 6.75781 18.3641 6.75781C18.099 6.75781 17.8447 6.86313 17.6571 7.0506L9.87916 14.8286L6.34316 11.2936C6.15456 11.1115 5.90195 11.0107 5.63976 11.0129C5.37756 11.0152 5.12675 11.1204 4.94134 11.3058C4.75593 11.4912 4.65076 11.742 4.64848 12.0042C4.6462 12.2664 4.747 12.519 4.92916 12.7076L9.17216 16.9506C9.35968 17.1381 9.61399 17.2434 9.87916 17.2434C10.1443 17.2434 10.3986 17.1381 10.5861 16.9506L19.0711 8.4646C19.2586 8.27707 19.3639 8.02276 19.3639 7.7576C19.3639 7.49244 19.2586 7.23813 19.0711 7.0506Z" fill="currentColor"/>
    </svg>
  )
}

export type NecPayer = 'summit'

export const NEC_PAYER_TABS: { key: NecPayer; label: string }[] = [
  { key: 'summit', label: 'Summit Advisory Partners' },
]

// 1099-NEC — Summit Advisory Partners (Jessica Drake TY 2025)
const PAYER_DATA = {
  ein: '47-2201893',
  name: 'Summit Advisory Partners LLC',
  street: '410 Congress Street, Suite 900',
  city: 'Boston',
  state: 'MA',
  zip: '02210',
  payerPhone: '617 555-0143',
}

const RECIPIENT_DATA = {
  ssn: 'XXX-XX-4321',
  ...CLIENT_ADDRESS,
}

const FORM_DATA = {
  // Box 1 — silent omit (error #10): source doc shows $24,000; return starts at $0
  box1_nonemployeeComp: '0',
  box4_fedTaxWithheld:  '',
  box5_stateTaxId:      '',
  box6_stateTax:        '',
  box7_stateIncome:     '',
}

const DOC_KEY = '1099-nec'

interface DetailFieldsNecProps {
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string) => void
  amounts?: LiveAmounts
  onAmountChange?: (patch: Partial<LiveAmounts>, editedKey?: string) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  editedFields?: Set<string>
  /** Persisted static field values */
  fieldOverrides?: Record<string, string>
  /** Persist a static field edit (also stamps Edited badge) */
  onFieldOverride?: (fieldKey: string, value: string) => void
  verifiedDocs?: Set<string>
  onVerifyDoc?: (docKey: string) => void
  onAddFieldNote?: (text: string, context?: string) => void
}

export default function DetailFieldsNec({
  selectedField,
  highlightMode = 'blue',
  onFieldSelect,
  amounts,
  onAmountChange,
  onMarkReviewed,
  onMarkReviewedBulk,
  reviewedFields,
  editedFields: syncedEditedFields,
  fieldOverrides = {},
  onFieldOverride,
  verifiedDocs,
  onVerifyDoc,
  onAddFieldNote,
}: DetailFieldsNecProps) {
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [localEdited, setLocalEdited] = useState<Set<string>>(new Set())
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

  const startEdit = (field: string, currentValue: string) => {
    const clean = currentValue.replace(/,/g, '')
    setEditingField(field)
    setDraftValue(clean)
    setOriginalValue(clean)
  }

  const cancelEdit = () => { setEditingField(null); setDraftValue(''); setOriginalValue('') }

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
    const context = `1099-NEC · ${label}`
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
    selectKey?: string,
  ) => {
    const select = selectKey ?? fieldKey
    // Box 1 always reads from synced amounts (seeded 0 / necOnReturn false).
    // Source $24,000 lives only on the JPEG preview until the user edits+saves.
    const syncedNecDisplay =
      fieldKey === 'nec-box1' && amounts
        ? (amounts.necIncome > 0 ? amounts.necIncome.toLocaleString() : '0')
        : null
    const currentVal = syncedNecDisplay ?? fieldOverrides[fieldKey] ?? defaultValue
    const isEditing = editingField === fieldKey
    const isReviewed = reviewedFields?.has(fieldKey)
    const isCommentOpen = commentField === fieldKey
    const isSelected = selectedField === select || selectedField === fieldKey || selectedField === 'necIncome'
    const commitStatic = () => {
      if (editingField !== fieldKey) return
      if (draftValue !== originalValue) {
        onFieldOverride?.(fieldKey, draftValue)
        setLocalEdited(prev => new Set(prev).add(fieldKey))
        setSavedField(fieldKey)
        setTimeout(() => setSavedField(null), 3500)
        // Saving NEC Box 1 confirms omitted income onto Form 1040 line 8
        if (fieldKey === 'nec-box1') {
          const parsed = parseAmountDraft(draftValue)
          // Empty save defaults to source amount (the planted miss the preparer is correcting)
          const num = parsed > 0 ? parsed : NEC_SOURCE_AMOUNT
          onAmountChange?.({ necIncome: num, necOnReturn: true }, 'nec-box1')
        }
        if (draftValue.trim() || fieldKey === 'nec-box1') onMarkReviewed?.(fieldKey)
      }
      setEditingField(null)
    }
    return (
      <div
        ref={isSelected ? highlightedRef : undefined}
        className={`${styles.fieldRow} ${isCommentOpen ? styles.fieldRowCommentOpen : ''} ${isSelected ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
        onClick={() => onFieldSelect?.(select)}
        style={{ cursor: 'pointer' }}
      >
        <DestinationFieldLabel fieldKey={fieldKey} className={styles.fieldLabel}>
          {label}
        </DestinationFieldLabel>
        <input
          className={`${styles.fieldInput} ${inputClass} ${isEditing ? styles.fieldInputEditing : isSelected ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
          readOnly={!isEditing}
          value={isEditing ? draftValue : currentVal}
          onChange={e => setDraftValue(e.target.value)}
          autoFocus={isEditing}
          onClick={e => { e.stopPropagation(); if (!isEditing) startEdit(fieldKey, currentVal) }}
          onBlur={commitStatic}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitStatic() }
            if (e.key === 'Escape') cancelEdit()
          }}
        />
        {isEditing ? (
          <div className={styles.editActions}>
            <button
              type="button"
              className={styles.undoBtn}
              onMouseDown={e => e.preventDefault()}
              onClick={cancelEdit}
            >
              Undo
            </button>
          </div>
        ) : isReviewed ? (
          (() => {
            const meta = reviewedFields?.get(fieldKey)
            const tip = meta ? `Reviewed by ${meta.by} · ${meta.at}. Click to unmark` : 'Click to unmark'
            return (
              <Tooltip text={tip} placement="top">
                <button className={styles.markCorrectBtn} style={{ color: '#108000' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button>
              </Tooltip>
            )
          })()
        ) : (
          <div className={styles.fieldActions}>
            <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button></Tooltip>
            {renderCommentBtn(fieldKey, label)}
          </div>
        )}
        {savedField === fieldKey && <span className={styles.recalcBadge}>{fieldKey === 'nec-box1' ? '1040 updated' : 'Saved'}</span>}
        {isEdited(fieldKey) && savedField !== fieldKey && <span className={styles.editedBadge}>Edited</span>}
      </div>
    )
  }

  const necVerified = verifiedDocs?.has(DOC_KEY)

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <h2 style={{ fontFamily: 'var(--font-family-component)', fontSize: 18, fontWeight: 500, color: '#21262a', margin: 0, flex: 1, textAlign: 'left' }}>Details: Nonemployee Comp (1099-NEC)</h2>
          {necVerified ? (
            <button className={styles.verifiedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => onVerifyDoc?.(DOC_KEY)}><CheckIcon /> Verified</button>
          ) : (
            <button className={styles.markVerifiedBtn} onClick={() => {
              onVerifyDoc?.(DOC_KEY)
              const docFieldKeys = [
                'nec-ein', 'nec-payerName', 'nec-street', 'nec-cityStateZip', 'nec-phone',
                'nec-ssn', 'nec-recipientName', 'nec-recipientStreet', 'nec-recipientCityStateZip',
                'nec-box1', 'nec-fedTaxWithheld', 'nec-stateTaxId', 'nec-stateTax', 'nec-stateIncome',
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

        {renderStaticRow('nec-ein', "(a) Payer's federal ID number (EIN)", PAYER_DATA.ein)}
        {renderStaticRow('nec-payerName', "(b) Payer's name", PAYER_DATA.name, styles.fieldInputWide)}
        {renderStaticRow('nec-street', 'Street address', PAYER_DATA.street, styles.fieldInputWide)}
        {renderStaticRow('nec-cityStateZip', 'City / State / ZIP code', `${PAYER_DATA.city}, ${PAYER_DATA.state} ${PAYER_DATA.zip}`, styles.fieldInputWide)}
        {renderStaticRow('nec-phone', "Payer's telephone number", PAYER_DATA.payerPhone)}

        {/* ── Recipient Information ── */}
        <div className={styles.sectionHeader}>Recipient Information</div>

        {renderStaticRow('nec-ssn', "(c) Recipient's SSN or ITIN", RECIPIENT_DATA.ssn)}
        {renderStaticRow('nec-recipientName', "(d) Recipient's name", RECIPIENT_DATA.name, styles.fieldInputWide)}
        {renderStaticRow('nec-recipientStreet', 'Street address', RECIPIENT_DATA.street, styles.fieldInputWide)}
        {renderStaticRow('nec-recipientCityStateZip', 'City / State / ZIP code', `${RECIPIENT_DATA.city}, ${RECIPIENT_DATA.state} ${RECIPIENT_DATA.zip}`, styles.fieldInputWide)}

        {/* ── Nonemployee Compensation ── */}
        <div className={styles.sectionHeader}>Nonemployee Compensation</div>

        {renderStaticRow('nec-box1', '(1) Nonemployee compensation', FORM_DATA.box1_nonemployeeComp, styles.fieldInputSmall, 'nec-box1')}
        {renderStaticRow('nec-fedTaxWithheld', '(4) Federal income tax withheld', FORM_DATA.box4_fedTaxWithheld)}

        {/* ── State Tax Information ── */}
        <div className={styles.sectionHeader}>State Tax Information</div>

        {renderStaticRow('nec-stateTaxId', "(5) State / Payer's state ID number", FORM_DATA.box5_stateTaxId)}
        {renderStaticRow('nec-stateTax', '(6) State income tax withheld', FORM_DATA.box6_stateTax)}
        {renderStaticRow('nec-stateIncome', '(7) State income', FORM_DATA.box7_stateIncome)}

      </div>
    </div>
  )
}
