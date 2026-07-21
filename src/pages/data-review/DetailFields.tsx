import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Comment } from '@design-systems/icons'
import Tooltip from './Tooltip'
import { DestinationFieldLabel } from './DestinationFieldLabel'
import styles from '../../styles/data-review/DetailFields.module.css'
import { getBox12SubRowKeys, isBox12FlagResolved } from './phase1FieldSync'

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M19.0711 7.0506C18.8836 6.86313 18.6293 6.75781 18.3641 6.75781C18.099 6.75781 17.8447 6.86313 17.6571 7.0506L9.87916 14.8286L6.34316 11.2936C6.15456 11.1115 5.90195 11.0107 5.63976 11.0129C5.37756 11.0152 5.12675 11.1204 4.94134 11.3058C4.75593 11.4912 4.65076 11.742 4.64848 12.0042C4.6462 12.2664 4.747 12.519 4.92916 12.7076L9.17216 16.9506C9.35968 17.1381 9.61399 17.2434 9.87916 17.2434C10.1443 17.2434 10.3986 17.1381 10.5861 16.9506L19.0711 8.4646C19.2586 8.27707 19.3639 8.02276 19.3639 7.7576C19.3639 7.49244 19.2586 7.23813 19.0711 7.0506Z" fill="currentColor"/>
    </svg>
  )
}


export type W2Employer = 'bingEquipment' | 'techCircle'

export const W2_PAYER_TABS: { key: W2Employer; label: string }[] = [
  { key: 'techCircle', label: 'Tech Circle' },
]

type FieldValuesKey = 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs'

export type Box12Sub = 'a' | 'b' | 'c' | 'd'
export type Box12RowsState = Record<Box12Sub, { code: string; amount: number }>

interface DetailFieldsProps {
  formTitle: string
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string | null) => void
  activeSubTab?: W2Employer
  onSubTabChange?: (tab: string) => void
  wages?: { bingEquipment: number; techCircle: number }
  onWageChange?: (employer: string, value: number) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: FieldValuesKey, value: number) => void
  /** Synced Box 12 a–d codes + amounts (persists across Save / refresh) */
  box12Rows?: Box12RowsState
  onBox12RowChange?: (sub: Box12Sub, patch: { code?: string; amount?: number }) => void
  /** Synced SSN / EIN (blank at session start — planted import errors) */
  identityValues?: { ssn: string; ein: string }
  onIdentityChange?: (kind: 'ssn' | 'ein', value: string) => void
  /** W-2 Box 13 checkboxes */
  box13?: {
    retirementPlan: boolean
    statutoryEmployee: boolean
    thirdPartySickPay: boolean
  }
  onBox13Change?: (patch: Partial<{
    retirementPlan: boolean
    statutoryEmployee: boolean
    thirdPartySickPay: boolean
  }>) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  editedFields?: Set<string>
  /** Who/when for last edit — optional; shown on Edited badge tooltip */
  editedFieldsMeta?: Map<string, { by: string; at: string }>
  /** Persisted static field values (employer name, addresses, …) */
  fieldOverrides?: Record<string, string>
  /** Persist a static field edit (also stamps Edited badge) */
  onFieldOverride?: (fieldKey: string, value: string) => void
  /** Map of doc field key → issue summary shown as a hover tooltip */
  flaggedFields?: Record<string, string>
  verifiedDocs?: Set<string>
  /** Who/when for Mark as verified */
  verifiedDocsMeta?: Map<string, { by: string; at: string }>
  onVerifyDoc?: (docKey: string) => void
  /** Called when user posts a note from a field popover: (text, contextLabel) */
  onAddFieldNote?: (text: string, context: string) => void
}

// Static non-wages fields per employer
const EMPLOYER_DATA = {
  bingEquipment: {
    id: '12-3456789',
    name: 'Bing Equipment',
    street: '3833 Soundtech Ct SE',
    city: 'Kentwood', state: 'CA', zip: '93004',
    federalTax: '10,000',
    socialSecurityWages: '60,000', ssTax: '3,720',
    medicareWages: '60,000', medicareTax: '870',
    ssTips: '25', allocatedTips: '0',
    dependentCare: '25', nonqualified: '39',
    box12Code: '' as string, box12Amount: '' as string,
  },
  techCircle: {
    id: '94-1234567',
    name: 'Tech Circle Inc',
    street: '321 Main Orchard Dr',
    city: 'Reno', state: 'NV', zip: '89501',
    federalTax: '15,840',
    socialSecurityWages: '148,940', ssTax: '9,234.28',
    medicareWages: '148,940', medicareTax: '2,159.63',
    ssTips: '0', allocatedTips: '0',
    dependentCare: '0', nonqualified: '0',
    box12Code: '' as string, box12Amount: '' as string,
    box12Entries: [
      { sub: 'a', code: 'C', amount: '' },
      { sub: 'b', code: 'AA', amount: '' },
      { sub: 'c', code: 'DD', amount: '' },
      { sub: 'd', code: '', amount: '' },
    ],
  },
}

export default function DetailFields({
  formTitle,
  selectedField,
  highlightMode = 'blue',
  onFieldSelect,
  activeSubTab = 'techCircle',
  onSubTabChange,
  wages = { bingEquipment: 0, techCircle: 118940 },
  onWageChange,
  fieldValues,
  onFieldValueChange,
  box12Rows,
  onBox12RowChange,
  identityValues,
  onIdentityChange,
  box13,
  onBox13Change,
  onMarkReviewed,
  onMarkReviewedBulk,
  reviewedFields,
  editedFields: syncedEditedFields,
  editedFieldsMeta,
  fieldOverrides = {},
  onFieldOverride,
  flaggedFields = {},
  verifiedDocs,
  verifiedDocsMeta,
  onVerifyDoc,
  onAddFieldNote,
}: DetailFieldsProps) {
  const employer = EMPLOYER_DATA[activeSubTab]
  const currentWages = wages[activeSubTab]
  const highlightedRef = useRef<HTMLDivElement>(null)
  const withholdingRef = useRef<HTMLDivElement>(null)
  const box12Ref = useRef<HTMLDivElement>(null)

  // Track which field is in edit mode, its draft value, and original for undo
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [originalValue, setOriginalValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  // Local edits merge with synced editedFields for audit-trail badges across navigation
  const [localEdited, setLocalEdited] = useState<Set<string>>(new Set())
  const isEdited = (key: string) => syncedEditedFields?.has(key) || localEdited.has(key)
  const editMetaText = (key: string) => {
    const m = editedFieldsMeta?.get(key)
    return m ? `Edited · ${m.by} · ${m.at}` : 'Edited'
  }
  const reviewedTip = (key: string, active: boolean) => {
    if (!active) return 'Mark as correct'
    const m = reviewedFields?.get(key)
    return m ? `Marked correct · ${m.by} · ${m.at}` : 'Click to unmark'
  }
  // Field key whose comment popover is currently open + its anchor position (fixed)
  const [commentField, setCommentField] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentAnchor, setCommentAnchor] = useState<{ top: number; left: number } | null>(null)
  const commentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ref =
      selectedField === 'withholding' ? withholdingRef :
      selectedField === 'box12'       ? box12Ref       :
      highlightedRef
    if (selectedField && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedField])

  const startEdit = (field: string, currentValue: string) => {
    const clean = currentValue.replace(/,/g, '')
    setEditingField(field)
    setDraftValue(clean)
    setOriginalValue(clean)
  }

  const commitEdit = (field: FieldValuesKey) => {
    if (editingField !== field) return
    const num = parseFloat(draftValue.replace(/,/g, '')) || 0
    if (draftValue !== originalValue) {
      onFieldValueChange?.(field, num)
      setLocalEdited(prev => new Set(prev).add(field))
      setSavedField(field)
      setTimeout(() => setSavedField(null), 3500)
      onMarkReviewed?.(field)
    }
    setEditingField(null)
  }

  const commitWagesEdit = () => {
    if (editingField !== 'wages') return
    const num = parseFloat(draftValue.replace(/,/g, '')) || 0
    if (draftValue !== originalValue) {
      onWageChange?.(activeSubTab, num)
      setLocalEdited(prev => new Set(prev).add(`wages-${activeSubTab}`))
      setSavedField('wages')
      setTimeout(() => setSavedField(null), 3500)
      onMarkReviewed?.(`wages-${activeSubTab}`)
    }
    setEditingField(null)
  }

  const cancelEdit = () => {
    setEditingField(null)
    setDraftValue('')
    setOriginalValue('')
  }

  const box12Resolved = isBox12FlagResolved(reviewedFields ?? new Map(), activeSubTab)

  /** Mark a Box 12 sub-row reviewed and sync the Phase 1 `box12` flag when all rows are done. */
  const markBox12RowReviewed = (rowKey: string) => {
    onMarkReviewed?.(rowKey)
    const subRows = getBox12SubRowKeys(activeSubTab)
    const allReviewed = subRows.every(k => k === rowKey || reviewedFields?.has(k))
    if (allReviewed) onMarkReviewed?.('box12')
  }

  // Renders label text with an orange dot when the field is flagged by an AI issue
  const FlaggedLabel = ({ fieldKey, children }: { fieldKey: string; children: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) {
      return (
        <DestinationFieldLabel fieldKey={fieldKey} className={styles.fieldLabel}>
          {children}
        </DestinationFieldLabel>
      )
    }
    return (
      <DestinationFieldLabel fieldKey={fieldKey} className={`${styles.fieldLabel} ${styles.fieldLabelFlagged}`}>
        <span className={styles.issueIndicator} />
        {children}
      </DestinationFieldLabel>
    )
  }

  // Renders an inline validation note beneath a flagged field row.
  // When the field is reviewed: note stays but icon turns green and text gets a strikethrough.
  const ValidationNote = ({ fieldKey }: { fieldKey: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) return null
    // Use the correct reviewed key — wages uses `wages-${activeSubTab}`, box12 aggregates sub-rows
    const reviewedKey = fieldKey === 'wages' ? `wages-${activeSubTab}` : fieldKey
    const isReviewed = fieldKey === 'box12'
      ? box12Resolved
      : reviewedFields?.has(reviewedKey)
    if (isReviewed) return null
    return (
      <div className={styles.validationNote} style={isReviewed ? { color: '#1a6b35', borderBottomColor: '#e8edf0' } : {}}>
        {isReviewed ? (
          <CircleCheck size="small" style={{ flexShrink: 0 }} />
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="6" cy="6" r="5.5" fill="#c9500f"/>
            <path d="M6 3.5V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="6" cy="8.5" r="0.6" fill="white"/>
          </svg>
        )}
        <span style={isReviewed ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>{issue}</span>
      </div>
    )
  }

  // Close popover on outside click
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
    setCommentField(null)
    setCommentDraft('')
    setCommentAnchor(null)
  }

  // Returns just the button + portal (no wrapper div) — caller places it inside fieldActions
  const renderCommentBtn = (fieldKey: string, label: string, section: string) => {
    const context = `${section} · ${label}`
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

  // Generic editable row — auto-saves on blur / Enter (no Save button)
  const renderStaticRow = (fieldKey: string, label: string, defaultValue: string, inputClass = styles.fieldInputSmall) => {
    const key = `${fieldKey}-${activeSubTab}`
    const identitySynced =
      fieldKey === 'ssn' && identityValues?.ssn
        ? identityValues.ssn
        : fieldKey === 'ein' && identityValues?.ein
          ? identityValues.ein
          : null
    const currentVal = identitySynced ?? fieldOverrides[key] ?? defaultValue
    const isEditing = editingField === key
    const isReviewed = reviewedFields?.has(key)
    const isCommentOpen = commentField === key
    // A flagged static row (e.g. missing EIN) shows the same orange dot + validation note as other import flags
    const isFlagged = !!flaggedFields[fieldKey] && !isReviewed
    const commitStatic = () => {
      if (editingField !== key) return
      const next = draftValue
      if (next !== originalValue) {
        onFieldOverride?.(key, next)
        setLocalEdited(prev => new Set(prev).add(key))
        setSavedField(key)
        setTimeout(() => setSavedField(null), 2000)
        if (fieldKey === 'ssn') onIdentityChange?.('ssn', next.trim())
        if (fieldKey === 'ein') onIdentityChange?.('ein', next.trim())
        if (next.trim()) onMarkReviewed?.(key)
      }
      setEditingField(null)
    }
    return (
      <>
      <div
        className={`${styles.fieldRow} ${isFlagged ? styles.fieldRowHasNote : ''} ${isCommentOpen ? styles.fieldRowCommentOpen : ''}`}
        onClick={() => onFieldSelect?.(key)}
        style={{ cursor: 'pointer' }}
      >
        {flaggedFields[fieldKey] ? (
          <DestinationFieldLabel fieldKey={key} className={`${styles.fieldLabel} ${isFlagged ? styles.fieldLabelFlagged : ''}`}>
            {isFlagged && <span className={styles.issueIndicator} />}
            {label}
          </DestinationFieldLabel>
        ) : (
          <DestinationFieldLabel fieldKey={key} className={styles.fieldLabel}>
            {label}
          </DestinationFieldLabel>
        )}
        <input
          className={`${styles.fieldInput} ${inputClass} ${isEditing ? styles.fieldInputEditing : ''}`}
          readOnly={!isEditing}
          value={isEditing ? draftValue : currentVal}
          onChange={e => setDraftValue(e.target.value)}
          autoFocus={isEditing}
          onClick={e => { e.stopPropagation(); if (!isEditing) startEdit(key, currentVal) }}
          onBlur={commitStatic}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); commitStatic() }
            if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
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
          <Tooltip text={reviewedTip(key, true)} placement="top">
            <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(key) }}><CircleCheck size="small" /></button>
          </Tooltip>
        ) : (
          <div className={styles.fieldActions}>
            <Tooltip text={reviewedTip(key, false)} placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(key) }}><CircleCheck size="small" /></button></Tooltip>
            {renderCommentBtn(key, label, employer.name)}
          </div>
        )}
        {savedField === key && <span className={styles.recalcBadge}>Saved</span>}
        {isEdited(key) && savedField !== key && (
          <Tooltip text={editMetaText(key)} placement="top">
            <span className={styles.editedBadge}>Edited</span>
          </Tooltip>
        )}
      </div>
      {flaggedFields[fieldKey] && !isReviewed && (
        <div className={styles.validationNote} style={isReviewed ? { color: '#1a6b35', borderBottomColor: '#e8edf0' } : {}}>
          {isReviewed ? (
            <CircleCheck size="small" style={{ flexShrink: 0 }} />
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="6" cy="6" r="5.5" fill="#c9500f"/>
              <path d="M6 3.5V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="6" cy="8.5" r="0.6" fill="white"/>
            </svg>
          )}
          <span style={isReviewed ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>{flaggedFields[fieldKey]}</span>
        </div>
      )}
      </>
    )
  }

  const isVerified = verifiedDocs?.has(activeSubTab) ?? false
  const verifiedMeta = verifiedDocsMeta?.get(activeSubTab)
  const verifiedTooltip = verifiedMeta
    ? `Verified · ${verifiedMeta.by} · ${verifiedMeta.at}`
    : 'Click to unmark verified'

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <h2 style={{ fontFamily: 'var(--font-family-component)', fontSize: 18, fontWeight: 500, color: '#21262a', margin: 0, flex: 1, textAlign: 'left' }}>{formTitle}</h2>
          {isVerified ? (
            <Tooltip text={verifiedTooltip} placement="top">
              <button className={styles.verifiedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => onVerifyDoc?.(activeSubTab)}><CheckIcon size={14} /> Verified</button>
            </Tooltip>
          ) : (
            <button
              className={styles.markVerifiedBtn}
              onClick={() => {
                onVerifyDoc?.(activeSubTab)
                const fieldKeys = [
                  `ssn-${activeSubTab}`, `wages-${activeSubTab}`,
                  'withholding', 'box12',
                  ...getBox12SubRowKeys(activeSubTab),
                  `ein-${activeSubTab}`, `employerName-${activeSubTab}`,
                  `street-${activeSubTab}`, `cityStateZip-${activeSubTab}`,
                  `sswages-${activeSubTab}`, `sstax-${activeSubTab}`,
                  `medicarewages-${activeSubTab}`, `medicaretax-${activeSubTab}`,
                  `sstips-${activeSubTab}`, `allocatedtips-${activeSubTab}`,
                  `dependentcare-${activeSubTab}`, `nonqualified-${activeSubTab}`,
                ]
                onMarkReviewedBulk?.(fieldKeys)
              }}
            >Mark as verified</button>
          )}
        </div>
      </div>

      {/* Scrollable input fields */}
      <div className={styles.inputContainer}>
        {/* Employer Information section */}
        <div className={styles.sectionHeader}>
          Employer Information (MANDATORY for e-file)
        </div>

        {renderStaticRow('ssn', '(a) Employee social security number', 'Not found')}
        {renderStaticRow('ein', '(b) Employer identification number', activeSubTab === 'techCircle' ? 'Not found' : (employer.id || 'Not found'))}
        {renderStaticRow('employerName', '(c) Name of employer', employer.name, styles.fieldInputWide)}
        {renderStaticRow('street', 'Street address', employer.street, styles.fieldInputWide)}
        {renderStaticRow('cityStateZip', 'City / State / ZIP code', `${employer.city}, ${employer.state} ${employer.zip}`, styles.fieldInputWide)}

        {/* Wages section — same grey header as Employer Information */}
        <div className={styles.sectionHeader}>Wages</div>

        {/* (1) Wages — editable, drives 1040 line 1a */}
        <div
          ref={selectedField === 'wages' ? highlightedRef : undefined}
          className={`${styles.fieldRow} ${flaggedFields['wages'] ? styles.fieldRowHasNote : ''} ${selectedField === 'wages' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''} ${commentField === `wages-${activeSubTab}` ? styles.fieldRowCommentOpen : ''}`}
          onClick={() => onFieldSelect?.('wages')}
          style={{ cursor: 'pointer' }}
        >
          <FlaggedLabel fieldKey="wages">(1) Wages, tips, etc.</FlaggedLabel>
          <input
            className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'wages' ? styles.fieldInputEditing : flaggedFields['wages'] && !reviewedFields?.has(`wages-${activeSubTab}`) ? styles.fieldInputHighlightedOrange : selectedField === 'wages' ? styles.fieldInputHighlighted : ''}`}
            readOnly={editingField !== 'wages'}
            value={editingField === 'wages' ? draftValue : currentWages.toLocaleString()}
            onChange={e => setDraftValue(e.target.value)}
            autoFocus={editingField === 'wages'}
            onClick={e => { e.stopPropagation(); if (editingField !== 'wages') startEdit('wages', currentWages.toString()) }}
            onBlur={commitWagesEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); commitWagesEdit() }
              if (e.key === 'Escape') cancelEdit()
            }}
          />
          {editingField === 'wages' ? (
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
          ) : reviewedFields?.has(`wages-${activeSubTab}`) ? (
            <Tooltip text="Click to unmark" placement="top">
              <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(`wages-${activeSubTab}`) }}><CircleCheck size="small" /></button>
            </Tooltip>
          ) : (
            <div className={styles.fieldActions}>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(`wages-${activeSubTab}`) }}><CircleCheck size="small" /></button></Tooltip>
              {renderCommentBtn(`wages-${activeSubTab}`, '(1) Wages, tips, etc.', employer.name)}
            </div>
          )}
          {savedField === 'wages' && <span className={styles.recalcBadge}>1040 updated</span>}
          {isEdited(`wages-${activeSubTab}`) && savedField !== 'wages' && <span className={styles.editedBadge}>Edited</span>}
        </div>
        <ValidationNote fieldKey="wages" />

        <div
          ref={withholdingRef}
          className={`${styles.fieldRow} ${selectedField === 'withholding' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''} ${commentField === `withholding-${activeSubTab}` ? styles.fieldRowCommentOpen : ''}`}
          onClick={() => onFieldSelect?.('withholding')}
          style={{ cursor: 'pointer' }}
        >
          <FlaggedLabel fieldKey="withholding">(2) Federal income tax withheld</FlaggedLabel>
          <input
            className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'withholding' ? styles.fieldInputEditing : selectedField === 'withholding' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
            readOnly={editingField !== 'withholding'}
            value={editingField === 'withholding' ? draftValue : (fieldValues?.withholding !== undefined ? fieldValues.withholding.toLocaleString() : employer.federalTax)}
            onChange={e => setDraftValue(e.target.value)}
            autoFocus={editingField === 'withholding'}
            onClick={e => { e.stopPropagation(); if (editingField !== 'withholding') startEdit('withholding', fieldValues?.withholding?.toString() ?? employer.federalTax) }}
            onBlur={() => commitEdit('withholding')}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('withholding') } if (e.key === 'Escape') cancelEdit() }}
          />
          {editingField === 'withholding' ? (
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
          ) : reviewedFields?.has('withholding') ? (
            <span className={styles.reviewedBadge}><CircleCheck size="small" /></span>
          ) : (
            <div className={styles.fieldActions}>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('withholding') }}><CircleCheck size="small" /></button></Tooltip>
              {renderCommentBtn(`withholding-${activeSubTab}`, '(2) Federal income tax withheld', employer.name)}
            </div>
          )}
          {savedField === 'withholding' && <span className={styles.recalcBadge}>1040 updated</span>}
          {isEdited('withholding') && savedField !== 'withholding' && <span className={styles.editedBadge}>Edited</span>}
        </div>
        {renderStaticRow('sswages', '(3) Social security wages', employer.socialSecurityWages)}
        {renderStaticRow('sstax', '(4) Social security tax withheld', employer.ssTax)}
        {renderStaticRow('medicarewages', '(5) Medicare wages and tips', employer.medicareWages)}
        {renderStaticRow('medicaretax', '(6) Medicare tax withheld', employer.medicareTax)}
        {renderStaticRow('sstips', '(7) Social security tips', employer.ssTips)}
        {renderStaticRow('allocatedtips', '(8) Allocated tips', employer.allocatedTips)}
        {renderStaticRow('dependentcare', '(10) Dependent care benefits', employer.dependentCare)}
        {renderStaticRow('nonqualified', '(11) Nonqualified plans', employer.nonqualified)}
        {'box12Entries' in employer && employer.box12Entries ? (
          <>
            {/* Box 12 column headers */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '4px 20px 2px', borderBottom: '1px solid #e8edf0', gap: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, width: 32, flexShrink: 0 }}>
                {flaggedFields['box12'] && !box12Resolved && <span className={styles.issueIndicator} />}
              </span>
              <span style={{ fontFamily: 'var(--font-family-component)', fontSize: 13, fontWeight: 500, color: '#21262a', flex: '0 0 auto' }}>(12) Box 12 — Codes</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--font-family-component)', fontSize: 11, fontWeight: 500, color: '#859299', width: 64, flexShrink: 0, textAlign: 'center' }}>Code</span>
              <span style={{ fontFamily: 'var(--font-family-component)', fontSize: 11, fontWeight: 500, color: '#859299', width: 120, flexShrink: 0 }}>Amount</span>
            </div>
            {(employer.box12Entries as { sub: string; code: string; amount: string }[]).map((entry, i) => {
              const isLast = i === (employer.box12Entries as unknown[]).length - 1
              const sub = entry.sub as Box12Sub
              const codeKey = `box12${entry.sub}-code-${activeSubTab}`
              const amtKey = `box12${entry.sub}-amt-${activeSubTab}`
              const rowKey = `box12${entry.sub}-${activeSubTab}`
              const isFlagged = !!(flaggedFields['box12'] && !box12Resolved)
              const isEditingAmt = editingField === amtKey
              const isRowReviewed = reviewedFields?.has(rowKey)
              const syncedRow = box12Rows?.[sub]
              const codeVal = syncedRow?.code ?? fieldOverrides[codeKey] ?? entry.code
              // Seed amount 0 must stay blank (codes shown, amounts missing) — only show once > 0
              const syncedAmt = syncedRow?.amount ?? 0
              const amtVal = syncedAmt > 0
                ? syncedAmt.toLocaleString()
                : (fieldOverrides[amtKey] ?? (entry.sub === 'a' && fieldValues?.box12 ? fieldValues.box12.toLocaleString() : entry.amount))
              const BOX12_CODES = ['', 'A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','V','W','AA','BB','DD','EE','FF','GG','HH']
              const commitAmt = () => {
                if (editingField !== amtKey) return
                if (draftValue !== originalValue) {
                  const num = parseFloat(draftValue.replace(/,/g, '')) || 0
                  if (onBox12RowChange) {
                    onBox12RowChange(sub, { amount: num, code: codeVal })
                  } else if (entry.sub === 'a') {
                    onFieldValueChange?.('box12', num)
                  }
                  onFieldOverride?.(amtKey, draftValue)
                  setLocalEdited(prev => new Set(prev).add(amtKey))
                  if (entry.sub === 'a') setLocalEdited(prev => new Set(prev).add('box12'))
                  setSavedField(amtKey)
                  setTimeout(() => setSavedField(null), 3500)
                  markBox12RowReviewed(rowKey)
                }
                setEditingField(null)
              }
              return (
                <div key={entry.sub}>
                  <div
                    ref={i === 0 ? box12Ref : undefined}
                    className={`${styles.fieldRow} ${isFlagged ? styles.fieldRowHasNote : ''} ${commentField === rowKey ? styles.fieldRowCommentOpen : ''}`}
                    style={isLast ? { borderBottom: 'none', cursor: 'pointer' } : { cursor: 'pointer' }}
                    onClick={() => onFieldSelect?.(rowKey)}
                  >
                    {/* Sub-label */}
                    <span style={{ color: '#859299', fontSize: 12, fontWeight: 500, width: 32, flexShrink: 0 }}>12{entry.sub}</span>
                    <span style={{ flex: 1 }} />
                    {/* Code dropdown */}
                    <select
                      value={codeVal}
                      onChange={e => {
                        const nextCode = e.target.value
                        if (onBox12RowChange) {
                          onBox12RowChange(sub, { code: nextCode })
                        }
                        onFieldOverride?.(codeKey, nextCode)
                        setLocalEdited(prev => new Set(prev).add(codeKey))
                      }}
                      style={{ width: 64, fontSize: 13, height: 32, padding: '0 4px', boxSizing: 'border-box', border: `1px solid ${isFlagged ? '#ff6a00' : '#c3ced5'}`, borderRadius: 4, background: isFlagged ? 'rgba(255,187,0,0.25)' : '#fff', color: codeVal ? '#21262a' : '#859299', fontFamily: 'var(--font-family-component)', outline: 'none', flexShrink: 0, cursor: 'pointer', appearance: 'auto' }}
                    >
                      {BOX12_CODES.map(c => <option key={c} value={c}>{c || '—'}</option>)}
                    </select>
                    {/* Amount input */}
                    <input
                      readOnly={!isEditingAmt}
                      value={isEditingAmt ? draftValue : amtVal}
                      placeholder="—"
                      onChange={e => setDraftValue(e.target.value)}
                      autoFocus={isEditingAmt}
                      onBlur={commitAmt}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitAmt() }
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      style={{ width: 120, fontSize: 13, height: 32, padding: '5px 8px', boxSizing: 'border-box', border: `${isEditingAmt ? '2px' : '1px'} solid ${isEditingAmt ? '#205ea3' : isFlagged ? '#ff6a00' : '#c3ced5'}`, borderRadius: 4, background: isEditingAmt ? '#fff' : isFlagged ? 'rgba(255,187,0,0.25)' : '#fff', color: '#21262a', fontFamily: 'var(--font-family-component)', outline: 'none', flexShrink: 0, cursor: 'text' }}
                      onClick={e => { e.stopPropagation(); if (!isEditingAmt) { startEdit(amtKey, amtVal) } }}
                    />
                    {isEditingAmt ? (
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
                    ) : isRowReviewed ? (
                      <Tooltip text="Click to unmark" placement="top">
                        <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); markBox12RowReviewed(rowKey) }}><CircleCheck size="small" /></button>
                      </Tooltip>
                    ) : (
                      <div className={styles.fieldActions}>
                        <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); markBox12RowReviewed(rowKey) }}><CircleCheck size="small" /></button></Tooltip>
                        {renderCommentBtn(rowKey, `(12${entry.sub}) Box 12 code`, employer.name)}
                      </div>
                    )}
                    {savedField === amtKey && <span className={styles.recalcBadge}>Saved</span>}
                    {isEdited(amtKey) && savedField !== amtKey && <span className={styles.editedBadge}>Edited</span>}
                  </div>
                  {isLast && <ValidationNote fieldKey="box12" />}
                </div>
              )
            })}
          </>
        ) : (
          <>
            <div
              ref={box12Ref}
              className={`${styles.fieldRow} ${selectedField === 'box12' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''} ${commentField === `box12-${activeSubTab}` ? styles.fieldRowCommentOpen : ''}`}
              onClick={() => onFieldSelect?.('box12')}
              style={{ cursor: 'pointer' }}
            >
              <FlaggedLabel fieldKey="box12">(12) Code {employer.box12Code || '—'} — 401(k) deferral</FlaggedLabel>
              <input
                className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'box12' ? styles.fieldInputEditing : selectedField === 'box12' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
                readOnly={editingField !== 'box12'}
                value={editingField === 'box12' ? draftValue : (fieldValues?.box12 !== undefined && employer.box12Amount ? fieldValues.box12.toLocaleString() : (employer.box12Amount || '—'))}
                onChange={e => setDraftValue(e.target.value)}
                autoFocus={editingField === 'box12'}
                onClick={e => { e.stopPropagation(); if (editingField !== 'box12') startEdit('box12', fieldValues?.box12?.toString() ?? employer.box12Amount ?? '') }}
                onBlur={() => commitEdit('box12')}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('box12') } if (e.key === 'Escape') cancelEdit() }}
              />
              {editingField === 'box12' ? (
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
              ) : reviewedFields?.has('box12') ? (
                <span className={styles.reviewedBadge}><CircleCheck size="small" /></span>
              ) : (
                <div className={styles.fieldActions}>
                  <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('box12') }}><CircleCheck size="small" /></button></Tooltip>
                  {renderCommentBtn(`box12-${activeSubTab}`, `(12) Code ${employer.box12Code || '—'} — 401(k) deferral`, employer.name)}
                </div>
              )}
              {savedField === 'box12' && <span className={styles.recalcBadge}>Saved</span>}
              {isEdited('box12') && savedField !== 'box12' && <span className={styles.editedBadge}>Edited</span>}
            </div>
            <ValidationNote fieldKey="box12" />
          </>
        )}

        {/* Box 13 — Statutory employee / Retirement plan / Third-party sick pay */}
        <div
          className={`${styles.fieldRow} ${selectedField === 'box13' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
          onClick={() => onFieldSelect?.('box13')}
          style={{ cursor: 'pointer', flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingTop: 10, paddingBottom: 10 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DestinationFieldLabel fieldKey="box13" className={styles.fieldLabel}>
              (13) Box 13
            </DestinationFieldLabel>
            {flaggedFields['box13'] && !reviewedFields?.has('box13') && (
              <span className={styles.issueIndicator} />
            )}
            <span style={{ flex: 1 }} />
            {flaggedFields['box13'] && (
              reviewedFields?.has('box13') ? (
                <span className={styles.reviewedBadge}><CircleCheck size="small" /></span>
              ) : (
                <div className={styles.fieldActions}>
                  <Tooltip text="Mark as correct" placement="top">
                    <button
                      className={styles.markCorrectBtn}
                      onClick={e => { e.stopPropagation(); onMarkReviewed?.('box13') }}
                    >
                      <CircleCheck size="small" />
                    </button>
                  </Tooltip>
                </div>
              )
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, paddingLeft: 8 }}>
            {(
              [
                { key: 'statutoryEmployee' as const, label: 'Statutory employee' },
                { key: 'retirementPlan' as const, label: 'Retirement plan' },
                { key: 'thirdPartySickPay' as const, label: 'Third-party sick pay' },
              ] as const
            ).map(opt => {
              const checked = !!box13?.[opt.key]
              return (
                <label
                  key={opt.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'var(--font-family-component)',
                    fontSize: 13,
                    color: '#21262a',
                    cursor: 'pointer',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e => {
                      onBox13Change?.({ [opt.key]: e.target.checked })
                      setLocalEdited(prev => new Set(prev).add('box13'))
                      setSavedField('box13')
                      setTimeout(() => setSavedField(null), 3500)
                    }}
                  />
                  {opt.label}
                </label>
              )
            })}
          </div>
          {savedField === 'box13' && <span className={styles.recalcBadge}>Saved</span>}
          {flaggedFields['box13'] && !reviewedFields?.has('box13') && (
            <ValidationNote fieldKey="box13" />
          )}
        </div>
      </div>
    </div>
  )
}
