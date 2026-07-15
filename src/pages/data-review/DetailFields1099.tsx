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

export type IntPayer = 'unwaverIngFinancial' | 'harborlineCredit' | 'cascadeFederal'

export const INT_PAYER_TABS: { key: IntPayer; label: string }[] = [
  { key: 'unwaverIngFinancial', label: 'Unwavering Financial' },
  { key: 'harborlineCredit',    label: 'Harborline Credit Union' },
  { key: 'cascadeFederal',      label: 'Cascade Federal Savings' },
]

/** Verified-docs key used by Mark as verified — keep PeelTab / ReviewTab in sync */
export function intVerifiedDocKey(payer: IntPayer): string {
  return `1099-int-${payer}`
}

// 1099-INT payers — Jessica Drake TY 2025
const PAYER_DATA: Record<IntPayer, { ein: string; name: string; street: string; city: string; state: string; zip: string; payerPhone: string }> = {
  unwaverIngFinancial: {
    ein: '47-8821034',
    name: 'Unwavering Financial LLC',
    street: '800 Capital Way, Suite 1100',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    payerPhone: '(720) 555-0188',
  },
  harborlineCredit: {
    ein: '88-1122334',
    name: 'Harborline Credit Union',
    street: '100 Bank Plaza',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    payerPhone: '',
  },
  cascadeFederal: {
    ein: '91-4455667',
    name: 'Cascade Federal Savings',
    street: '88 Riverside Ave',
    city: 'Portland',
    state: 'OR',
    zip: '97204',
    payerPhone: '',
  },
}

const RECIPIENT_DATA = {
  ssn: 'XXX-XX-4321',
  ...CLIENT_ADDRESS,
}

// Form 1099-INT boxes per payer — Jessica Drake values
const FORM_DATA: Record<IntPayer, {
  box1_interest: string; box2_earlyPenalty: string; box3_usBonds: string;
  box4_fedTaxWithheld: string; box5_investExpenses: string; box6_foreignTax: string;
  box7_foreignCountry: string; box8_taxExempt: string; box9_specPrivActivity: string;
  box10_marketDiscount: string; box11_bondPremium: string; box13_stateTaxId: string;
  box14_stateTax: string; box15_stateIncome: string;
}> = {
  unwaverIngFinancial: {
    box1_interest:        '1,986',   // Box 1 — Interest income
    box2_earlyPenalty:    '',        // Box 2 — Early withdrawal penalty
    box3_usBonds:         '',        // Box 3 — Dropped on return (source has $1,500)
    box4_fedTaxWithheld:  '',        // Box 4 — Federal income tax withheld
    box5_investExpenses:  '',        // Box 5 — Investment expenses
    box6_foreignTax:      '',        // Box 6 — Foreign tax paid
    box7_foreignCountry:  '',        // Box 7 — Foreign country or U.S. possession
    box8_taxExempt:       '180',     // Box 8 — Tax-exempt interest
    box9_specPrivActivity:'',        // Box 9 — Specified private activity bond interest
    box10_marketDiscount: '',        // Box 10 — Market discount
    box11_bondPremium:    '',        // Box 11 — Bond premium
    box13_stateTaxId:     'CO-47882103',
    box14_stateTax:       '',
    box15_stateIncome:    '1,986',
  },
  harborlineCredit: {
    box1_interest:        '3,200',
    box2_earlyPenalty:    '',
    box3_usBonds:         '',
    box4_fedTaxWithheld:  '',
    box5_investExpenses:  '',
    box6_foreignTax:      '',
    box7_foreignCountry:  '',
    box8_taxExempt:       '',
    box9_specPrivActivity:'',
    box10_marketDiscount: '',
    box11_bondPremium:    '',
    box13_stateTaxId:     '',
    box14_stateTax:       '',
    box15_stateIncome:    '',
  },
  cascadeFederal: {
    box1_interest:        '1,150',
    box2_earlyPenalty:    '',
    box3_usBonds:         '',
    box4_fedTaxWithheld:  '',
    box5_investExpenses:  '',
    box6_foreignTax:      '',
    box7_foreignCountry:  '',
    box8_taxExempt:       '',
    box9_specPrivActivity:'',
    box10_marketDiscount: '',
    box11_bondPremium:    '',
    box13_stateTaxId:     '',
    box14_stateTax:       '',
    box15_stateIncome:    '',
  },
}

interface DetailFields1099Props {
  activePayer: IntPayer
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
  amounts?: LiveAmounts
  onAmountChange?: (patch: Partial<LiveAmounts>, editedKey?: string) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  editedFields?: Set<string>
  editedFieldsMeta?: Map<string, { by: string; at: string }>
  verifiedDocs?: Set<string>
  verifiedDocsMeta?: Map<string, { by: string; at: string }>
  onVerifyDoc?: (docKey: string) => void
  flaggedFields?: Record<string, string>
  onAddFieldNote?: (text: string, context: string) => void
}

export default function DetailFields1099({
  activePayer,
  selectedField,
  highlightMode = 'blue',
  onFieldSelect,
  fieldValues,
  onFieldValueChange,
  amounts,
  onAmountChange,
  onMarkReviewed,
  onMarkReviewedBulk,
  reviewedFields,
  editedFields: syncedEditedFields,
  editedFieldsMeta,
  verifiedDocs,
  verifiedDocsMeta,
  onVerifyDoc,
  flaggedFields = {},
  onAddFieldNote,
}: DetailFields1099Props) {
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [localEdited, setLocalEdited] = useState<Set<string>>(new Set())
  // Local overrides for fields edited by the preparer (payer/recipient info, boxes 2-15) —
  // per-payer Box 1 interest also updates live amounts for 1040 recalculation
  const [staticValues, setStaticValues] = useState<Record<string, string>>({})
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
    if (selectedField && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedField])

  const startEdit = (field: string, currentValue: string) => {
    const clean = currentValue.replace(/,/g, '')
    setEditingField(field)
    setDraftValue(clean)
  }

  const commitEdit = (field: 'taxableInterest') => {
    const num = parseFloat(draftValue.replace(/,/g, '')) || 0
    onFieldValueChange?.(field, num)
    onAmountChange?.({ interestUnwavering: num }, 'taxableInterest')
    setEditingField(null)
    setLocalEdited(prev => new Set(prev).add(field))
    setSavedField(field)
    setTimeout(() => setSavedField(null), 3500)
    onMarkReviewed?.(field)
  }

  const cancelEdit = () => { setEditingField(null); setDraftValue('') }

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

  const renderCommentBtn = (fieldKey: string, label: string) => {
    const context = `1099-INT · ${label}`
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

  const ValidationNote = ({ fieldKey }: { fieldKey: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) return null
    const isReviewed = reviewedFields?.has(fieldKey)
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

  // Editable row with hover-revealed Edit + Mark as correct + Comment — same pattern as
  // the W-2 panel's renderStaticRow. Per-payer Box 1 interest also updates live amounts.
  const renderReadOnlyRow = (fieldKey: string, label: string, defaultValue: string, inputClass = styles.fieldInputSmall, placeholder?: string) => {
    const syncedInterest =
      amounts && fieldKey.startsWith('taxableInterest-')
        ? activePayer === 'harborlineCredit'
          ? amounts.interestHarborline.toLocaleString()
          : activePayer === 'cascadeFederal'
            ? amounts.interestCascade.toLocaleString()
            : null
        : null
    const currentVal = syncedInterest ?? staticValues[fieldKey] ?? defaultValue
    const isEditing = editingField === fieldKey
    const isReviewed = reviewedFields?.has(fieldKey)
    const isCommentOpen = commentField === fieldKey
    const isSelected = selectedField === fieldKey
    const flowsTo1040 = fieldKey.startsWith('taxableInterest-') || fieldKey.startsWith('taxExempt-')
    const commitStatic = () => {
      setStaticValues(prev => ({ ...prev, [fieldKey]: draftValue }))
      setEditingField(null)
      setLocalEdited(prev => new Set(prev).add(fieldKey))
      setSavedField(fieldKey)
      setTimeout(() => setSavedField(null), 3500)
      const num = parseAmountDraft(draftValue)
      if (fieldKey.startsWith('taxableInterest-')) {
        if (activePayer === 'harborlineCredit') onAmountChange?.({ interestHarborline: num }, fieldKey)
        else if (activePayer === 'cascadeFederal') onAmountChange?.({ interestCascade: num }, fieldKey)
      }
      if (draftValue.trim()) onMarkReviewed?.(fieldKey)
    }
    return (
      <div
        ref={isSelected ? highlightedRef : undefined}
        className={`${styles.fieldRow} ${isCommentOpen ? styles.fieldRowCommentOpen : ''} ${isSelected ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
        onClick={() => onFieldSelect?.(fieldKey)}
        style={{ cursor: 'pointer' }}
      >
        <span className={styles.fieldLabel}>{label}</span>
        <input
          className={`${styles.fieldInput} ${inputClass} ${isEditing ? styles.fieldInputEditing : isSelected ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
          readOnly={!isEditing}
          value={isEditing ? draftValue : currentVal}
          onChange={e => setDraftValue(e.target.value)}
          placeholder={placeholder}
          autoFocus={isEditing}
          onClick={e => { e.stopPropagation(); if (!isEditing) startEdit(fieldKey, currentVal) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitStatic() } if (e.key === 'Escape') cancelEdit() }}
        />
        {isEditing ? (
          <div className={styles.editActions}>
            <button className={styles.saveBtn} onClick={commitStatic}>Save</button>
            <button className={styles.undoBtn} onClick={cancelEdit}>Undo</button>
          </div>
        ) : isReviewed ? (
          <Tooltip text={reviewedTip(fieldKey, true)} placement="top">
            <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button>
          </Tooltip>
        ) : (
          <div className={styles.fieldActions}>
            <Tooltip text={reviewedTip(fieldKey, false)} placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button></Tooltip>
            {renderCommentBtn(fieldKey, label)}
          </div>
        )}
        {savedField === fieldKey && <span className={styles.recalcBadge}>{flowsTo1040 ? '1040 updated' : 'Saved'}</span>}
        {isEdited(fieldKey) && savedField !== fieldKey && (
          <Tooltip text={editMetaText(fieldKey)} placement="top">
            <span className={styles.editedBadge}>Edited</span>
          </Tooltip>
        )}
      </div>
    )
  }

  const payer = PAYER_DATA[activePayer]
  const form = FORM_DATA[activePayer]
  const docKey = intVerifiedDocKey(activePayer)
  const intVerified = verifiedDocs?.has(docKey)
  const verifiedMeta = verifiedDocsMeta?.get(docKey)
  const verifiedTooltip = verifiedMeta
    ? `Verified · ${verifiedMeta.by} · ${verifiedMeta.at}`
    : 'Click to unmark verified'
  const isPrimary = activePayer === 'unwaverIngFinancial'

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <h2 style={{ fontFamily: 'var(--font-family-component)', fontSize: 18, fontWeight: 500, color: '#21262a', margin: 0, flex: 1, textAlign: 'left' }}>Details: Interest Income (1099-INT)</h2>
          {intVerified ? (
            <Tooltip text={verifiedTooltip} placement="top">
              <button className={styles.verifiedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => onVerifyDoc?.(docKey)}><CheckIcon /> Verified</button>
            </Tooltip>
          ) : (
            <button className={styles.markVerifiedBtn} onClick={() => {
              onVerifyDoc?.(docKey)
              const p = activePayer
              const docFieldKeys = [
                `payerEin-${p}`, `payerName-${p}`, `payerStreet-${p}`, `payerCityStateZip-${p}`, `payerPhone-${p}`,
                `recipientSsn-${p}`, `recipientName-${p}`, `recipientStreet-${p}`, `recipientCityStateZip-${p}`,
                ...(isPrimary ? ['taxableInterest'] : [`taxableInterest-${p}`]),
                `earlyPenalty-${p}`, `usBonds-${p}`, `fedTaxWithheld-${p}`, `investExpenses-${p}`,
                `foreignTax-${p}`, `foreignCountry-${p}`, `taxExempt-${p}`, `specPrivActivity-${p}`,
                `marketDiscount-${p}`, `bondPremium-${p}`, `stateTaxId-${p}`, `stateTax-${p}`, `stateIncome-${p}`,
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

        {renderReadOnlyRow(`payerEin-${activePayer}`, "(a) Payer's federal ID number (EIN)", payer.ein)}
        {renderReadOnlyRow(`payerName-${activePayer}`, "(b) Payer's name", payer.name, styles.fieldInputWide)}
        {renderReadOnlyRow(`payerStreet-${activePayer}`, 'Street address', payer.street, styles.fieldInputWide)}
        {renderReadOnlyRow(`payerCityStateZip-${activePayer}`, 'City / State / ZIP code', `${payer.city}, ${payer.state} ${payer.zip}`, styles.fieldInputWide)}
        {renderReadOnlyRow(`payerPhone-${activePayer}`, "Payer's telephone number", payer.payerPhone)}

        {/* ── Recipient Information ── */}
        <div className={styles.sectionHeader}>Recipient Information</div>

        {renderReadOnlyRow(`recipientSsn-${activePayer}`, "(c) Recipient's SSN or ITIN", RECIPIENT_DATA.ssn)}
        {renderReadOnlyRow(`recipientName-${activePayer}`, "(d) Recipient's name", RECIPIENT_DATA.name, styles.fieldInputWide)}
        {renderReadOnlyRow(`recipientStreet-${activePayer}`, 'Street address', RECIPIENT_DATA.street, styles.fieldInputWide)}
        {renderReadOnlyRow(`recipientCityStateZip-${activePayer}`, 'City / State / ZIP code', `${RECIPIENT_DATA.city}, ${RECIPIENT_DATA.state} ${RECIPIENT_DATA.zip}`, styles.fieldInputWide)}

        {/* ── Interest Income ── */}
        <div className={styles.sectionHeader}>Interest Income</div>

        {isPrimary ? (
          <>
            <div
              ref={selectedField === 'taxableInterest' ? highlightedRef : undefined}
              className={`${styles.fieldRow} ${flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldRowHasNote : ''} ${selectedField === 'taxableInterest' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''} ${commentField === 'taxableInterest' ? styles.fieldRowCommentOpen : ''}`}
              onClick={() => onFieldSelect?.('taxableInterest')}
              style={{ cursor: 'pointer' }}
            >
              <span className={`${styles.fieldLabel} ${flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldLabelFlagged : ''}`}>
                {flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') && <span className={styles.issueIndicator} />}
                (1) Interest income
              </span>
              <input
                className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'taxableInterest' ? styles.fieldInputEditing : flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldInputHighlightedOrange : selectedField === 'taxableInterest' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
                readOnly={editingField !== 'taxableInterest'}
                value={editingField === 'taxableInterest' ? draftValue : (fieldValues?.taxableInterest !== undefined ? fieldValues.taxableInterest.toLocaleString() : form.box1_interest)}
                onChange={e => setDraftValue(e.target.value)}
                autoFocus={editingField === 'taxableInterest'}
                onClick={e => { e.stopPropagation(); if (editingField !== 'taxableInterest') startEdit('taxableInterest', fieldValues?.taxableInterest?.toString() ?? form.box1_interest) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('taxableInterest') } if (e.key === 'Escape') cancelEdit() }}
              />
              {editingField === 'taxableInterest' ? (
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={() => commitEdit('taxableInterest')}>Save</button>
                  <button className={styles.undoBtn} onClick={cancelEdit}>Undo</button>
                </div>
              ) : reviewedFields?.has('taxableInterest') ? (
                <Tooltip text="Click to unmark" placement="top">
                  <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.('taxableInterest') }}><CircleCheck size="small" /></button>
                </Tooltip>
              ) : (
                <div className={styles.fieldActions}>
                  <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('taxableInterest') }}><CircleCheck size="small" /></button></Tooltip>
                  {renderCommentBtn('taxableInterest', '(1) Interest income')}
                </div>
              )}
              {savedField === 'taxableInterest' && <span className={styles.recalcBadge}>1040 updated</span>}
              {isEdited('taxableInterest') && savedField !== 'taxableInterest' && <span className={styles.editedBadge}>Edited</span>}
            </div>
            <ValidationNote fieldKey="taxableInterest" />
          </>
        ) : (
          renderReadOnlyRow(`taxableInterest-${activePayer}`, '(1) Interest income', form.box1_interest)
        )}
        {renderReadOnlyRow(`earlyPenalty-${activePayer}`, '(2) Early withdrawal penalty', form.box2_earlyPenalty)}
        {renderReadOnlyRow(`usBonds-${activePayer}`, '(3) Interest on U.S. Savings Bonds & T-bills', form.box3_usBonds)}
        {renderReadOnlyRow(`fedTaxWithheld-${activePayer}`, '(4) Federal income tax withheld', form.box4_fedTaxWithheld)}
        {renderReadOnlyRow(`investExpenses-${activePayer}`, '(5) Investment expenses', form.box5_investExpenses)}
        {renderReadOnlyRow(`foreignTax-${activePayer}`, '(6) Foreign tax paid', form.box6_foreignTax)}
        {renderReadOnlyRow(`foreignCountry-${activePayer}`, '(7) Foreign country or U.S. possession', form.box7_foreignCountry, styles.fieldInputWide, 'N/A')}
        {renderReadOnlyRow(`taxExempt-${activePayer}`, '(8) Tax-exempt interest', form.box8_taxExempt)}
        {renderReadOnlyRow(`specPrivActivity-${activePayer}`, '(9) Specified private activity bond interest', form.box9_specPrivActivity)}
        {renderReadOnlyRow(`marketDiscount-${activePayer}`, '(10) Market discount', form.box10_marketDiscount)}
        {renderReadOnlyRow(`bondPremium-${activePayer}`, '(11) Bond premium', form.box11_bondPremium)}

        {/* ── State Tax Information ── */}
        <div className={styles.sectionHeader}>State Tax Information</div>

        {renderReadOnlyRow(`stateTaxId-${activePayer}`, "(13) State / Payer's state ID number", form.box13_stateTaxId)}
        {renderReadOnlyRow(`stateTax-${activePayer}`, '(14) State income tax withheld', form.box14_stateTax)}
        {renderReadOnlyRow(`stateIncome-${activePayer}`, '(15) State income', form.box15_stateIncome)}

      </div>
    </div>
  )
}
