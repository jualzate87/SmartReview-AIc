import {
  useInteractions,
  autoUpdate,
  FloatingPortal,
  offset,
  useFloating,
  useFocus,
  useHover,
  FloatingNode,
  useFloatingNodeId,
  safePolygon,
  flip,
  shift,
} from '@floating-ui/react'
import { useState } from 'react'
import cx from 'classnames'
import styles from './FusionShell.module.css'

function FusionPopoverNavItem({
  popover,
  children,
  className,
  disabled = false,
  id,
}: {
  popover: React.ReactNode
  children: React.ReactNode
  className?: string
  disabled?: boolean
  id?: string
}) {
  const [open, setOpen] = useState(false)
  const nodeId = useFloatingNodeId()
  const { refs, floatingStyles, context } = useFloating({
    nodeId,
    open,
    onOpenChange: setOpen,
    placement: 'right-start',
    middleware: [offset(-8), flip(), shift()],
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, {
    delay: { open: 100, close: 100 },
    move: true,
    handleClose: safePolygon({ buffer: 12 }),
  })
  const focus = useFocus(context, { enabled: false })

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus])

  if (disabled) {
    return <>{children}</>
  }

  return (
    <>
      <div
        ref={refs.setReference}
        role="button"
        tabIndex={0}
        className={cx(styles.button, className)}
        {...getReferenceProps()}
      >
        {children}
      </div>
      {open && nodeId && (
        <FloatingNode id={nodeId}>
          <FloatingPortal id={id}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className={styles.popover}
            >
              {popover}
            </div>
          </FloatingPortal>
        </FloatingNode>
      )}
    </>
  )
}
export default FusionPopoverNavItem
