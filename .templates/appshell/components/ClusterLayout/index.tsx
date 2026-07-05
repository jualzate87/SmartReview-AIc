import styles from './ClusterLayout.module.css'
import cx from 'classnames'
import { forwardRef } from 'react'

type ClusterLayoutProps = {
  children: React.ReactNode
  gap?: number
  justifyContent?:
    | 'flexStart'
    | 'center'
    | 'flexEnd'
    | 'spaceBetween'
    | 'spaceAround'
    | 'spaceEvenly'
  alignItems?: 'flexStart' | 'center' | 'flexEnd'
  className?: string
  nowrap?: boolean
  style?: React.CSSProperties
}

const ClusterLayout = forwardRef<HTMLDivElement, ClusterLayoutProps>(
  (
    {
      children,
      gap = 2,
      nowrap,
      className,
      justifyContent = 'flexStart',
      alignItems = 'center',
      style,
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cx(
          className,
          styles.root,
          nowrap && styles.nowrap,
          justifyContent && styles[justifyContent],
          alignItems && styles['a-' + alignItems],
          gap && styles[`spacing-${gap}`],
        )}
        style={style}
      >
        {children}
      </div>
    )
  },
)

ClusterLayout.displayName = 'ClusterLayout'

export default ClusterLayout
