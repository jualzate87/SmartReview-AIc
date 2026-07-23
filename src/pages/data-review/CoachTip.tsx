import { cloneElement, isValidElement, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import styles from '../../styles/data-review/CoachTip.module.css'

type CoachTipProps = {
  open: boolean
  /** Kept for call-site compatibility — popovers removed; pink pointer only */
  title?: string
  message?: ReactNode
  onClose: () => void
  /** Show the pink pulse indicator near the control */
  showDot?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  alignment?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'center'
  children: ReactElement
}

/**
 * One-shot coachmark: pink pulse only (no GuidanceTooltip popover).
 * Dismisses when the user clicks the highlighted control.
 */
export default function CoachTip({
  open,
  onClose,
  showDot = true,
  children,
}: CoachTipProps) {
  const child = isValidElement(children)
    ? cloneElement(children, {
        ...children.props,
        onClick: (e: MouseEvent) => {
          const prev = (children.props as { onClick?: (ev: MouseEvent) => void }).onClick
          prev?.(e)
          if (open) onClose()
        },
      } as Record<string, unknown>)
    : children

  return (
    <span className={styles.wrap}>
      {showDot && open && (
        <span className={styles.dot} aria-hidden>
          <span className={styles.dotPulse} />
        </span>
      )}
      {child}
    </span>
  )
}

const STORAGE_PREFIX = 'protoc-coach-tip:'

export type CoachTipId =
  | 'hideSummary'
  | 'showOutputs'
  | 'continueDiagnostics'
  | 'outputForms'
  | 'outputSourcesFirst'

export function readCoachTipShown(id: CoachTipId): boolean {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + id) === '1'
  } catch {
    return false
  }
}

export function markCoachTipShown(id: CoachTipId): void {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + id, '1')
  } catch {
    /* ignore */
  }
}
