import { useEffect, useRef, useState } from 'react'
import { CircleCheck } from '@design-systems/icons'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/DetailFields.module.css'

// 1099-DIV — Unwavering Financial
const PAYER_DATA = {
  ein: '11-2418191',
  name: 'UNWAVERING FINANCIAL INC.',
  street: '388 Greenwich Street',
  city: 'New York',
  state: 'NY',
  zip: '10013',
  payerPhone: '818-993-1214',
}

const RECIPIENT_DATA = {
  ssn: 'XXX-XX-8209',
  name: 'Jessica Drake',
  street: '333 Easy Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94133-4263',
}

// Form 1099-DIV boxes — Jessica Drake / Unwavering Financial
const FORM_DATA = {
  box1a_totalOrdinary:     '331,250',  // Box 1a — Total ordinary dividends
  box1b_qualifiedDivs:     '187,500',  // Box 1b — Qualified dividends
  box2a_totalCapGain:      '',       // Box 2a — Total capital gain distr.
  box2b_unrecap1250:       '',       // Box 2b — Unrecap. Sec. 1250 gain
  box2c_sec1202:           '',       // Box 2c — Section 1202 gain
  box2d_collectibles:      '',       // Box 2d — Collectibles (28%) gain
  box3_nonDivDistrib:      '',       // Box 3 — Nondividend distributions
  box4_fedTaxWithheld:     '',       // Box 4 — Federal income tax withheld
  box5_investExpenses:     '',       // Box 5 — Investment expenses
  box6_foreignTaxPaid:     '',       // Box 6 — Foreign tax paid
  box7_foreignCountry:     '',       // Box 7 — Foreign country or U.S. possession
  box8_cashLiquidation:    '',       // Box 8 — Cash liquidation distributions
  box9_nonCashLiquidation: '',       // Box 9 — Noncash liquidation distributions
}

interface DetailFieldsDivProps {
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
  flaggedFields?: Record<string, string>
}

export default function DetailFieldsDiv({ selectedField, highlightMode = 'blue', onFieldSelect, fieldValues, onFieldValueChange, onMarkReviewed, onMarkReviewedBulk, reviewedFields, flaggedFields = {} }: DetailFieldsDivProps) {

  const ValidationNote = ({ fieldKey }: { fieldKey: string }) => {
    const issue = flaggedFields[fieldKey]
    if (!issue) return null
    const resolved = reviewedFields?.has(fieldKey)
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

  // ProtoC: resolve control for "not imported" flagged DIV fields (collectibles, nondividend).
  // Marking as correct confirms nothing needs to be entered from the source doc.
  // Matches the always-visible fieldActions pattern used in DetailFields.tsx (W-2) / DetailFields1099.tsx.
  const renderFlagActions = (fieldKey: string) => {
    if (!flaggedFields[fieldKey]) return null
    const resolved = reviewedFields?.has(fieldKey)
    if (resolved) {
      return (
        <Tooltip text="Click to unmark" placement="top">
          <button
            className={styles.reviewedBadge}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}
            onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}
          >
            <CircleCheck size="small" />
          </button>
        </Tooltip>
      )
    }
    return (
      <div className={styles.fieldActions}>
        <Tooltip text="Mark as correct" placement="top">
          <button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}>
            <CircleCheck size="small" />
          </button>
        </Tooltip>
      </div>
    )
  }

  const highlightedRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (selectedField && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedField])

  const [originalValue, setOriginalValue] = useState('')

  const startEdit = (field: string, currentValue: string) => {
    const clean = currentValue.replace(/,/g, '')
    setEditingField(field)
    setDraftValue(clean)
    setOriginalValue(clean)
  }

  const commitEdit = (field: 'qualifiedDivs') => {
    const num = parseFloat(draftValue.replace(/,/g, '')) || 0
    onFieldValueChange?.(field, num)
    setEditingField(null)
    setEditedFields(prev => new Set(prev).add(field))
    setSavedField(field)
    setTimeout(() => setSavedField(null), 3500)
  }

  const cancelEdit = () => { setEditingField(null); setDraftValue(''); setOriginalValue('') }

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Details: Dividend Income (1099-DIV) — Unwavering Financial</h2>
      </div>

      <div className={styles.inputContainer}>

        {/* ── Payer Information ── */}
        <div className={styles.sectionHeader}>
          Payer Information (MANDATORY for e-file)
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(a) Payer's federal ID number (EIN)</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={PAYER_DATA.ein} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(b) Payer's name</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value={PAYER_DATA.name} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Street address</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value={PAYER_DATA.street} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>City / State / ZIP code</span>
          <div className={styles.addressRow}>
            <input className={`${styles.fieldInput} ${styles.addressCity}`} readOnly value={PAYER_DATA.city} />
            <input className={`${styles.fieldInput} ${styles.addressState}`} readOnly value={PAYER_DATA.state} />
            <input className={`${styles.fieldInput} ${styles.addressZip}`} readOnly value={PAYER_DATA.zip} />
          </div>
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Payer's telephone number</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={PAYER_DATA.payerPhone} />
        </div>

        {/* ── Recipient Information ── */}
        <div className={styles.sectionHeader}>Recipient Information</div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>SS # on account</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={RECIPIENT_DATA.ssn} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Recipient's name</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value={RECIPIENT_DATA.name} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Street address</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value={RECIPIENT_DATA.street} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>City / State / ZIP code</span>
          <div className={styles.addressRow}>
            <input className={`${styles.fieldInput} ${styles.addressCity}`} readOnly value={RECIPIENT_DATA.city} />
            <input className={`${styles.fieldInput} ${styles.addressState}`} readOnly value={RECIPIENT_DATA.state} />
            <input className={`${styles.fieldInput} ${styles.addressZip}`} readOnly value={RECIPIENT_DATA.zip} />
          </div>
        </div>

        {/* ── Dividend Income ── */}
        <div className={styles.sectionHeader}>Dividend Income</div>

        <div
          ref={selectedField === 'ordinaryDivs' ? highlightedRef : undefined}
          className={`${styles.fieldRow} ${selectedField === 'ordinaryDivs' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
          onClick={() => onFieldSelect?.('ordinaryDivs')}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.fieldLabel}>(1a) Total ordinary dividends</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall} ${selectedField === 'ordinaryDivs' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`} readOnly value={FORM_DATA.box1a_totalOrdinary} />
        </div>
        <div
          ref={selectedField === 'qualifiedDivs' ? highlightedRef : undefined}
          className={`${styles.fieldRow} ${selectedField === 'qualifiedDivs' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
          onClick={() => onFieldSelect?.('qualifiedDivs')}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.fieldLabel}>(1b) Qualified dividends</span>
          <input
            className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'qualifiedDivs' ? styles.fieldInputEditing : selectedField === 'qualifiedDivs' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
            readOnly={editingField !== 'qualifiedDivs'}
            value={editingField === 'qualifiedDivs' ? draftValue : (fieldValues?.qualifiedDivs !== undefined ? fieldValues.qualifiedDivs.toLocaleString() : FORM_DATA.box1b_qualifiedDivs)}
            onChange={e => setDraftValue(e.target.value)}
            autoFocus={editingField === 'qualifiedDivs'}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('qualifiedDivs') } if (e.key === 'Escape') cancelEdit() }}
            onClick={e => e.stopPropagation()}
          />
          {selectedField === 'qualifiedDivs' && editingField !== 'qualifiedDivs' && !reviewedFields?.has('qualifiedDivs') && (
            <>
              <button className={styles.editBtn} onClick={e => { e.stopPropagation(); startEdit('qualifiedDivs', fieldValues?.qualifiedDivs?.toString() ?? FORM_DATA.box1b_qualifiedDivs) }}>Edit</button>
              <button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('qualifiedDivs'); onFieldSelect?.('qualifiedDivs') }}>Mark as correct</button>
            </>
          )}
          {selectedField === 'qualifiedDivs' && editingField !== 'qualifiedDivs' && reviewedFields?.has('qualifiedDivs') && (
            <span className={styles.reviewedBadge}>✓ Reviewed</span>
          )}
          {editingField === 'qualifiedDivs' && (
            <div className={styles.editActions} onClick={e => e.stopPropagation()}>
              <button className={styles.saveBtn} onClick={() => commitEdit('qualifiedDivs')}>Save</button>
              <button className={styles.undoBtn} onClick={cancelEdit}>Undo</button>
            </div>
          )}
          {savedField === 'qualifiedDivs' && <span className={styles.recalcBadge}>1040 updated</span>}
          {editedFields.has('qualifiedDivs') && savedField !== 'qualifiedDivs' && <span className={styles.editedBadge}>Edited</span>}
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(2a) Total capital gain distributions</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box2a_totalCapGain} placeholder="—" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(2b) Unrecaptured Sec. 1250 gain</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box2b_unrecap1250} placeholder="—" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(2c) Section 1202 gain</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box2c_sec1202} placeholder="—" />
        </div>
        <div className={`${styles.fieldRow} ${flaggedFields['divCollectibles'] && !reviewedFields?.has('divCollectibles') ? styles.fieldRowHasNote : ''}`}>
          <span className={`${styles.fieldLabel} ${flaggedFields['divCollectibles'] && !reviewedFields?.has('divCollectibles') ? styles.fieldLabelFlagged : ''}`}>
            {flaggedFields['divCollectibles'] && !reviewedFields?.has('divCollectibles') && <span className={styles.issueIndicator} />}
            (2d) Collectibles (28%) gain
          </span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall} ${flaggedFields['divCollectibles'] && !reviewedFields?.has('divCollectibles') ? styles.fieldInputHighlightedOrange : ''}`} readOnly value={FORM_DATA.box2d_collectibles} placeholder={flaggedFields['divCollectibles'] ? 'Not imported' : '—'} />
          {renderFlagActions('divCollectibles')}
        </div>
        <ValidationNote fieldKey="divCollectibles" />
        <div className={`${styles.fieldRow} ${flaggedFields['divNonDiv'] && !reviewedFields?.has('divNonDiv') ? styles.fieldRowHasNote : ''}`}>
          <span className={`${styles.fieldLabel} ${flaggedFields['divNonDiv'] && !reviewedFields?.has('divNonDiv') ? styles.fieldLabelFlagged : ''}`}>
            {flaggedFields['divNonDiv'] && !reviewedFields?.has('divNonDiv') && <span className={styles.issueIndicator} />}
            (3) Nondividend distributions
          </span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall} ${flaggedFields['divNonDiv'] && !reviewedFields?.has('divNonDiv') ? styles.fieldInputHighlightedOrange : ''}`} readOnly value={FORM_DATA.box3_nonDivDistrib} placeholder={flaggedFields['divNonDiv'] ? 'Not imported' : '—'} />
          {renderFlagActions('divNonDiv')}
        </div>
        <ValidationNote fieldKey="divNonDiv" />
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(4) Federal income tax withheld</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box4_fedTaxWithheld} placeholder="—" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(5) Investment expenses</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box5_investExpenses} placeholder="—" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(6) Foreign tax paid</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box6_foreignTaxPaid} placeholder="—" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(7) Foreign country or U.S. possession</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value={FORM_DATA.box7_foreignCountry} placeholder="—" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(8) Cash liquidation distributions</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box8_cashLiquidation} placeholder="—" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(9) Noncash liquidation distributions</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box9_nonCashLiquidation} placeholder="—" />
        </div>

      </div>
    </div>
  )
}
