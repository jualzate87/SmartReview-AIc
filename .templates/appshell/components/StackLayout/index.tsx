import cx from 'classnames'
import styles from './StackLayout.module.css'

type StackLayoutProps = {
  children: React.ReactNode
  gap?: number
  style?: React.CSSProperties
  className?: string
  fullWidth?: boolean
}

export default function StackLayout({
  children,
  gap = 2,
  className,
  fullWidth = false,
  style,
  ...props
}: StackLayoutProps & React.HTMLAttributes<HTMLDivElement>) {
  const classes = cx(styles.root, styles[`spacing-${gap}`], className, {
    [styles.fullWidth]: fullWidth,
  })

  return (
    <div className={classes} data-gap={gap} style={style} {...props}>
      {children}
    </div>
  )
}
