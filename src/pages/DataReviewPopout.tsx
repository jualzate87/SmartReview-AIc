import { useCallback, useRef, useState } from 'react'
import { DotsSix } from '@design-systems/icons'
import ReviewTab from './data-review/ReviewTab'
import Phase1IssueBanner from './data-review/Phase1IssueBanner'
import {
  countPhase1Remaining,
  countPhase1FlagsForDivPayer,
  countPhase1FlagsForIntPayer,
  countPhase1FlagsForW2Payer,
  getTabFlagCounts,
  getTabInitialFlagCounts,
  getInitialW2PayerFlagCount,
  getInitialDivPayerFlagCount,
  getInitialIntPayerFlagCount,
  getInitialRPayerFlagCount,
  getNextVerifyItem,
  navigationForDetailField,
} from './data-review/phase1FieldSync'
import DocumentPreview from './data-review/DocumentPreview'
import Int1099FormPreview from './data-review/Int1099FormPreview'
import { getSourceDocPreview } from './data-review/sourceDocImages'
import DetailFields, { W2_PAYER_TABS } from './data-review/DetailFields'
import type { W2Employer } from './data-review/DetailFields'
import DetailFields1099, { INT_PAYER_TABS, intVerifiedDocKey } from './data-review/DetailFields1099'
import type { IntPayer } from './data-review/DetailFields1099'
import DetailFieldsDiv, { DIV_PAYER_TABS, divVerifiedDocKey } from './data-review/DetailFieldsDiv'
import type { DivPayer } from './data-review/DetailFieldsDiv'
import {
  buildTabVerifiedKeys,
  buildTypeReviewed,
  isDocReviewed,
} from './data-review/docReviewStatus'
import DetailFields1099R, { R_PAYER_TABS } from './data-review/DetailFields1099R'
import DetailFieldsNec, { NEC_PAYER_TABS } from './data-review/DetailFieldsNec'
import PeelTab from './data-review/PeelTab'
import PriorYear1040Fields from './data-review/PriorYear1040Fields'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import { computeLiveReturn } from '../data/liveReturn'
import { PHASE1_FLAG_MESSAGES } from './data-review/phase1FlagMessages'
import img1040PriorPage1 from '../assets/jessica-1040-2024-variant-1.png'
import img1040PriorPage2 from '../assets/jessica-1040-2024-variant-2.png'
import dragStyles from '../styles/data-review/DragHandle.module.css'

// ProtoC: the pop-out is the same view as the main window's right panel, not a
// separate copy — same flags, same reviewed state, same edits, same document
// preview zoom/pan, all live-synced via useSyncedReviewState (BroadcastChannel).
// See DataReviewPage.tsx's right panel for the layout this mirrors.

export default function DataReviewPopout() {
  const {
    activeTopTab, setActiveTopTab,
    activeSubTab, setActiveSubTab,
    selectedField, setSelectedField,
    wages, setWages,
    amounts, updateAmounts,
    fieldValues, updateFieldValue,
    reviewedFields,
    editedFields,
    editedFieldsMeta,
    markEdited,
    activeDivPayer, setActiveDivPayer,
    activeIntPayer, setActiveIntPayer,
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
    verifiedDocs,
    verifiedDocsMeta,
    toggleVerifiedDoc,
  } = useSyncedReviewState()

  const liveTotals = computeLiveReturn(amounts)
  const totalWithholding = liveTotals.totalWithholding
  const updateField = (key: keyof typeof fieldValues, value: number | { techCircle: number }) =>
    updateFieldValue(key, value)

  // Pop-out always shows the plain (blue) selection highlight — the orange
  // "agent issue" highlight only applies to the Phase 2 AI panel, which never
  // pops out.
  const highlightMode: 'orange' | 'blue' = 'blue'

  const phase1Remaining = countPhase1Remaining(reviewedFields)

  const applyVerifyNavigation = useCallback((field: string) => {
    const nav = navigationForDetailField(field)
    if (nav) {
      setActiveTopTab(nav.tab)
      if (nav.divPayer) setActiveDivPayer(nav.divPayer)
      if (nav.intPayer) setActiveIntPayer(nav.intPayer)
    }
    setSelectedField(field)
  }, [setActiveTopTab, setActiveDivPayer, setActiveIntPayer, setSelectedField])

  const handleVerifyNext = useCallback(() => {
    const next = getNextVerifyItem(reviewedFields, selectedField)
    if (!next) return
    applyVerifyNavigation(next.field)
  }, [reviewedFields, selectedField, applyVerifyNavigation])

  const tabFlagCounts = getTabFlagCounts(reviewedFields)
  const tabInitialFlagCounts = getTabInitialFlagCounts()
  const divPayerFieldCounts: Record<DivPayer, number> = Object.fromEntries(
    DIV_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForDivPayer(p, reviewedFields)])
  ) as Record<DivPayer, number>
  const intPayerFieldCounts: Record<IntPayer, number> = Object.fromEntries(
    INT_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForIntPayer(p, reviewedFields)])
  ) as Record<IntPayer, number>
  const w2PayerFieldCounts: Record<W2Employer, number> = Object.fromEntries(
    W2_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForW2Payer(p, reviewedFields)])
  ) as Record<W2Employer, number>
  const tabVerifiedKeys = buildTabVerifiedKeys()
  const typeReviewed = buildTypeReviewed({
    verifiedDocs,
    w2Counts: w2PayerFieldCounts,
    divCounts: divPayerFieldCounts,
    intCounts: intPayerFieldCounts,
    rRemaining: tabFlagCounts['1099-rs'] ?? 0,
  })

  const rightRef = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(40)

  const handlePreviewDrag = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const right = rightRef.current
    if (!right) return
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture?.(e.pointerId)
    const startX = e.clientX
    const startWidth = previewWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onPointerMove = (moveEvent: PointerEvent) => {
      const delta = moveEvent.clientX - startX
      const rightWidth = right.getBoundingClientRect().width
      if (rightWidth <= 0) return
      setPreviewWidth(Math.max(20, Math.min(75, startWidth + (delta / rightWidth) * 100)))
    }
    const onPointerUp = (upEvent: PointerEvent) => {
      try { target.releasePointerCapture?.(upEvent.pointerId) } catch { /* already released */ }
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointercancel', onPointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointercancel', onPointerUp)
  }, [previewWidth])

  const sourceDocPreview = getSourceDocPreview({
    activeTopTab,
    activeSubTab,
    activeIntPayer,
    activeDivPayer,
    prior1040Images: [img1040PriorPage1, img1040PriorPage2],
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <ReviewTab
        isPopout
        activeTopTab={activeTopTab}
        flagCounts={tabFlagCounts}
        initialFlagCounts={tabInitialFlagCounts}
        verifiedDocs={verifiedDocs}
        tabVerifiedKeys={tabVerifiedKeys}
        typeReviewed={typeReviewed}
        onTopTabChange={(tab) => { setActiveTopTab(tab); setSelectedField(null) }}
      />

      {phase1Remaining > 0 && (
        <Phase1IssueBanner unresolvedCount={phase1Remaining} onVerify={handleVerifyNext} />
      )}

      {/* Peel tabs — payer switcher for multi-payer doc types */}
      {activeTopTab === '1099-divs' && (
        <PeelTab
          tabs={DIV_PAYER_TABS.map(t => ({
            ...t,
            badge: divPayerFieldCounts[t.key],
            showClearedCheck: isDocReviewed(
              verifiedDocs,
              divVerifiedDocKey(t.key),
              divPayerFieldCounts[t.key],
              getInitialDivPayerFlagCount(t.key),
            ),
          }))}
          activeKey={activeDivPayer}
          onChange={key => setActiveDivPayer(key as DivPayer)}
        />
      )}
      {activeTopTab === '1099-ints' && (
        <PeelTab
          tabs={INT_PAYER_TABS.map(t => ({
            ...t,
            badge: intPayerFieldCounts[t.key],
            showClearedCheck: isDocReviewed(
              verifiedDocs,
              intVerifiedDocKey(t.key),
              intPayerFieldCounts[t.key],
              getInitialIntPayerFlagCount(t.key),
            ),
          }))}
          activeKey={activeIntPayer}
          onChange={key => setActiveIntPayer(key as IntPayer)}
        />
      )}
      {activeTopTab === 'w2s' && (
        <PeelTab
          tabs={W2_PAYER_TABS.map(t => ({
            ...t,
            badge: w2PayerFieldCounts[t.key],
            showClearedCheck: isDocReviewed(
              verifiedDocs,
              t.key,
              w2PayerFieldCounts[t.key],
              getInitialW2PayerFlagCount(t.key),
            ),
          }))}
          activeKey={activeSubTab}
          onChange={key => setActiveSubTab(key as W2Employer)}
        />
      )}
      {activeTopTab === '1099-rs' && (
        <PeelTab
          tabs={R_PAYER_TABS.map(t => ({
            ...t,
            badge: tabFlagCounts['1099-rs'],
            showClearedCheck: isDocReviewed(
              verifiedDocs,
              '1099-r',
              tabFlagCounts['1099-rs'],
              getInitialRPayerFlagCount(),
            ),
          }))}
          activeKey="meridian"
          onChange={() => {}}
        />
      )}
      {activeTopTab === '1099-necs' && (
        <PeelTab
          tabs={NEC_PAYER_TABS.map(t => ({
            ...t,
            badge: 0,
            showClearedCheck: verifiedDocs.has('1099-nec'),
          }))}
          activeKey="summit"
          onChange={() => {}}
        />
      )}

      <div ref={rightRef} style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: `0 0 ${previewWidth}%`, minWidth: 0, minHeight: 0, overflow: 'hidden', borderRight: '1px solid #d5dee3' }}>
            <DocumentPreview
              imageSrc={sourceDocPreview.imageSrc}
              alt={sourceDocPreview.alt}
              customContent={
                sourceDocPreview.useInt1099UnwaveringHtml
                  ? <Int1099FormPreview />
                  : undefined
              }
            />
          </div>

          <div
            className={dragStyles.handleVertical}
            onPointerDown={handlePreviewDrag}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize document preview and Details"
          >
            <DotsSix size="small" className={dragStyles.handleIcon} />
          </div>

          <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTopTab === 'w2s' && (
              <DetailFields
                formTitle="Details: Wages, Salaries, Tips (W-2)"
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                activeSubTab={activeSubTab}
                onSubTabChange={(tab) => setActiveSubTab(tab as W2Employer)}
                wages={{ bingEquipment: 0, techCircle: wages.techCircle }}
                onWageChange={(employer, value) => {
                  setWages({ ...wages, [employer]: value })
                  markEdited(`wages-${employer}`)
                }}
                fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[activeSubTab] }}
                onFieldValueChange={(key, value) => {
                  if (key === 'withholding' && typeof value === 'number') {
                    updateField('withholding', { techCircle: value })
                    markEdited('withholding')
                  } else {
                    updateField(key as keyof typeof fieldValues, value as number)
                    markEdited(String(key))
                  }
                }}
                box12Rows={amounts.box12Rows}
                onBox12RowChange={(sub, patch) => {
                  updateAmounts({
                    box12Rows: {
                      ...amounts.box12Rows,
                      [sub]: { ...amounts.box12Rows[sub], ...patch },
                    },
                  })
                  markEdited(`box12${sub}-${activeSubTab}`)
                }}
                onIdentityChange={(kind, value) => {
                  if (kind === 'ssn') updateAmounts({ employeeSsn: value })
                  else updateAmounts({ employerEin: value })
                  markEdited(kind === 'ssn' ? 'ssn-techCircle' : 'ein-techCircle')
                }}
                identityValues={{ ssn: amounts.employeeSsn, ein: amounts.employerEin }}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                editedFields={editedFields}
                editedFieldsMeta={editedFieldsMeta}
                verifiedDocs={verifiedDocs}
                verifiedDocsMeta={verifiedDocsMeta}
                onVerifyDoc={toggleVerifiedDoc}
                flaggedFields={{
                  ssn: PHASE1_FLAG_MESSAGES.w2.ssn,
                  wages: PHASE1_FLAG_MESSAGES.w2.wages,
                  box12: PHASE1_FLAG_MESSAGES.w2.box12,
                  ein: PHASE1_FLAG_MESSAGES.w2.ein,
                }}
              />
            )}
            {activeTopTab === '1099-divs' && (
              <DetailFieldsDiv
                activePayer={activeDivPayer}
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                fieldValues={{ ...fieldValues, withholding: totalWithholding, divWithholding: amounts.divWithholding }}
                onFieldValueChange={(key, value) => {
                  updateField(key as keyof typeof fieldValues, value)
                  markEdited(String(key))
                }}
                onAmountChange={(patch, editedKey) => {
                  updateAmounts(patch)
                  if (editedKey) markEdited(editedKey)
                }}
                amounts={amounts}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                editedFields={editedFields}
                verifiedDocs={verifiedDocs}
                onVerifyDoc={toggleVerifiedDoc}
                flaggedFields={{
                  divCollectibles: PHASE1_FLAG_MESSAGES.div.divCollectibles,
                  divNonDiv: PHASE1_FLAG_MESSAGES.div.divNonDiv,
                  fedTaxWithheld: PHASE1_FLAG_MESSAGES.div.fedTaxWithheld,
                  ordinaryDivs: PHASE1_FLAG_MESSAGES.div.ordinaryDivs,
                }}
              />
            )}
            {activeTopTab === '1099-ints' && (
              <DetailFields1099
                activePayer={activeIntPayer}
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                onFieldValueChange={(key, value) => {
                  updateField(key as keyof typeof fieldValues, value)
                  markEdited(String(key))
                }}
                onAmountChange={(patch, editedKey) => {
                  updateAmounts(patch)
                  if (editedKey) markEdited(editedKey)
                }}
                amounts={amounts}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                editedFields={editedFields}
                editedFieldsMeta={editedFieldsMeta}
                verifiedDocs={verifiedDocs}
                verifiedDocsMeta={verifiedDocsMeta}
                onVerifyDoc={toggleVerifiedDoc}
                flaggedFields={{
                  taxableInterest: PHASE1_FLAG_MESSAGES.int.taxableInterest,
                }}
              />
            )}
            {activeTopTab === '1099-rs' && (
              <DetailFields1099R
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                amounts={amounts}
                onAmountChange={(patch, editedKey) => {
                  updateAmounts(patch)
                  if (editedKey) markEdited(editedKey)
                }}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                editedFields={editedFields}
                verifiedDocs={verifiedDocs}
                onVerifyDoc={toggleVerifiedDoc}
                flaggedFields={{
                  grossDistrib: PHASE1_FLAG_MESSAGES.r.grossDistrib,
                }}
              />
            )}
            {activeTopTab === '1099-necs' && (
              <DetailFieldsNec
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                amounts={amounts}
                onAmountChange={(patch, editedKey) => {
                  updateAmounts(patch)
                  if (editedKey) markEdited(editedKey)
                }}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                editedFields={editedFields}
                verifiedDocs={verifiedDocs}
                onVerifyDoc={toggleVerifiedDoc}
              />
            )}
            {activeTopTab === 'prior-1040' && <PriorYear1040Fields onMarkReviewed={handleMarkReviewed} reviewedFields={reviewedFields} />}
          </div>
        </div>
    </div>
  )
}
