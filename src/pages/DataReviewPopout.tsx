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
import W2FormPreview from './data-review/W2FormPreview'
import SourceDocumentList, { getActiveDocId } from './data-review/SourceDocumentList'
import type { SourceDocument } from '../data/sourceDocuments'
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
import w2TechCircle from '../assets/jessica-w2-tech-circle.png'
import img1040PriorPage1 from '../assets/jessica-1040-2024-variant-1.png'
import img1040PriorPage2 from '../assets/jessica-1040-2024-variant-2.png'
import img1099Int from '../assets/jessica-1099-int.jpg'
import img1099R from '../assets/jessica-1099-r.png'
import img1099Nec from '../assets/jessica-1099-nec.png'
import img1099DivToken from '../assets/jessica-1099-div-token.png'
import img1099DivNorthmark from '../assets/jessica-1099-div-northmark.png'
import img1099DivBeacon from '../assets/jessica-1099-div-beacon.png'
import img1099IntHarborline from '../assets/jessica-1099-int-harborline.png'
import img1099IntCascade from '../assets/jessica-1099-int-cascade.png'
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

  // W-2 Box 2 is blank for Tech Circle — all federal withholding on this return
  // comes from the 1099-DIV (Box 4, Token Financial), which flows to 1040 line 25b.
  const DIV_WITHHOLDING = 24925
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

  const imageSrc =
    activeTopTab === 'w2s' && activeSubTab === 'techCircle' ? undefined :
    activeTopTab === 'prior-1040' ? [img1040PriorPage1, img1040PriorPage2] :
    activeTopTab === '1099-ints'  ? (
      activeIntPayer === 'harborlineCredit' ? img1099IntHarborline :
      activeIntPayer === 'cascadeFederal'   ? img1099IntCascade :
      img1099Int
    ) :
    activeTopTab === '1099-divs'  ? (
      activeDivPayer === 'northmarkIndex' ? img1099DivNorthmark :
      activeDivPayer === 'beaconDividend' ? img1099DivBeacon :
      img1099DivToken
    ) :
    activeTopTab === '1099-rs'    ? img1099R :
    activeTopTab === '1099-necs'  ? img1099Nec :
    w2TechCircle

  const imageAlt =
    activeTopTab === 'prior-1040' ? 'Form 1040 (2024) — Jessica Drake' :
    activeTopTab === '1099-ints'  ? `1099-INT ${activeIntPayer}` :
    activeTopTab === '1099-divs'  ? `1099-DIV ${activeDivPayer}` :
    activeTopTab === '1099-rs'    ? '1099-R Meridian Retirement Trust' :
    activeTopTab === '1099-necs'  ? '1099-NEC Summit Advisory Partners' :
    activeTopTab === 'w2s'        ? `W-2 ${W2_PAYER_TABS.find(t => t.key === activeSubTab)?.label ?? 'Tech Circle'}` :
    'W-2 Tech Circle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <ReviewTab
        isPopout
        activeTopTab={activeTopTab}
        flagCounts={tabFlagCounts}
        onTopTabChange={(tab) => { setActiveTopTab(tab); setSelectedField(null) }}
      />

      <SourceDocumentList
        activeDocId={getActiveDocId(activeTopTab, activeSubTab, activeDivPayer, activeIntPayer)}
        onSelectDoc={(doc: SourceDocument) => {
          setActiveTopTab(doc.tab)
          if (doc.tab === 'w2s' && doc.subTab) setActiveSubTab(doc.subTab as W2Employer)
          if (doc.tab === '1099-divs' && doc.subTab) setActiveDivPayer(doc.subTab as DivPayer)
          if (doc.tab === '1099-ints' && doc.subTab) setActiveIntPayer(doc.subTab as IntPayer)
          setSelectedField(null)
        }}
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
          tabs={R_PAYER_TABS.map(t => ({ ...t, badge: 0 }))}
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
              customContent={
                activeTopTab === 'w2s' && activeSubTab === 'techCircle'
                  ? <W2FormPreview />
                  : undefined
              }
              imageSrc={imageSrc}
              alt={imageAlt}
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
                  ssn: 'Employee SSN not imported — required for e-filing. Enter manually.',
                  wages: 'Low confidence (72%): wages may be misread. Source W-2 Box 1 shows $148,940 but return has $118,940.',
                  sswages: 'Medium confidence (82%): social security wages differ from Box 1. Source W-2 shows $148,940 in Box 3 vs. $118,940 on the return.',
                  box12: 'Box 12 not imported — enter code and amount manually from source W-2.',
                  ein:   'Employer EIN not found in document — required for e-filing. Enter manually.',
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
                  divCollectibles: 'Collectibles (28%) gain not imported. Review source document and enter if applicable.',
                  divNonDiv: 'Nondividend distributions not imported. Review source document and enter if applicable.',
                  fedTaxWithheld: 'Low confidence (68%): federal withholding may be misread. Source shows $26,363 but return has $24,925. Verify Box 4 against source 1099-DIV.',
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
                  taxableInterest: 'Low confidence (72%) — interest income may be misread. Verify Box 1 against source 1099-INT.',
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
