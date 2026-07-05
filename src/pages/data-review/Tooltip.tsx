/**
 * Thin re-export of the IDS Tooltip so the rest of the codebase
 * imports from one consistent local path and we can swap the
 * underlying implementation in one place if needed.
 */
import IDSTooltip from '@ids-ts/tooltip'
import '@ids-ts/tooltip/dist/main.css'
import type { ReactNode } from 'react'

interface TooltipProps {
  text: string
  children: ReactNode
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ text, children, placement = 'top' }: TooltipProps) {
  return (
    <IDSTooltip message={text} position={placement} delayOpen delayOpenDuration={400}>
      {children}
    </IDSTooltip>
  )
}
