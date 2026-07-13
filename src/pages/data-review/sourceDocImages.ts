import type { TopTab } from './ReviewTab'
import type { W2Employer } from './DetailFields'
import { W2_PAYER_TABS } from './DetailFields'
import type { DivPayer } from './DetailFieldsDiv'
import { DIV_PAYER_TABS } from './DetailFieldsDiv'
import type { IntPayer } from './DetailFields1099'
import { INT_PAYER_TABS } from './DetailFields1099'

import imgW2TechCircle from '../../assets/source-docs/w2-tech-circle.jpg'
import img1099IntUnwavering from '../../assets/source-docs/1099-int-unwavering.jpg'
import img1099IntHarborline from '../../assets/source-docs/1099-int-harborline.jpg'
import img1099IntCascade from '../../assets/source-docs/1099-int-cascade.jpg'
import img1099DivToken from '../../assets/source-docs/1099-div-token.jpg'
import img1099DivNorthmark from '../../assets/source-docs/1099-div-northmark.jpg'
import img1099DivBeacon from '../../assets/source-docs/1099-div-beacon.jpg'
import img1099RMeridian from '../../assets/source-docs/1099-r-meridian.jpg'
import img1099NecSummit from '../../assets/source-docs/1099-nec-summit.jpg'

const INT_PAYER_IMAGES: Record<IntPayer, string> = {
  unwaverIngFinancial: img1099IntUnwavering,
  harborlineCredit: img1099IntHarborline,
  cascadeFederal: img1099IntCascade,
}

const DIV_PAYER_IMAGES: Record<DivPayer, string> = {
  tokenFinancial: img1099DivToken,
  northmarkIndex: img1099DivNorthmark,
  beaconDividend: img1099DivBeacon,
}

export type SourceDocPreviewParams = {
  activeTopTab: TopTab
  activeSubTab: W2Employer
  activeIntPayer: IntPayer
  activeDivPayer: DivPayer
  prior1040Images: [string, string]
}

export function getSourceDocPreview({
  activeTopTab,
  activeSubTab,
  activeIntPayer,
  activeDivPayer,
  prior1040Images,
}: SourceDocPreviewParams): { imageSrc: string | string[]; alt: string } {
  switch (activeTopTab) {
    case 'prior-1040':
      return { imageSrc: prior1040Images, alt: 'Form 1040 (2024) — Jessica Drake' }
    case '1099-ints':
      return {
        imageSrc: INT_PAYER_IMAGES[activeIntPayer],
        alt: `1099-INT ${INT_PAYER_TABS.find(t => t.key === activeIntPayer)?.label ?? activeIntPayer}`,
      }
    case '1099-divs':
      return {
        imageSrc: DIV_PAYER_IMAGES[activeDivPayer],
        alt: `1099-DIV ${DIV_PAYER_TABS.find(t => t.key === activeDivPayer)?.label ?? activeDivPayer}`,
      }
    case '1099-rs':
      return { imageSrc: img1099RMeridian, alt: '1099-R Meridian Retirement Trust' }
    case '1099-necs':
      return { imageSrc: img1099NecSummit, alt: '1099-NEC Summit Advisory Partners' }
    case 'w2s':
    default:
      return {
        imageSrc: imgW2TechCircle,
        alt: `W-2 ${W2_PAYER_TABS.find(t => t.key === activeSubTab)?.label ?? 'Tech Circle'}`,
      }
  }
}
