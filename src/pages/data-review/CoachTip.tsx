import { cloneElement, isValidElement, useRef, type ReactElement, type ReactNode } from 'react'
import GuidanceTooltip from '@ids-ts/guidance-tooltip'
import '@ids-ts/guidance-tooltip/dist/main.css'
import styles from '../../styles/data-review/CoachTip.module.css'

type CoachTipProps = {
  open: boolean
  title: string
  message: ReactNode
  onClose: () => void
  /** Show the pink pulse indicator near the control */
  showDot?: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'
  alignment?: 'top' | 'bottom' | 'left' | 'right' | 'middle' | 'center'
  children: ReactElement
}

/**
 * One-shot coachmark: pink pulse dot + IDS GuidanceTooltip anchored to a control.
 */
export default function CoachTip({
  open,
  title,
  message,
  onClose,
  showDot = true,
  position = 'bottom',
  alignment = 'center',
  children,
}: CoachTipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)

  const child = isValidElement(children)
    ? cloneElement(children, {
        // Preserve existing handlers; tip dismisses on close only
        ...children.props,
      } as Record<string, unknown>)
    : children

  return (
    <span ref={wrapRef} className={styles.wrap}>
      {showDot && open && (
        <span className={styles.dot} aria-hidden>
          <span className={styles.dotPulse} />
        </span>
      )}
      <GuidanceTooltip
        open={open}
        title={title}
        message={message}
        onClose={() => onClose()}
        dismissible
        enableClickAway
        autoFocus={false}
        animationOn
        position={position}
        alignment={alignment}
        offsetX={0}
        offsetY={0}
        tooltipOffsetDistance={12}
      >
        {child}
      </GuidanceTooltip>
    </span>
  )
}

const STORAGE_PREFIX = 'protoc-coach-tip:'

export type CoachTipId = 'hideSummary' | 'continueDiagnostics' | 'outputForms' | 'outputSources'

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
