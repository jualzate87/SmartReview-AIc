import { useCallback, useRef, useState } from 'react'
import { DotsSix } from '@design-systems/icons'
import ReviewTab from './data-review/ReviewTab'
import Phase1IssueBanner from './data-review/Phase1IssueBanner'
import {
  countPhase1Remaining,
  getNextVerifyItem,
  navigationForDetailField,
} from './data-review/phase1FieldSync'
import DocumentPreview from './data-review/DocumentPreview'
import DetailFields from './data-review/DetailFields'
import DetailFields1099, { INT_PAYER_TABS } from './data-review/DetailFields1099'
import type { IntPayer } from './data-review/DetailFields1099'
import DetailFieldsDiv, { DIV_PAYER_TABS } from './data-review/DetailFieldsDiv'
import type { DivPayer } from './data-review/DetailFieldsDiv'
import DetailFields1099R from './data-review/DetailFields1099R'
import DetailFieldsNec from './data-review/DetailFieldsNec'
import PeelTab from './data-review/PeelTab'
import PriorYear1040Fields from './data-review/PriorYear1040Fields'
import QuestionnairePane from './data-review/QuestionnairePane'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import w2TechCircle from '../assets/jessica-w2-tech-circle.png'
import img1040Prior from '../assets/jessica-1040-2024.png'
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

  const tabFlagCounts: Record<string, number> = {
    w2s:          ['ssn-techCircle', 'wages-techCircle', 'sswages-techCircle', 'box12', 'ein-techCircle'].filter(k => !reviewedFields.has(k)).length,
    '1099-divs':  ['qualifiedDivs', 'divCollectibles', 'divNonDiv', 'fedTaxWithheld'].filter(k => !reviewedFields.has(k)).length,
    '1099-ints':  ['taxableInterest'].filter(k => !reviewedFields.has(k)).length,
    '1099-rs':    0,
    '1099-necs':  0,
    'prior-1040': 0,
  }
  const divPayerFieldCounts: Record<DivPayer, number> = Object.fromEntries(
    DIV_PAYER_TABS.map(({ key: p }) => {
      const isPrimary = p === 'tokenFinancial'
      const fields = [
        `payerEin-${p}`, `payerName-${p}`, `payerStreet-${p}`, `payerCityStateZip-${p}`, `payerPhone-${p}`,
        `recipientSsn-${p}`, `recipientName-${p}`, `recipientStreet-${p}`, `recipientCityStateZip-${p}`,
        `ordinaryDivs-${p}`,
        ...(isPrimary ? ['qualifiedDivs', 'divCollectibles', 'divNonDiv', 'fedTaxWithheld'] : [`qualifiedDivs-${p}`, `divCollectibles-${p}`, `divNonDiv-${p}`, `fedTaxWithheld-${p}`]),
        `totalCapGain-${p}`, `unrecap1250-${p}`, `sec1202-${p}`, `investExpenses-${p}`,
        `foreignTaxPaid-${p}`, `foreignCountry-${p}`, `cashLiquidation-${p}`, `nonCashLiquidation-${p}`,
      ]
      return [p, fields.filter(k => !reviewedFields.has(k)).length]
    })
  ) as Record<DivPayer, number>
  const intPayerFieldCounts: Record<IntPayer, number> = Object.fromEntries(
    INT_PAYER_TABS.map(({ key: p }) => {
      const isPrimary = p === 'unwaverIngFinancial'
      const fields = [
        `payerEin-${p}`, `payerName-${p}`, `payerStreet-${p}`, `payerCityStateZip-${p}`, `payerPhone-${p}`,
        `recipientSsn-${p}`, `recipientName-${p}`, `recipientStreet-${p}`, `recipientCityStateZip-${p}`,
        ...(isPrimary ? ['taxableInterest'] : [`taxableInterest-${p}`]),
        `earlyPenalty-${p}`, `usBonds-${p}`, `fedTaxWithheld-${p}`, `investExpenses-${p}`,
        `foreignTax-${p}`, `foreignCountry-${p}`, `taxExempt-${p}`, `specPrivActivity-${p}`,
        `marketDiscount-${p}`, `bondPremium-${p}`, `stateTaxId-${p}`, `stateTax-${p}`, `stateIncome-${p}`,
      ]
      return [p, fields.filter(k => !reviewedFields.has(k)).length]
    })
  ) as Record<IntPayer, number>

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
    activeTopTab === 'prior-1040' ? img1040Prior :
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
    'W-2 Tech Circle'

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

      {activeTopTab === 'questionnaire' ? (
        <QuestionnairePane variant="tab" />
      ) : (
        <div ref={rightRef} style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ width: `${previewWidth}%`, flexShrink: 0, overflow: 'hidden', borderRight: '1px solid #d5dee3' }}>
            <DocumentPreview
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
                tabs={[{ label: 'Tech Circle', active: true }]}
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                activeSubTab={activeSubTab}
                onSubTabChange={(tab) => setActiveSubTab(tab as 'techCircle')}
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
                  wages: 'Low confidence (72%) — wages may be misread. Verify Box 1 against source W-2.',
                  sswages: 'Medium confidence (82%) — social security wages differ from Box 1 wages. Verify Box 3 against source W-2.',
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
                  qualifiedDivs: 'Large dividend amount — $331,250 ordinary dividends. Verify Box 1a and 1b against source document.',
                  divCollectibles: 'Collectibles (28%) gain not imported — review source document and enter if applicable.',
                  divNonDiv: 'Nondividend distributions not imported — review source document and enter if applicable.',
                  fedTaxWithheld: 'Low confidence (68%) — federal withholding may be misread. Verify Box 4 against source 1099-DIV.',
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
      )}
    </div>
  )
}
