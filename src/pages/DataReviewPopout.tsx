import { useState } from 'react'
import ReviewTab from './data-review/ReviewTab'
import type { TopTab } from './data-review/ReviewTab'
import DocumentPreview from './data-review/DocumentPreview'
import DetailFields from './data-review/DetailFields'
import w2TechCircle from '../assets/jessica-w2-tech-circle.png'
import img1099Int from '../assets/jessica-1099-int.jpg'
import img1099Div from '../assets/jessica-1099-div.jpg'
import imgK1 from '../assets/k1-easy-money.png'
import img1040Preview from '../assets/1040-2024-preview.png'

export default function DataReviewPopout() {
  const [activeTopTab, setActiveTopTab] = useState<TopTab>('w2s')

  const imageSrc =
    activeTopTab === '1099-ints'  ? img1099Int :
    activeTopTab === '1099-divs'  ? img1099Div :
    activeTopTab === 'k1'         ? imgK1 :
    activeTopTab === 'prior-1040' ? img1040Preview :
    w2TechCircle

  const imageAlt =
    activeTopTab === '1099-ints'  ? '1099-INT Unwavering Financial' :
    activeTopTab === '1099-divs'  ? '1099-DIV Unwavering Financial' :
    activeTopTab === 'k1'         ? 'K-1 Easy Money Ltd' :
    activeTopTab === 'prior-1040' ? 'Prior Year 1040' :
    'W-2 Tech Circle'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <ReviewTab
        isPopout
        activeTopTab={activeTopTab}
        onTopTabChange={(tab) => setActiveTopTab(tab)}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden', borderRight: '1px solid #d5dee3' }}>
          <DocumentPreview
            imageSrc={imageSrc}
            alt={imageAlt}
            docType={
              activeTopTab === '1099-ints' ? '1099-int' :
              activeTopTab === '1099-divs' ? '1099-div' :
              activeTopTab === 'k1'        ? 'k1' : 'w2'
            }
          />
        </div>
        {activeTopTab === 'w2s' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DetailFields
              formTitle="Details: Wages, Salaries, Tips (W-2)"
              tabs={[
                { label: 'Tech Circle', active: true },
              ]}
              activeSubTab="techCircle"
            />
          </div>
        )}
      </div>
    </div>
  )
}
