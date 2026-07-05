import styles from './Avatar.module.css'
import cx from 'classnames'

export type AvatarColors = 'gray' | 'blue' | 'green' | 'red' | 'yellow'
export type AvatarSize = 'xsmall' | 'small' | 'default' | 'large'

export default function Avatar({
  name,
  color = 'gray',
  size = 'default',
  img,
  className,
  style,
}: {
  name: string
  size?: AvatarSize
  color?: AvatarColors
  className?: string
  img?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={cx(
        styles.root,
        {
          [styles.xsmall]: size === 'xsmall',
          [styles.small]: size === 'small',
          [styles.large]: size === 'large',
          [styles.gray]: color === 'gray',
          [styles.blue]: color === 'blue',
          [styles.green]: color === 'green',
          [styles.red]: color === 'red',
          [styles.yellow]: color === 'yellow',
        },
        className,
      )}
      title={name}
      aria-label={name}
      style={{
        backgroundImage: img ? `url(${img})` : 'none',
        ...style,
      }}
    >
      {name.charAt(0)}
    </div>
  )
}
