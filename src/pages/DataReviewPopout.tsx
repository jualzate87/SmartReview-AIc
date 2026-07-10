import { useCallback, useRef, useState } from 'react'
import { DotsSix } from '@design-systems/icons'
import ReviewTab from './data-review/ReviewTab'
import DocumentPreview from './data-review/DocumentPreview'
import DetailFields from './data-review/DetailFields'
import DetailFields1099 from './data-review/DetailFields1099'
import DetailFieldsDiv from './data-review/DetailFieldsDiv'
import DetailFields1099R from './data-review/DetailFields1099R'
import PriorYear1040Fields from './data-review/PriorYear1040Fields'
import QuestionnairePane from './data-review/QuestionnairePane'
import { useSyncedReviewState } from '../hooks/useSyncedReviewState'
import w2TechCircle from '../assets/jessica-w2-tech-circle.png'
import img1040Prior from '../assets/jessica-1040-2024.png'
import img1099Int from '../assets/jessica-1099-int.jpg'
import img1099Div from '../assets/jessica-1099-div.jpg'
import img1099R from '../assets/jessica-1099-r.png'
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
    markReviewed: handleMarkReviewed,
    markReviewedBulk: handleMarkReviewedBulk,
  } = useSyncedReviewState()

  // W-2 Box 2 is blank for Tech Circle — all federal withholding on this return
  // comes from the 1099-DIV (Box 4), which flows to 1040 line 25b.
  const DIV_WITHHOLDING = 24925
  const totalWithholding = fieldValues.withholding.techCircle + DIV_WITHHOLDING
  const updateField = (key: keyof typeof fieldValues, value: number | { techCircle: number }) =>
    updateFieldValue(key, value)

  // Pop-out always shows the plain (blue) selection highlight — the orange
  // "agent issue" highlight only applies to the Phase 2 AI panel, which never
  // pops out.
  const highlightMode: 'orange' | 'blue' = 'blue'

  const tabFlagCounts: Record<string, number> = {
    w2s:          ['ssn-techCircle', 'wages-techCircle', 'sswages-techCircle', 'box12', 'ein-techCircle'].filter(k => !reviewedFields.has(k)).length,
    '1099-divs':  ['qualifiedDivs', 'divCollectibles', 'divNonDiv', 'fedTaxWithheld'].filter(k => !reviewedFields.has(k)).length,
    '1099-ints':  ['taxableInterest'].filter(k => !reviewedFields.has(k)).length,
    '1099-rs':    0,
    'prior-1040': 0,
  }

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
    activeTopTab === '1099-ints'  ? img1099Int :
    activeTopTab === '1099-divs'  ? img1099Div :
    activeTopTab === '1099-rs'    ? img1099R :
    w2TechCircle

  const imageAlt =
    activeTopTab === 'prior-1040' ? 'Form 1040 (2024) — Jessica Drake' :
    activeTopTab === '1099-ints'  ? '1099-INT Unwavering Financial' :
    activeTopTab === '1099-divs'  ? '1099-DIV Unwavering Financial' :
    activeTopTab === '1099-rs'    ? '1099-R Meridian Retirement Trust' :
    'W-2 Tech Circle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <ReviewTab
        isPopout
        activeTopTab={activeTopTab}
        flagCounts={tabFlagCounts}
        onTopTabChange={(tab) => { setActiveTopTab(tab); setSelectedField(null) }}
      />

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
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                onFieldValueChange={(key, value) => updateField(key as keyof typeof fieldValues, value)}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
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
                selectedField={selectedField}
                highlightMode={highlightMode}
                onFieldSelect={setSelectedField}
                fieldValues={{ ...fieldValues, withholding: totalWithholding }}
                onFieldValueChange={(key, value) => updateField(key as keyof typeof fieldValues, value)}
                onMarkReviewed={handleMarkReviewed}
                onMarkReviewedBulk={handleMarkReviewedBulk}
                reviewedFields={reviewedFields}
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
              />
            )}
            {activeTopTab === 'prior-1040' && <PriorYear1040Fields onMarkReviewed={handleMarkReviewed} reviewedFields={reviewedFields} />}
          </div>
        </div>
      )}
    </div>
  )
}
