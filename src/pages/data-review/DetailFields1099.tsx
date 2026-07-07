import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Comment } from '@design-systems/icons'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/DetailFields.module.css'

// Realistic 1099-INT data for Unwavering Financial
const PAYER_DATA = {
  ein: '47-8821034',
  name: 'Unwavering Financial LLC',
  street: '800 Capital Way, Suite 1100',
  city: 'Denver',
  state: 'CO',
  zip: '80202',
  payerPhone: '(720) 555-0188',
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
  box1_interest:        '2,409',   // Box 1 — Interest income
  box2_earlyPenalty:    '0',       // Box 2 — Early withdrawal penalty
  box3_usBonds:         '0',       // Box 3 — Interest on U.S. Savings Bonds & T-bills
  box4_fedTaxWithheld:  '0',       // Box 4 — Federal income tax withheld
  box5_investExpenses:  '0',       // Box 5 — Investment expenses
  box6_foreignTax:      '0',       // Box 6 — Foreign tax paid
  box7_foreignCountry:  '',        // Box 7 — Foreign country or U.S. possession
  box8_taxExempt:       '234',     // Box 8 — Tax-exempt interest
  box9_specPrivActivity:'0',       // Box 9 — Specified private activity bond interest
  box10_marketDiscount: '0',       // Box 10 — Market discount
  box11_bondPremium:    '0',       // Box 11 — Bond premium
  box13_stateTaxId:     'CA-47882103',
  box14_stateTax:       '0',
  box15_stateIncome:    '2,409',
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
  flaggedFields?: Record<string, string>
  onAddFieldNote?: (text: string, context: string) => void
}

export default function DetailFields1099({ selectedField, highlightMode = 'blue', fieldValues, onFieldValueChange, onMarkReviewed, reviewedFields, flaggedFields = {}, onAddFieldNote }: DetailFields1099Props) {
  const highlightedRef = useRef<HTMLDivElement>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [savedField, setSavedField] = useState<string | null>(null)
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set())
  // Field key whose comment popover is currently open + its anchor position (fixed)
  const [commentField, setCommentField] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentAnchor, setCommentAnchor] = useState<{ top: number; right: number } | null>(null)
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
    setEditingField(null)
    setEditedFields(prev => new Set(prev).add(field))
    setSavedField(field)
    setTimeout(() => setSavedField(null), 3500)
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

  // Read-only row with hover-revealed Mark as correct + Comment (no Edit — payer/recipient
  // identity fields and most boxes here aren't calculated 1040 inputs)
  const renderReadOnlyRow = (fieldKey: string, label: string, value: string, inputClass = styles.fieldInputSmall, placeholder?: string) => {
    const isReviewed = reviewedFields?.has(fieldKey)
    const isCommentOpen = commentField === fieldKey
    return (
      <div className={`${styles.fieldRow} ${isCommentOpen ? styles.fieldRowCommentOpen : ''}`}>
        <span className={styles.fieldLabel}>{label}</span>
        <input className={`${styles.fieldInput} ${inputClass}`} readOnly value={value} placeholder={placeholder} />
        {isReviewed ? (
          <Tooltip text="Click to unmark" placement="top">
            <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button>
          </Tooltip>
        ) : (
          <div className={styles.fieldActions}>
            <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.(fieldKey) }}><CircleCheck size="small" /></button></Tooltip>
            {renderCommentBtn(fieldKey, label)}
          </div>
        )}
      </div>
    )
  }

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

        {renderReadOnlyRow('payerEin', "(a) Payer's federal ID number (EIN)", PAYER_DATA.ein)}
        {renderReadOnlyRow('payerName', "(b) Payer's name", PAYER_DATA.name, styles.fieldInputWide)}
        {renderReadOnlyRow('payerStreet', 'Street address', PAYER_DATA.street, styles.fieldInputWide)}
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>City / State / ZIP code</span>
          <div className={styles.addressRow}>
            <input className={`${styles.fieldInput} ${styles.addressCity}`} readOnly value={PAYER_DATA.city} />
            <input className={`${styles.fieldInput} ${styles.addressState}`} readOnly value={PAYER_DATA.state} />
            <input className={`${styles.fieldInput} ${styles.addressZip}`} readOnly value={PAYER_DATA.zip} />
          </div>
          {reviewedFields?.has('payerAddress') ? (
            <Tooltip text="Click to unmark" placement="top">
              <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.('payerAddress') }}><CircleCheck size="small" /></button>
            </Tooltip>
          ) : (
            <div className={styles.fieldActions}>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('payerAddress') }}><CircleCheck size="small" /></button></Tooltip>
              {renderCommentBtn('payerAddress', 'City / State / ZIP code')}
            </div>
          )}
        </div>
        {renderReadOnlyRow('payerPhone', "Payer's telephone number", PAYER_DATA.payerPhone)}

        {/* ── Recipient Information ── */}
        <div className={styles.sectionHeader}>Recipient Information</div>

        {renderReadOnlyRow('recipientSsn', "(c) Recipient's SSN or ITIN", RECIPIENT_DATA.ssn)}
        {renderReadOnlyRow('recipientName', "(d) Recipient's name", RECIPIENT_DATA.name, styles.fieldInputWide)}
        {renderReadOnlyRow('recipientStreet', 'Street address', RECIPIENT_DATA.street, styles.fieldInputWide)}
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>City / State / ZIP code</span>
          <div className={styles.addressRow}>
            <input className={`${styles.fieldInput} ${styles.addressCity}`} readOnly value={RECIPIENT_DATA.city} />
            <input className={`${styles.fieldInput} ${styles.addressState}`} readOnly value={RECIPIENT_DATA.state} />
            <input className={`${styles.fieldInput} ${styles.addressZip}`} readOnly value={RECIPIENT_DATA.zip} />
          </div>
          {reviewedFields?.has('recipientAddress') ? (
            <Tooltip text="Click to unmark" placement="top">
              <button className={styles.reviewedBadge} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }} onClick={e => { e.stopPropagation(); onMarkReviewed?.('recipientAddress') }}><CircleCheck size="small" /></button>
            </Tooltip>
          ) : (
            <div className={styles.fieldActions}>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('recipientAddress') }}><CircleCheck size="small" /></button></Tooltip>
              {renderCommentBtn('recipientAddress', 'City / State / ZIP code')}
            </div>
          )}
        </div>

        {/* ── Interest Income ── */}
        <div className={styles.sectionHeader}>Interest Income</div>

        <div
          ref={selectedField === 'taxableInterest' ? highlightedRef : undefined}
          className={`${styles.fieldRow} ${flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldRowHasNote : ''} ${selectedField === 'taxableInterest' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''} ${commentField === 'taxableInterest' ? styles.fieldRowCommentOpen : ''}`}
        >
          <span className={`${styles.fieldLabel} ${flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldLabelFlagged : ''}`}>
            {flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') && <span className={styles.issueIndicator} />}
            (1) Interest income
          </span>
          <input
            className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'taxableInterest' ? styles.fieldInputEditing : flaggedFields['taxableInterest'] && !reviewedFields?.has('taxableInterest') ? styles.fieldInputHighlightedOrange : selectedField === 'taxableInterest' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
            readOnly={editingField !== 'taxableInterest'}
            value={editingField === 'taxableInterest' ? draftValue : (fieldValues?.taxableInterest !== undefined ? fieldValues.taxableInterest.toLocaleString() : FORM_DATA.box1_interest)}
            onChange={e => setDraftValue(e.target.value)}
            autoFocus={editingField === 'taxableInterest'}
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
              <Tooltip text="Edit value" placement="top"><button className={styles.editBtn} onClick={e => { e.stopPropagation(); startEdit('taxableInterest', fieldValues?.taxableInterest?.toString() ?? FORM_DATA.box1_interest) }}>Edit</button></Tooltip>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('taxableInterest') }}><CircleCheck size="small" /></button></Tooltip>
              {renderCommentBtn('taxableInterest', '(1) Interest income')}
            </div>
          )}
          {savedField === 'taxableInterest' && <span className={styles.recalcBadge}>1040 updated</span>}
          {editedFields.has('taxableInterest') && savedField !== 'taxableInterest' && <span className={styles.editedBadge}>Edited</span>}
        </div>
        <ValidationNote fieldKey="taxableInterest" />
        {renderReadOnlyRow('earlyPenalty', '(2) Early withdrawal penalty', FORM_DATA.box2_earlyPenalty)}
        {renderReadOnlyRow('usBonds', '(3) Interest on U.S. Savings Bonds & T-bills', FORM_DATA.box3_usBonds)}
        {renderReadOnlyRow('fedTaxWithheld', '(4) Federal income tax withheld', FORM_DATA.box4_fedTaxWithheld)}
        {renderReadOnlyRow('investExpenses', '(5) Investment expenses', FORM_DATA.box5_investExpenses)}
        {renderReadOnlyRow('foreignTax', '(6) Foreign tax paid', FORM_DATA.box6_foreignTax)}
        {renderReadOnlyRow('foreignCountry', '(7) Foreign country or U.S. possession', FORM_DATA.box7_foreignCountry, styles.fieldInputWide, 'N/A')}
        {renderReadOnlyRow('taxExempt', '(8) Tax-exempt interest', FORM_DATA.box8_taxExempt)}
        {renderReadOnlyRow('specPrivActivity', '(9) Specified private activity bond interest', FORM_DATA.box9_specPrivActivity)}
        {renderReadOnlyRow('marketDiscount', '(10) Market discount', FORM_DATA.box10_marketDiscount)}
        {renderReadOnlyRow('bondPremium', '(11) Bond premium', FORM_DATA.box11_bondPremium)}

        {/* ── State Tax Information ── */}
        <div className={styles.sectionHeader}>State Tax Information</div>

        {renderReadOnlyRow('stateTaxId', "(13) State / Payer's state ID number", FORM_DATA.box13_stateTaxId)}
        {renderReadOnlyRow('stateTax', '(14) State income tax withheld', FORM_DATA.box14_stateTax)}
        {renderReadOnlyRow('stateIncome', '(15) State income', FORM_DATA.box15_stateIncome)}

      </div>
    </div>
  )
}
