import { useEffect, useRef, useState } from 'react'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/DetailFields.module.css'

// Realistic 1099-INT data for Unwavering Financial
const PAYER_DATA = {
  ein: '94-1234567',
  name: 'Unwavering Financial, N.A.',
  street: '1 Financial Plaza, Suite 400',
  city: 'San Francisco',
  state: 'CA',
  zip: '94104',
  payerPhone: '(800) 555-0100',
}

const RECIPIENT_DATA = {
  ssn: '111-11-1111',
  name: 'Jessica Drake',
  street: '333 Easy Street',
  city: 'Middlefield',
  state: 'CA',
  zip: '98756',
}

// Form 1099-INT boxes — Jessica Drake values
const FORM_DATA = {
  box1_interest:        '3,486',   // Box 1 — deliberately $1,500 more than 1040 line 2b ($1,986) — unflagged discrepancy
  box2_earlyPenalty:    '0',       // Box 2 — Early withdrawal penalty
  box3_usBonds:         '35',      // Box 3 — Interest on U.S. Savings Bonds & T-bills
  box4_fedTaxWithheld:  '0',       // Box 4 — Federal income tax withheld
  box5_investExpenses:  '0',       // Box 5 — Investment expenses
  box6_foreignTax:      '0',       // Box 6 — Foreign tax paid
  box7_foreignCountry:  '',        // Box 7 — Foreign country or U.S. possession
  box8_taxExempt:       '0',       // Box 8 — Tax-exempt interest
  box9_specPrivActivity:'0',       // Box 9 — Specified private activity bond interest
  box10_marketDiscount: '0',       // Box 10 — Market discount
  box11_bondPremium:    '0',       // Box 11 — Bond premium
  box13_stateTaxId:     'CA-87654321',
  box14_stateTax:       '0',
  box15_stateIncome:    '1,986',
}

interface DetailFields1099Props {
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  onFieldSelect?: (field: string) => void
  fieldValues?: { withholding: number; box12: number; taxableInterest: number; qualifiedDivs: number }
  onFieldValueChange?: (key: 'withholding' | 'box12' | 'taxableInterest' | 'qualifiedDivs', value: number) => void
  onMarkReviewed?: (field: string) => void
  onMarkReviewedBulk?: (fields: string[]) => void
  reviewedFields?: Map<string, { by: string; at: string }>
}

export default function DetailFields1099({ selectedField, highlightMode = 'blue', onFieldSelect, fieldValues, onFieldValueChange, onMarkReviewed, onMarkReviewedBulk, reviewedFields }: DetailFields1099Props) {
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

  const commitEdit = (field: 'taxableInterest') => {
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
        <h2 className={styles.title}>Details: Interest Income (1099-INT) — Unwavering Financial</h2>
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
          <span className={styles.fieldLabel}>(c) Recipient's SSN or ITIN</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={RECIPIENT_DATA.ssn} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(d) Recipient's name</span>
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

        {/* ── Interest Income ── */}
        <div className={styles.sectionHeader}>Interest Income</div>

        <div
          ref={selectedField === 'taxableInterest' ? highlightedRef : undefined}
          className={`${styles.fieldRow} ${selectedField === 'taxableInterest' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''}`}
          onClick={() => onFieldSelect?.('taxableInterest')}
          style={{ cursor: 'pointer' }}
        >
          <span className={styles.fieldLabel}>(1) Interest income</span>
          <input
            className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'taxableInterest' ? styles.fieldInputEditing : selectedField === 'taxableInterest' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
            readOnly={editingField !== 'taxableInterest'}
            value={editingField === 'taxableInterest' ? draftValue : (fieldValues?.taxableInterest !== undefined ? fieldValues.taxableInterest.toLocaleString() : FORM_DATA.box1_interest)}
            onChange={e => setDraftValue(e.target.value)}
            autoFocus={editingField === 'taxableInterest'}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commitEdit('taxableInterest') } if (e.key === 'Escape') cancelEdit() }}
            onClick={e => e.stopPropagation()}
          />
          {selectedField === 'taxableInterest' && editingField !== 'taxableInterest' && !reviewedFields?.has('taxableInterest') && (
            <>
              <button className={styles.editBtn} onClick={e => { e.stopPropagation(); startEdit('taxableInterest', fieldValues?.taxableInterest?.toString() ?? FORM_DATA.box1_interest) }}>Edit</button>
              <button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('taxableInterest'); onFieldSelect?.('taxableInterest') }}>Mark as correct</button>
            </>
          )}
          {selectedField === 'taxableInterest' && editingField !== 'taxableInterest' && reviewedFields?.has('taxableInterest') && (
            <span className={styles.reviewedBadge}>✓ Reviewed</span>
          )}
          {editingField === 'taxableInterest' && (
            <div className={styles.editActions} onClick={e => e.stopPropagation()}>
              <button className={styles.saveBtn} onClick={() => commitEdit('taxableInterest')}>Save</button>
              <button className={styles.undoBtn} onClick={cancelEdit}>Undo</button>
            </div>
          )}
          {savedField === 'taxableInterest' && <span className={styles.recalcBadge}>1040 updated</span>}
          {editedFields.has('taxableInterest') && savedField !== 'taxableInterest' && <span className={styles.editedBadge}>Edited</span>}
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(2) Early withdrawal penalty</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box2_earlyPenalty} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(3) Interest on U.S. Savings Bonds &amp; T-bills</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box3_usBonds} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(4) Federal income tax withheld</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box4_fedTaxWithheld} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(5) Investment expenses</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box5_investExpenses} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(6) Foreign tax paid</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box6_foreignTax} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(7) Foreign country or U.S. possession</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value={FORM_DATA.box7_foreignCountry} placeholder="N/A" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(8) Tax-exempt interest</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box8_taxExempt} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(9) Specified private activity bond interest</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box9_specPrivActivity} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(10) Market discount</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box10_marketDiscount} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(11) Bond premium</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box11_bondPremium} />
        </div>

        {/* ── State Tax Information ── */}
        <div className={styles.sectionHeader}>State Tax Information</div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(13) State / Payer's state ID number</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box13_stateTaxId} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(14) State income tax withheld</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box14_stateTax} />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(15) State income</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={FORM_DATA.box15_stateIncome} />
        </div>

      </div>
    </div>
  )
}
