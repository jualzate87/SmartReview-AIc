import type { ReactNode } from 'react'
import { getInputDestinationTip } from '../../data/inputDestinations'
import Tooltip from './Tooltip'

/** Field label that shows where the input lands on Form 1040 (when known). */
export function DestinationFieldLabel({
  fieldKey,
  className,
  children,
}: {
  fieldKey: string
  className?: string
  children: ReactNode
}) {
  const tip = getInputDestinationTip(fieldKey)
  const label = <span className={className}>{children}</span>
  if (!tip) return label
  return (
    <Tooltip text={tip} placement="top">
      {label}
    </Tooltip>
  )
}
