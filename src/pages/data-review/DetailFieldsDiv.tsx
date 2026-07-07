import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleCheck, Comment } from '@design-systems/icons'
import Tooltip from './Tooltip'
import styles from '../../styles/data-review/DetailFields.module.css'

// 1099-DIV — Unwavering Financial
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
  ssn: 'XXX-XX-4699',
  name: 'Jessica Drake',
  street: '333 Easy Street',
  city: 'Middlefield',
  state: 'CA',
  zip: '98756',
}

// Form 1099-DIV boxes — Jessica Drake / Unwavering Financial
const FORM_DATA = {
  box1a_totalOrdinary:     '353,000',  // Box 1a — Total ordinary dividends
  box1b_qualifiedDivs:     '200,000',  // Box 1b — Qualified dividends
  box2a_totalCapGain:      '203,000', // Box 2a — Total capital gain distr.
  box2b_unrecap1250:       '',       // Box 2b — Unrecap. Sec. 1250 gain
  box2c_sec1202:           '',       // Box 2c — Section 1202 gain
  box2d_collectibles:      '',       // Box 2d — Collectibles (28%) gain
  box3_nonDivDistrib:      '',       // Box 3 — Nondividend distributions
  box4_fedTaxWithheld:     '26,363', // Box 4 — Federal income tax withheld
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
  onAddFieldNote?: (text: string, context: string) => void
}

export default function DetailFieldsDiv({ selectedField, highlightMode = 'blue', fieldValues, onFieldValueChange, onMarkReviewed, reviewedFields, flaggedFields = {}, onAddFieldNote }: DetailFieldsDivProps) {

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

  const commitEdit = (field: 'qualifiedDivs') => {
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

  // Read-only row with hover-revealed Mark as correct + Comment. Flagged rows
  // (e.g. collectibles, nondividend — "not imported") also get a validation note.
  const renderReadOnlyRow = (fieldKey: string, label: string, value: string, opts: { inputClass?: string; placeholder?: string } = {}) => {
    const { inputClass = styles.fieldInputSmall, placeholder = '—' } = opts
    const isFlagged = !!flaggedFields[fieldKey] && !reviewedFields?.has(fieldKey)
    const isReviewed = reviewedFields?.has(fieldKey)
    const isCommentOpen = commentField === fieldKey
    return (
      <>
        <div className={`${styles.fieldRow} ${isFlagged ? styles.fieldRowHasNote : ''} ${isCommentOpen ? styles.fieldRowCommentOpen : ''}`}>
          <span className={`${styles.fieldLabel} ${isFlagged ? styles.fieldLabelFlagged : ''}`}>
            {isFlagged && <span className={styles.issueIndicator} />}
            {label}
          </span>
          <input className={`${styles.fieldInput} ${inputClass} ${isFlagged ? styles.fieldInputHighlightedOrange : ''}`} readOnly value={value} placeholder={flaggedFields[fieldKey] ? 'Not imported' : placeholder} />
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
        <ValidationNote fieldKey={fieldKey} />
      </>
    )
  }

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

        {renderReadOnlyRow('payerEin', "(a) Payer's federal ID number (EIN)", PAYER_DATA.ein)}
        {renderReadOnlyRow('payerName', "(b) Payer's name", PAYER_DATA.name, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow('payerStreet', 'Street address', PAYER_DATA.street, { inputClass: styles.fieldInputWide })}
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

        {renderReadOnlyRow('recipientSsn', 'SS # on account', RECIPIENT_DATA.ssn)}
        {renderReadOnlyRow('recipientName', "Recipient's name", RECIPIENT_DATA.name, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow('recipientStreet', 'Street address', RECIPIENT_DATA.street, { inputClass: styles.fieldInputWide })}
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

        {/* ── Dividend Income ── */}
        <div className={styles.sectionHeader}>Dividend Income</div>

        {renderReadOnlyRow('ordinaryDivs', '(1a) Total ordinary dividends', FORM_DATA.box1a_totalOrdinary)}

        <div
          ref={selectedField === 'qualifiedDivs' ? highlightedRef : undefined}
          className={`${styles.fieldRow} ${flaggedFields['qualifiedDivs'] && !reviewedFields?.has('qualifiedDivs') ? styles.fieldRowHasNote : ''} ${selectedField === 'qualifiedDivs' ? (highlightMode === 'orange' ? styles.fieldRowHighlightedOrange : styles.fieldRowHighlighted) : ''} ${commentField === 'qualifiedDivs' ? styles.fieldRowCommentOpen : ''}`}
        >
          <span className={`${styles.fieldLabel} ${flaggedFields['qualifiedDivs'] && !reviewedFields?.has('qualifiedDivs') ? styles.fieldLabelFlagged : ''}`}>
            {flaggedFields['qualifiedDivs'] && !reviewedFields?.has('qualifiedDivs') && <span className={styles.issueIndicator} />}
            (1b) Qualified dividends
          </span>
          <input
            className={`${styles.fieldInput} ${styles.fieldInputSmall} ${editingField === 'qualifiedDivs' ? styles.fieldInputEditing : flaggedFields['qualifiedDivs'] && !reviewedFields?.has('qualifiedDivs') ? styles.fieldInputHighlightedOrange : selectedField === 'qualifiedDivs' ? (highlightMode === 'orange' ? styles.fieldInputHighlightedOrange : styles.fieldInputHighlighted) : ''}`}
            readOnly={editingField !== 'qualifiedDivs'}
            value={editingField === 'qualifiedDivs' ? draftValue : (fieldValues?.qualifiedDivs !== undefined ? fieldValues.qualifiedDivs.toLocaleString() : FORM_DATA.box1b_qualifiedDivs)}
            onChange={e => setDraftValue(e.target.value)}
            autoFocus={editingField === 'qualifiedDivs'}
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
              <Tooltip text="Edit value" placement="top"><button className={styles.editBtn} onClick={e => { e.stopPropagation(); startEdit('qualifiedDivs', fieldValues?.qualifiedDivs?.toString() ?? FORM_DATA.box1b_qualifiedDivs) }}>Edit</button></Tooltip>
              <Tooltip text="Mark as correct" placement="top"><button className={styles.markCorrectBtn} onClick={e => { e.stopPropagation(); onMarkReviewed?.('qualifiedDivs') }}><CircleCheck size="small" /></button></Tooltip>
              {renderCommentBtn('qualifiedDivs', '(1b) Qualified dividends')}
            </div>
          )}
          {savedField === 'qualifiedDivs' && <span className={styles.recalcBadge}>1040 updated</span>}
          {editedFields.has('qualifiedDivs') && savedField !== 'qualifiedDivs' && <span className={styles.editedBadge}>Edited</span>}
        </div>
        <ValidationNote fieldKey="qualifiedDivs" />

        {renderReadOnlyRow('totalCapGain', '(2a) Total capital gain distributions', FORM_DATA.box2a_totalCapGain)}
        {renderReadOnlyRow('unrecap1250', '(2b) Unrecaptured Sec. 1250 gain', FORM_DATA.box2b_unrecap1250)}
        {renderReadOnlyRow('sec1202', '(2c) Section 1202 gain', FORM_DATA.box2c_sec1202)}
        {renderReadOnlyRow('divCollectibles', '(2d) Collectibles (28%) gain', FORM_DATA.box2d_collectibles)}
        {renderReadOnlyRow('divNonDiv', '(3) Nondividend distributions', FORM_DATA.box3_nonDivDistrib)}
        {renderReadOnlyRow('fedTaxWithheld', '(4) Federal income tax withheld', FORM_DATA.box4_fedTaxWithheld)}
        {renderReadOnlyRow('investExpenses', '(5) Investment expenses', FORM_DATA.box5_investExpenses)}
        {renderReadOnlyRow('foreignTaxPaid', '(6) Foreign tax paid', FORM_DATA.box6_foreignTaxPaid)}
        {renderReadOnlyRow('foreignCountry', '(7) Foreign country or U.S. possession', FORM_DATA.box7_foreignCountry, { inputClass: styles.fieldInputWide })}
        {renderReadOnlyRow('cashLiquidation', '(8) Cash liquidation distributions', FORM_DATA.box8_cashLiquidation)}
        {renderReadOnlyRow('nonCashLiquidation', '(9) Noncash liquidation distributions', FORM_DATA.box9_nonCashLiquidation)}

      </div>
    </div>
  )
}
