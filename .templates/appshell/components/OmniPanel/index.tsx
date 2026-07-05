import { B1, B2, B3, B4 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import styles from './OmniPanel.module.css'
import cx from 'classnames'
import AnimatedBrand from '@genux-ds/animated-brand'
import ClusterLayout from '../ClusterLayout'
import { Close, Fullscreen, Microphone, OverflowAndroid, Plus } from '@design-systems/icons'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import StackLayout from '../StackLayout'
import { useFusion } from '../../contexts/fusion'
import { useEffect, useRef, useState } from 'react'

function OmniPanel() {
  const { toggleSidePanel, sidePanelOpen } = useFusion()
  const starterButtonsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [starterButtonsVisible, setStarterButtonsVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!sidePanelOpen) {
      setStarterButtonsVisible(false)
      setLoaded(false)
      return
    }

    loadedTimer.current = setTimeout(() => {
      setLoaded(true)
      loadedTimer.current = null
    }, 100)
    return () => {
      if (loadedTimer.current) {
        clearTimeout(loadedTimer.current)
        loadedTimer.current = null
      }
    }
  }, [sidePanelOpen])

  useEffect(() => {
    if (!loaded) {
      return
    }

    starterButtonsTimer.current = setTimeout(() => {
      setStarterButtonsVisible(true)
      starterButtonsTimer.current = null
    }, 1500)
    return () => {
      if (starterButtonsTimer.current) {
        clearTimeout(starterButtonsTimer.current)
        starterButtonsTimer.current = null
      }
    }
  }, [loaded])

  return (
    <div
      className={cx(styles.root, {
        [styles.loaded]: loaded,
      })}
    >
      <ClusterLayout justifyContent="spaceBetween" nowrap>
        <ClusterLayout className={styles.header} nowrap>
          <AnimatedBrand
            loop={0}
            playing={true}
            animationType="intuitIntelligenceDefault"
            size={24}
          />
          <B2 weight="medium">Intuit Intelligence</B2>
          <Badge status="beta">Beta</Badge>
        </ClusterLayout>

        <ClusterLayout gap={4} nowrap>
          <IconControl aria-label="More">
            <OverflowAndroid size="small" />
          </IconControl>
          <IconControl aria-label="Maximize">
            <Fullscreen size="small" />
          </IconControl>
          <IconControl aria-label="Close" onClick={() => toggleSidePanel()}>
            <Close size="small" />
          </IconControl>
        </ClusterLayout>
      </ClusterLayout>
      <StackLayout gap={4} className={styles.content}>
        <div
          className={cx(styles.title, {
            [styles.buttonsVisible]: starterButtonsVisible,
          })}
        >
          <B1 weight="medium">What can I do for you today?</B1>
        </div>
        <StackLayout
          gap={4}
          className={cx(styles.starterButtons, {
            [styles.visible]: starterButtonsVisible,
          })}
        >
          <button className={styles.starterButton}>
            <B3 weight="medium">
              Connecting your bank account is the first step to letting QuickBooks work for you.
            </B3>
            <a>How do I connect my bank account?</a>
          </button>
          <button className={styles.starterButton}>
            <B3 weight="medium">Your net income last month was $10,000.</B3>
            <a>Summarize last month's profit and loss</a>
          </button>
          <button className={styles.starterButton}>
            <B3 weight="medium">Find ways to simplify bookkeeping.</B3>
            <a>How can I optimize my accounting?</a>
          </button>
        </StackLayout>
      </StackLayout>

      <StackLayout gap={4} className={styles.inputContainer}>
        <ClusterLayout
          nowrap
          justifyContent="spaceBetween"
          className={styles.input + ' agent-gradient'}
        >
          <ClusterLayout nowrap>
            <Plus size="small" />
            <B2>Ask anything</B2>
          </ClusterLayout>
          <Microphone size="small" />
        </ClusterLayout>
        <B4>
          Intuit Intelligence can make mistakes. Intuit protects privacy and adheres to responsible
          AI principles. How we use AI.
        </B4>
      </StackLayout>
    </div>
  )
}

export default OmniPanel
