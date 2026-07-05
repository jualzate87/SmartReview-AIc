import { useEffect, useRef, useState } from 'react'
import styles from './DelayedContent.module.css'
// eslint-disable-next-line no-restricted-imports
import cx from 'classnames'

export function DelayedContent({
  children,
  delay = 1000,
  loader,
}: {
  children: React.ReactNode
  delay?: number
  loader?: React.ReactNode
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [show, setShow] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    timer.current = setTimeout(() => {
      setShow(true)
      // Small delay to ensure DOM is updated before triggering animation
      setTimeout(() => setIsVisible(true), 10)
    }, delay)
    return () => clearTimeout(timer.current || undefined)
  }, [delay])

  if (show) {
    return (
      <div
        className={cx(styles.root, styles.fadeIn, {
          [styles.visible]: isVisible,
        })}
      >
        {children}
      </div>
    )
  }

  return <>{loader ? loader : undefined}</>
}
