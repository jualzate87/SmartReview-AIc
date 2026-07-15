/**
 * Thin re-export of the IDS Tooltip so the rest of the codebase
 * imports from one consistent local path and we can swap the
 * underlying implementation in one place if needed.
 *
 * Tooltips portal to document.body via @ids-ts/position. We raise
 * z-index so they paint above panel dividers / gutters that would
 * otherwise clip or cover the tip when row actions sit near the edge.
 */
import IDSTooltip from '@ids-ts/tooltip'
import '@ids-ts/tooltip/dist/main.css'
import type { ReactNode } from 'react'

interface TooltipProps {
  text: string | ReactNode
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ text, children, placement = 'top' }: TooltipProps) {
  return (
    <IDSTooltip
      message={text}
      position={placement}
      alignment="center"
      delayOpen
      delayOpenDuration={400}
      preventOverflow={{ padding: 8, altAxis: true }}
      stylePosition={{ zIndex: 10000 }}
    >
      {children}
    </IDSTooltip>
  )
}
