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

export type DivPayer = 'tokenFinancial' | 'northmarkIndex' | 'beaconDividend'

export const DIV_PAYER_TABS: { key: DivPayer; label: string }[] = [
  { key: 'tokenFinancial', label: 'Token Financial' },
  { key: 'northmarkIndex', label: 'Northmark Index Funds' },
  { key: 'beaconDividend', label: 'Beacon Dividend Trust' },
]

/** Verified-docs key used by Mark as verified — keep PeelTab / ReviewTab in sync */
export function divVerifiedDocKey(payer: DivPayer): string {
  return `1099-div-${payer}`
}

// 1099-DIV payers — Jessica Drake TY 2025
const PAYER_DATA: Record<DivPayer, { ein: string; name: string; street: string; city: string; state: string; zip: string; payerPhone: string }> = {
  tokenFinancial: {
    ein: '26-7488943',
    name: 'Token Financial',
    street: '198 Maker Street',
    city: 'Chicago',
    state: 'IL',
    zip: '60606',
    payerPhone: '',
  },
  northmarkIndex: {
    ein: '26-7788990',
    name: 'Northmark Index Funds',
    street: '200 Market Street',
    city: 'Chicago',
    state: 'IL',
    zip: '60606',
    payerPhone: '',
  },
  beaconDividend: {
    ein: '33-2211445',
    name: 'Beacon Dividend Trust',
    street: '55 Beacon Way',
    city: 'Boston',
    state: 'MA',
    zip: '02108',
    payerPhone: '',
  },
}

const RECIPIENT_DATA = {
  ssn: 'XXX-XX-4321',
  ...CLIENT_ADDRESS,
}

// Form 1099-DIV boxes per payer — Jessica Drake TY 2025
const FORM_DATA: Record<DivPayer, {
  box1a_totalOrdinary: string; box1b_qualifiedDivs: string; box2a_totalCapGain: string;
  box2b_unrecap1250: string; box2c_sec1202: string; box2d_collectibles: string;
  box3_nonDivDistrib: string; box4_fedTaxWithheld: string; box5_sec199A: string;
  box6_investExpenses: string; box7_foreignTaxPaid: string; box8_foreignCountry: string;
  box9_cashLiquidation: string; box10_nonCashLiquidation: string;
}> = {
  tokenFinancial: {
    box1a_totalOrdinary:      '331,250', // Box 1a — Total ordinary dividends
    box1b_qualifiedDivs:      '331,250', // Box 1b — Return value (source $187,500; silent error 6)
    box2a_totalCapGain:       '',       // Box 2a — Total capital gain distr.
    box2b_unrecap1250:        '',       // Box 2b — Unrecap. Sec. 1250 gain
    box2c_sec1202:            '',       // Box 2c — Section 1202 gain
    box2d_collectibles:       '',       // Box 2d — Collectibles (28%) gain
    box3_nonDivDistrib:       '',       // Box 3 — Nondividend distributions
    box4_fedTaxWithheld:      '24,925', // Box 4 — Return value (source $26,363)
    box5_sec199A:             '',       // Box 5 — Section 199A dividends
    box6_investExpenses:      '1,200',  // Box 6 — Investment expenses
    box7_foreignTaxPaid:      '',       // Box 7 — Foreign tax paid
    box8_foreignCountry:      '',       // Box 8 — Foreign country or U.S. possession
    box9_cashLiquidation:     '',       // Box 9 — Cash liquidation distributions
    box10_nonCashLiquidation: '',       // Box 10 — Noncash liquidation distributions
  },
  northmarkIndex: {
    box1a_totalOrdinary:      '12,400',
    box1b_qualifiedDivs:      '8,000',
    box2a_totalCapGain:       '',
    box2b_unrecap1250:        '',
    box2c_sec1202:            '',
    box2d_collectibles:       '',
    box3_nonDivDistrib:       '',
    box4_fedTaxWithheld:      '',
    box5_sec199A:             '',
    box6_investExpenses:      '',
    box7_foreignTaxPaid:      '',
    box8_foreignCountry:      '',
    box9_cashLiquidation:     '',
    box10_nonCashLiquidation: '',
  },
  beaconDividend: {
    box1a_totalOrdinary:      '6,750',
    box1b_qualifiedDivs:      '4,200',
    box2a_totalCapGain:       '',
    box2b_unrecap1250:        '',
    box2c_sec1202:            '',
    box2d_collectibles:       '',
    box3_nonDivDistrib:       '',
    box4_fedTaxWithheld:      '',
    box5_sec199A:             '',
    box6_investExpenses:      '',
    box7_foreignTaxPaid:      '',
    box8_foreignCountry:      '',
    box9_cashLiquidation:     '',
    box10_nonCashLiquidation: '',
  },
}

interface DetailFieldsDivProps {
  activePayer: DivPayer
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number; divWithholding?: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
  amounts?: LiveAmounts
  onAmountChange?: (patch: Partial<LiveAmounts>, editedKey?: string) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  editedFields?: Set<string>
  verifiedDocs?: Set<string>
  onVerifyDoc?: (docKey: string) => void
  flaggedFields?: Record<string, string>
  onAddFieldNote?: (text: string, context: string) => void
}

export default function DetailFieldsDiv({
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
  verifiedDocs,
  onVerifyDoc,
  flaggedFields = {},
  onAddFieldNote,
}: DetailFieldsDivProps) {

  const highlightedRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [localEdited, setLocalEdited] = useState<Set<string>>(new Set())
  // Local overrides for fields edited by the preparer (payer/recipient info, boxes not
  // imported, etc.) — amount fields that feed the 1040 also call onAmountChange
  const [staticValues, setStaticValues] = useState<Record<string, string>>({})
  const isEdited = (key: string) => syncedEditedFields?.has(key) || localEdited.has(key)
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

  const commitEdit = (field: 'qualifiedDivs') => {
    const num = parseFloat(draftValue.replace(/,/g, '')) || 0
    onFieldValueChange?.(field, num)
    onAmountChange?.({ qualifiedDivsToken: num }, 'qualifiedDivs')
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
    const context = `1099-DIV · ${label}`
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

  const ValidationNote = ({ fieldKey, reviewedKey }: { fieldKey: string; reviewedKey?: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) return null
    const resolved = reviewedFields?.has(reviewedKey ?? fieldKey)
    return (
      <div className={styles.validationNote} style={resolved ? { color: '#1a6b35' } : {}}>
        {resolved ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.5" fill="#1a6b35"/><path d="M3.5 6l1.8 1.8 3.2-3.6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="6" cy="6" r="5.5" fill="#c9500f"/><path d="M6 3.5V6.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/><circle cx="6" cy="8.5" r="0.6" fill="white"/></svg>
        )}
        <span style={resolved ? { textDecoration: 'line-through', opacity: 0.7 } : {}}>{issue}</span>
      </div>
    )
  }

  // Editable row with hover-revealed Edit + Mark as correct + Comment — same pattern as
  // the W-2 panel's renderStaticRow. Flagged rows (e.g. collectibles, nondividend — "not
  // imported") also get a validation note; editing such a row lets the preparer fill in
  // the real value from the source document instead of just dismissing the flag.
  const renderReadOnlyRow = (
    fieldKey: string,
    label: string,
    defaultValue: string,
    opts: { inputClass?: string; placeholder?: string; fieldKeyOverride?: string; reviewedKeyOverride?: string } = {},
  ) => {
    const { inputClass = styles.fieldInputSmall, placeholder = '—', fieldKeyOverride, reviewedKeyOverride } = opts
    const flagKey = fieldKeyOverride ?? fieldKey
    const reviewedKey = reviewedKeyOverride ?? fieldKey
    const syncedAmountDisplay = (() => {
      if (!amounts) return null
      if (fieldKey === 'fedTaxWithheld') return amounts.divWithholding.toLocaleString()
      if (fieldKey.startsWith('ordinaryDivs-')) {
        if (activePayer === 'tokenFinancial') return amounts.ordinaryDivsToken.toLocaleString()
        if (activePayer === 'northmarkIndex') return amounts.ordinaryDivsNorthmark.toLocaleString()
        if (activePayer === 'beaconDividend') return amounts.ordinaryDivsBeacon.toLocaleString()
      }
      if (fieldKey.startsWith('qualifiedDivs-')) {
        if (activePayer === 'northmarkIndex') return amounts.qualifiedDivsNorthmark.toLocaleString()
        if (activePayer === 'beaconDividend') return amounts.qualifiedDivsBeacon.toLocaleString()
      }
      return null
    })()
    const currentVal = syncedAmountDisplay ?? staticValues[fieldKey] ?? defaultValue
    const isEditing = editingField === fieldKey
    const isFlagged = !!flaggedFields[flagKey] && !reviewedFields?.has(reviewedKey)
    const isReviewed = reviewedFields?.has(reviewedKey)
    const isCommentOpen = commentField === fieldKey
    const selectKey = flagKey === 'ordinaryDivs' ? 'ordinaryDivs' : fieldKey
    const isSelected = selectedField === selectKey || selectedField === fieldKey || selectedField === flagKey
    const flowsTo1040 =
      fieldKey === 'fedTaxWithheld' ||
      fieldKey.startsWith('ordinaryDivs-') ||
      fieldKey.startsWith('qualifiedDivs-')
    const commitStatic = () => {
      setStaticValues(prev => ({ ...prev, [fieldKey]: draftValue }))
      setEditingField(null)
      setLocalEdited(prev => new Set(prev).add(fieldKey))
      setSavedField(fieldKey)
      setTimeout(() => setSavedField(null), 3500)
      const num = parseAmountDraft(draftValue)
      if (fieldKey === 'fedTaxWithheld') {
        onAmountChange?.({ divWithholding: num }, 'fedTaxWithheld')
      } else if (fieldKey === 'ordinaryDivs-northmarkIndex' || (flagKey === 'ordinaryDivs' && activePayer === 'northmarkIndex')) {
        onAmountChange?.({ ordinaryDivsNorthmark: num }, 'ordinaryDivs-northmark')
      } else if (fieldKey.startsWith('ordinaryDivs-')) {
        if (activePayer === 'tokenFinancial') onAmountChange?.({ ordinaryDivsToken: num }, fieldKey)
        else if (activePayer === 'beaconDividend') onAmountChange?.({ ordinaryDivsBeacon: num }, fieldKey)
      } else if (fieldKey.startsWith('qualifiedDivs-')) {
        if (activePayer === 'northmarkIndex') onAmountChange?.({ qualifiedDivsNorthmark: num }, fieldKey)
        else if (activePayer === 'beaconDividend') onAmountChange?.({ qualifiedDivsBeacon: num }, fieldKey)
      }
      if (draftValue.trim()) onMarkReviewed?.(reviewedKey)
    }
    return (
      <>
        <div
          ref={isSelected ? highlightedRef : undefined}
          className={`${styles.fieldRow} ${isFlagged ? styles.fieldRowHasNote : ''} ${isCommentOpen ? styles.fieldRowCommentOpen : ''} ${isSelected ? (highlightMode === 'orange' && isFlagged ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
          onClick={() => onFieldSelect?.(selectKey)}
          style={{ cursor: 'pointer' }}
        >
          <span className={`${styles.fieldLabel} ${isFlagged ? styles.fieldLabelFlagged : ''}`}>
            {isFlagged && <span className={styles.issueIndicator} />}
            {label}
          </span>
          <input
            className={`${styles.fieldInput} ${inputClass} ${isEditing ? styles.fieldInputEditing : isFlagged ? styles.fieldInputHighlightedOrange : isSelected ? styles.fieldInputHighlighted : ''}`}
            readOnly={!isEditing}
            value={isEditing ? draftValue : currentVal}
            onChange={e => setDraftValue(e.target.value)}
            placeholder={!isEditing && flaggedFields[fieldKey] ? 'Not imported' : placeholder}
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
            <Tooltip text="Click to unmark" placement="top">
              <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(reviewedKey) }}><CircleCheck size="small" /></button>
            </Tooltip>
          ) : (
            <div className={styles.fieldActions}>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(reviewedKey) }}><CircleCheck size="small" /></button></Tooltip>
              {renderCommentBtn(fieldKey, label)}
            </div>
          )}
          {savedField === fieldKey && <span className={styles.recalcBadge}>{flowsTo1040 ? '1040 updated' : 'Saved'}</span>}
          {isEdited(fieldKey) && savedField !== fieldKey && <span className={styles.editedBadge}>Edited</span>}
        </div>
        <ValidationNote fieldKey={flagKey} reviewedKey={reviewedKey} />
      </>
    )
  }

  const payer = PAYER_DATA[activePayer]
  const form = FORM_DATA[activePayer]
  const docKey = divVerifiedDocKey(activePayer)
  const divVerified = verifiedDocs?.has(docKey)
  const isPrimary = activePayer === 'tokenFinancial'

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerActions}>
          <h2 style={{ fontFamily: 'var(--font-family-component)', fontSize: 18, fontWeight: 500, color: '#21262a', margin: 0, flex: 1, textAlign: 'left' }}>Details: Dividend Income (1099-DIV)</h2>
          {divVerified ? (
            <button className={styles.verifiedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, gap: 4, display: 'flex', alignItems: 'center' }} onClick={() => onVerifyDoc?.(docKey)}><CheckIcon /> Verified</button>
          ) : (
            <button className={styles.markVerifiedBtn} onClick={() => {
              onVerifyDoc?.(docKey)
              const p = activePayer
              const docFieldKeys = [
                `payerEin-${p}`, `payerName-${p}`, `payerStreet-${p}`, `payerCityStateZip-${p}`, `payerPhone-${p}`,
                `recipientSsn-${p}`, `recipientName-${p}`, `recipientStreet-${p}`, `recipientCityStateZip-${p}`,
                `ordinaryDivs-${p}`,
                // Phase 1 flag key (reviewedKeyOverride) — not the same as ordinaryDivs-northmarkIndex
                ...(p === 'northmarkIndex' ? ['ordinaryDivs-northmark'] : []),
                ...(isPrimary ? ['qualifiedDivs', 'divCollectibles', 'divNonDiv', 'fedTaxWithheld'] : [`qualifiedDivs-${p}`, `divCollectibles-${p}`, `divNonDiv-${p}`, `fedTaxWithheld-${p}`]),
                `totalCapGain-${p}`, `unrecap1250-${p}`, `sec1202-${p}`, `sec199A-${p}`, `investExpenses-${p}`,
                `foreignTaxPaid-${p}`, `foreignCountry-${p}`, `cashLiquidation-${p}`, `nonCashLiquidation-${p}`,
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
        {renderReadOnlyRow(`payerName-${activePayer}`, "(b) Payer's name", payer.name, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow(`payerStreet-${activePayer}`, 'Street address', payer.street, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow(`payerCityStateZip-${activePayer}`, 'City / State / ZIP code', `${payer.city}, ${payer.state} ${payer.zip}`, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow(`payerPhone-${activePayer}`, "Payer's telephone number", payer.payerPhone)}

        {/* ── Recipient Information ── */}
        <div className={styles.sectionHeader}>Recipient Information</div>

        {renderReadOnlyRow(`recipientSsn-${activePayer}`, 'SS # on account', RECIPIENT_DATA.ssn)}
        {renderReadOnlyRow(`recipientName-${activePayer}`, "Recipient's name", RECIPIENT_DATA.name, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow(`recipientStreet-${activePayer}`, 'Street address', RECIPIENT_DATA.street, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow(`recipientCityStateZip-${activePayer}`, 'City / State / ZIP code', `${RECIPIENT_DATA.city}, ${RECIPIENT_DATA.state} ${RECIPIENT_DATA.zip}`, { inputClass: styles.fieldInputWide })}

        {/* ── Dividend Income ── */}
        <div className={styles.sectionHeader}>Dividend Income</div>

        {renderReadOnlyRow(`ordinaryDivs-${activePayer}`, '(1a) Total ordinary dividends', form.box1a_totalOrdinary, {
          fieldKeyOverride: activePayer === 'northmarkIndex' ? 'ordinaryDivs' : undefined,
          reviewedKeyOverride: activePayer === 'northmarkIndex' ? 'ordinaryDivs-northmark' : undefined,
        })}

        {isPrimary ? (
          <>
            <div
              ref={selectedField === 'qualifiedDivs' ? highlightedRef : undefined}
              className={`${styles.fieldRow} ${flaggedFields['qualifiedDivs'] && !reviewedFields?.has('qualifiedDivs') ? styles.fieldRowHasNote : ''} ${selectedField === 'qualifiedDivs' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''} ${commentField === 'qualifiedDivs' ? styles.fieldRowCommentOpen : ''}`}
              onClick={() => onFieldSelect?.('qualifiedDivs')}
              style={{ cursor: 'pointer' }}
            >
              <span className={`${styles.fieldLabel} ${flaggedFields['qualifiedDivs'] && !reviewedFields?.has('qualifiedDivs') ? styles.fieldLabelFlagged : ''}`}>
                {flaggedFields['qualifiedDivs'] && !reviewedFields?.has('qualifiedDivs') && <span className={styles.issueIndicator} />}
                (1b) Qualified dividends
              </span>
              <input
                className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'qualifiedDivs' ? styles.fieldInputEditing : flaggedFields['qualifiedDivs'] && !reviewedFields?.has('qualifiedDivs') ? styles.fieldInputHighlightedOrange : selectedField === 'qualifiedDivs' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
                readOnly={editingField !== 'qualifiedDivs'}
                value={editingField === 'qualifiedDivs' ? draftValue : (fieldValues?.qualifiedDivs !== undefined ? fieldValues.qualifiedDivs.toLocaleString() : form.box1b_qualifiedDivs)}
                onChange={e => setDraftValue(e.target.value)}
                autoFocus={editingField === 'qualifiedDivs'}
                onClick={e => { e.stopPropagation(); if (editingField !== 'qualifiedDivs') startEdit('qualifiedDivs', fieldValues?.qualifiedDivs?.toString() ?? form.box1b_qualifiedDivs) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('qualifiedDivs') } if (e.key === 'Escape') cancelEdit() }}
              />
              {editingField === 'qualifiedDivs' ? (
                <div className={styles.editActions}>
                  <button className={styles.saveBtn} onClick={() => commitEdit('qualifiedDivs')}>Save</button>
                  <button className={styles.undoBtn} onClick={cancelEdit}>Undo</button>
                </div>
              ) : reviewedFields?.has('qualifiedDivs') ? (
                <Tooltip text="Click to unmark" placement="top">
                  <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.('qualifiedDivs') }}><CircleCheck size="small" /></button>
                </Tooltip>
              ) : (
                <div className={styles.fieldActions}>
                  <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('qualifiedDivs') }}><CircleCheck size="small" /></button></Tooltip>
                  {renderCommentBtn('qualifiedDivs', '(1b) Qualified dividends')}
                </div>
              )}
              {savedField === 'qualifiedDivs' && <span className={styles.recalcBadge}>1040 updated</span>}
              {isEdited('qualifiedDivs') && savedField !== 'qualifiedDivs' && <span className={styles.editedBadge}>Edited</span>}
            </div>
            <ValidationNote fieldKey="qualifiedDivs" />
          </>
        ) : (
          renderReadOnlyRow(`qualifiedDivs-${activePayer}`, '(1b) Qualified dividends', form.box1b_qualifiedDivs)
        )}

        {renderReadOnlyRow(`totalCapGain-${activePayer}`, '(2a) Total capital gain distributions', form.box2a_totalCapGain)}
        {renderReadOnlyRow(`unrecap1250-${activePayer}`, '(2b) Unrecaptured Sec. 1250 gain', form.box2b_unrecap1250)}
        {renderReadOnlyRow(`sec1202-${activePayer}`, '(2c) Section 1202 gain', form.box2c_sec1202)}
        {isPrimary
          ? renderReadOnlyRow('divCollectibles', '(2d) Collectibles (28%) gain', form.box2d_collectibles)
          : renderReadOnlyRow(`divCollectibles-${activePayer}`, '(2d) Collectibles (28%) gain', form.box2d_collectibles)}
        {isPrimary
          ? renderReadOnlyRow('divNonDiv', '(3) Nondividend distributions', form.box3_nonDivDistrib)
          : renderReadOnlyRow(`divNonDiv-${activePayer}`, '(3) Nondividend distributions', form.box3_nonDivDistrib)}
        {isPrimary
          ? renderReadOnlyRow('fedTaxWithheld', '(4) Federal income tax withheld', form.box4_fedTaxWithheld)
          : renderReadOnlyRow(`fedTaxWithheld-${activePayer}`, '(4) Federal income tax withheld', form.box4_fedTaxWithheld)}
        {renderReadOnlyRow(`sec199A-${activePayer}`, '(5) Section 199A dividends', form.box5_sec199A)}
        {renderReadOnlyRow(`investExpenses-${activePayer}`, '(6) Investment expenses', form.box6_investExpenses)}
        {renderReadOnlyRow(`foreignTaxPaid-${activePayer}`, '(7) Foreign tax paid', form.box7_foreignTaxPaid)}
        {renderReadOnlyRow(`foreignCountry-${activePayer}`, '(8) Foreign country or U.S. possession', form.box8_foreignCountry, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow(`cashLiquidation-${activePayer}`, '(9) Cash liquidation distributions', form.box9_cashLiquidation)}
        {renderReadOnlyRow(`nonCashLiquidation-${activePayer}`, '(10) Noncash liquidation distributions', form.box10_nonCashLiquidation)}

      </div>
    </div>
  )
}
