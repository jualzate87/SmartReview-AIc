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
  getNextVerifyItem,
  navigationForDetailField,
} from './data-review/phase1FieldSync'
import DocumentPreview from './data-review/DocumentPreview'
import { getSourceDocPreview } from './data-review/sourceDocImages'
import SourcePanelLoader from './data-review/SourcePanelLoader'
import DetailFields, { W2_PAYER_TABS } from './data-review/DetailFields'
import type { W2Employer } from './data-review/DetailFields'
import DetailFields1099, { INT_PAYER_TABS } from './data-review/DetailFields1099'
import type { IntPayer } from './data-review/DetailFields1099'
import DetailFieldsDiv, { DIV_PAYER_TABS } from './data-review/DetailFieldsDiv'
import type { DivPayer } from './data-review/DetailFieldsDiv'
import DetailFields1099R, { R_PAYER_TABS } from './data-review/DetailFields1099R'
import DetailFieldsNec, { NEC_PAYER_TABS } from './data-review/DetailFieldsNec'
import PeelTab from './data-review/PeelTab'
import PriorYear1040Fields from './data-review/PriorYear1040Fields'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import { FROZEN_RETURN } from '../data/frozenReturn'
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
    fieldValues, updateFieldValue,
    reviewedFields,
    activeDivPayer, setActiveDivPayer,
    activeIntPayer, setActiveIntPayer,
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
    verifiedDocs,
    toggleVerifiedDoc,
  } = useSyncedReviewState()

  // W-2 Box 2 is $15,840 (Tech Circle); 1099-DIV Box 4 ($24,925) flows to line 25b.
  const DIV_WITHHOLDING = FROZEN_RETURN.divWithholding
  const totalWithholding = fieldValues.withholding.techCircle + DIV_WITHHOLDING
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
  const divPayerFieldCounts: Record<DivPayer, number> = Object.fromEntries(
    DIV_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForDivPayer(p, reviewedFields)])
  ) as Record<DivPayer, number>
  const intPayerFieldCounts: Record<IntPayer, number> = Object.fromEntries(
    INT_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForIntPayer(p, reviewedFields)])
  ) as Record<IntPayer, number>
  const w2PayerFieldCounts: Record<W2Employer, number> = Object.fromEntries(
    W2_PAYER_TABS.map(({ key: p }) => [p, countPhase1FlagsForW2Payer(p, reviewedFields)])
  ) as Record<W2Employer, number>

  const rightRef = useRef<HTMLDivElement>(null)
  const [previewWidth, setPreviewWidth] = useState(40)

  const handlePreviewDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const right = rightRef.current
    if (!right) return
    const startX = e.clientX
    const startWidth = previewWidth
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const rightWidth = right.getBoundingClientRect().width
      setPreviewWidth(Math.max(20, Math.min(75, startWidth + (delta / rightWidth) * 100)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
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
        onTopTabChange={(tab) => { setActiveTopTab(tab); setSelectedField(null) }}
      />

      {phase1Remaining > 0 && (
        <Phase1IssueBanner unresolvedCount={phase1Remaining} onVerify={handleVerifyNext} />
      )}

      {/* Peel tabs — payer switcher for multi-payer doc types */}
      {activeTopTab === '1099-divs' && (
        <PeelTab
          tabs={DIV_PAYER_TABS.map(t => ({ ...t, badge: divPayerFieldCounts[t.key] }))}
          activeKey={activeDivPayer}
          onChange={key => setActiveDivPayer(key as DivPayer)}
        />
      )}
      {activeTopTab === '1099-ints' && (
        <PeelTab
          tabs={INT_PAYER_TABS.map(t => ({ ...t, badge: intPayerFieldCounts[t.key] }))}
          activeKey={activeIntPayer}
          onChange={key => setActiveIntPayer(key as IntPayer)}
        />
      )}
      {activeTopTab === 'w2s' && (
        <PeelTab
          tabs={W2_PAYER_TABS.map(t => ({ ...t, badge: w2PayerFieldCounts[t.key] }))}
          activeKey={activeSubTab}
          onChange={key => setActiveSubTab(key as W2Employer)}
        />
      )}
      {activeTopTab === '1099-rs' && (
        <PeelTab
          tabs={R_PAYER_TABS.map(t => ({ ...t, badge: tabFlagCounts['1099-rs'] }))}
          activeKey="meridian"
          onChange={() => {}}
        />
      )}
      {activeTopTab === '1099-necs' && (
        <PeelTab
          tabs={NEC_PAYER_TABS.map(t => ({ ...t, badge: 0 }))}
          activeKey="summit"
          onChange={() => {}}
        />
      )}

      <SourcePanelLoader loadKey={`${activeTopTab}-${activeSubTab}-${activeDivPayer}-${activeIntPayer}`}>
      <div ref={rightRef} style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: `${previewWidth}%`, flexShrink: 0, overflow: 'hidden', borderRight: '1px solid #d5dee3' }}>
            <DocumentPreview
              imageSrc={sourceDocPreview.imageSrc}
              alt={sourceDocPreview.alt}
            />
          </div>

          <div className={dragStyles.handleVertical} onMouseDown={handlePreviewDrag}>
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
                onWageChange={(employer, value) => setWages({ ...wages, [employer]: value })}
                fieldValues={{ ...fieldValues, withholding: fieldValues.withholding[activeSubTab] }}
                onFieldValueChange={(key, value) => {
                  if (key === 'withholding' && typeof value === 'number') {
                    updateField('withholding', { techCircle: value })
                  } else {
                    updateField(key as keyof typeof fieldValues, value as number)
                  }
                }}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                verifiedDocs={verifiedDocs}
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
                fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                onFieldValueChange={(key, value) => updateField(key as keyof typeof fieldValues, value)}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
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
                onFieldValueChange={(key, value) => updateField(key as keyof typeof fieldValues, value)}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                verifiedDocs={verifiedDocs}
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
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
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
                onFieldSelect={setSelectedField}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
                verifiedDocs={verifiedDocs}
                onVerifyDoc={toggleVerifiedDoc}
              />
            )}
            {activeTopTab === 'prior-1040' && <PriorYear1040Fields onMarkReviewed={handleMarkReviewed} reviewedFields={reviewedFields} />}
          </div>
        </div>
      </SourcePanelLoader>
    </div>
  )
}
