import type { DivPayer } from './DetailFieldsDiv'
import type { IntPayer } from './DetailFields1099'
import Int1099FormPreview from './Int1099FormPreview'
import Div1099FormPreview from './Div1099FormPreview'
import R1099FormPreview from './R1099FormPreview'
import Nec1099FormPreview from './Nec1099FormPreview'
import type { TopTab } from './ReviewTab'

type SourceFormPreviewProps = {
  activeTopTab: TopTab
  activeIntPayer: IntPayer
  activeDivPayer: DivPayer
}

/** Panel-viewer HTML previews for source docs (keeps recipient address in sync with detail fields). */
export default function SourceFormPreview({
  activeTopTab,
  activeIntPayer,
  activeDivPayer,
}: SourceFormPreviewProps) {
  switch (activeTopTab) {
    case '1099-ints':
      return <Int1099FormPreview payer={activeIntPayer} />
    case '1099-divs':
      return <Div1099FormPreview payer={activeDivPayer} />
    case '1099-rs':
      return <R1099FormPreview />
    case '1099-necs':
      return <Nec1099FormPreview />
    default:
      return null
  }
}

export function usesSourceFormPreview(activeTopTab: TopTab): boolean {
  return activeTopTab === '1099-ints'
    || activeTopTab === '1099-divs'
    || activeTopTab === '1099-rs'
    || activeTopTab === '1099-necs'
}
