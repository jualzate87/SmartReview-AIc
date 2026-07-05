import { useEffect, useRef, useState } from 'react'
import styles from './FusionOmniNav.module.css'
import AnimatedBrand from '@genux-ds/animated-brand'
// eslint-disable-next-line no-restricted-imports
import cx from 'classnames'
import { B3 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import { useFusion } from '../../contexts/fusion'

function OmniNavItemTypewriter({
  texts,
  speed = 50,
  loop = false,
  onComplete,
}: {
  texts: string[]
  speed?: number
  loop?: boolean
  onComplete?: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [displayText, setDisplayText] = useState('')
  const [charIndex, setCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const completedRef = useRef(false)

  useEffect(() => {
    if (!loop && completedRef.current) return

    const currentText = texts[currentIndex]

    if (!isDeleting && charIndex < currentText.length) {
      const timer = setTimeout(() => {
        setDisplayText(currentText.slice(0, charIndex + 1))
        setCharIndex(charIndex + 1)
      }, speed)
      return () => clearTimeout(timer)
    }

    if (!isDeleting && charIndex === currentText.length) {
      if (currentIndex === texts.length - 1) {
        if (!loop) {
          completedRef.current = true
          onComplete?.()
          return
        }
      }
      const timer = setTimeout(() => setIsDeleting(true), 1500)
      return () => clearTimeout(timer)
    }

    if (isDeleting && charIndex > 0) {
      const timer = setTimeout(() => {
        setDisplayText(currentText.slice(0, charIndex - 1))
        setCharIndex(charIndex - 1)
      }, speed / 2)
      return () => clearTimeout(timer)
    }

    if (isDeleting && charIndex === 0) {
      setIsDeleting(false)
      setCurrentIndex((currentIndex + 1) % texts.length)
    }
  }, [charIndex, currentIndex, isDeleting, texts, speed, loop, onComplete])

  return <span>{displayText}</span>
}

function FusionOmniNavButton() {
  const initialLoadTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [animating, setAnimating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [complete, setComplete] = useState(false)
  const { toggleSidePanel } = useFusion()
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    setAnimating(false)
    mountedTimeout.current = setTimeout(() => {
      setMounted(true)
    }, 1000)
    initialLoadTimeout.current = setTimeout(() => {
      setAnimating(true)
    }, 1000)
    return () => {
      if (initialLoadTimeout.current) {
        clearTimeout(initialLoadTimeout.current)
      }
      if (mountedTimeout.current) {
        clearTimeout(mountedTimeout.current)
      }
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      setAnimating(true)
    }
  }, [mounted])

  return (
    <button
      onClick={() => {
        toggleSidePanel()
      }}
      onMouseEnter={() => {
        setHovering(true)
      }}
      onMouseLeave={() => {
        setHovering(false)
      }}
      aria-label="Toggle side panel"
      type="button"
      className={cx(styles.root, {
        [styles.mounted]: mounted && !complete,
        [styles.animating]: animating,
        [styles.complete]: complete,
      })}
    >
      <AnimatedBrand
        animationType="intuitIntelligenceDefault"
        playing={!mounted || hovering}
        loop={0}
        size={20}
      />
      {!complete && mounted && (
        <B3 weight="demi">
          <OmniNavItemTypewriter
            texts={[
              'Find profit last month',
              'Help get new customers',
              'Analyze files and images',
              'Or, ask me anything...',
            ]}
            speed={50}
            loop={false}
            onComplete={() => {
              setTimeout(() => {
                setComplete(true)
              }, 1400)
            }}
          />
        </B3>
      )}
    </button>
  )
}

export default FusionOmniNavButton
