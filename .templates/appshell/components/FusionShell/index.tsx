import styles from './FusionShell.module.css'
import ClusterLayout from '../ClusterLayout'
import {
  BookmarkThin as Bookmark,
  ChartLineThin as ChartLine,
  CirclePlusThin as CirclePlus,
  ClipboardCheckThin as ClipboardCheck,
  DotsNineThin as DotsNine,
  NotificationThin as Notification,
  SettingsThin as Settings,
  CircleQuestionThin as CircleQuestion,
  HomeThin as Home,
  ThirdPartyIntegrationThin as ThirdPartyIntegration,
  SlidersHThin,
  IntuitAssistThin,
} from '@design-systems/icons'
import FusionSearch from './FusionSearch'
import BallLogo from '../../assets/qbo_ball_logo.svg'
import WordmarkLogo from '../../assets/qbo_wordmark_black.svg'
import SubNav from './SubNav'
import cx from 'classnames'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { useFusion } from '../../contexts/fusion'
import { useRef } from 'react'
import { B3, B4 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import Avatar from '../Avatar'
import StackLayout from '../StackLayout'
import FusionPopoverNavItem from './FusionPopoverNavItem'
import { FloatingTree } from '@floating-ui/react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import FusionOmniNavButton from '../OmniPanel/OmniNavItem'
import FusionAppStoreIcon from './FusionAppStoreIcon'
import OmniPanel from '../OmniPanel'
import GlobalCreate from '../GlobalCreate'

function FusionShell({
  children,
  businessName = 'Business Name',
}: {
  children: React.ReactNode
  businessName?: string
}) {
  const { sidePanelOpen, subNavOpen, pathPrefix } = useFusion()
  const location = useLocation()
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)

  return (
    <FloatingTree>
      <main
        className={cx(styles.root, {
          [styles.sidePanelOpen]: sidePanelOpen,
          [styles.subNavClosed]: !subNavOpen,
        })}
        data-subnav-closed={!subNavOpen}
      >
        <ClusterLayout justifyContent="spaceBetween" className={styles.header} nowrap>
          <ClusterLayout nowrap>
            <Link to={pathPrefix || '/'} className={styles.logo}>
              <img aria-hidden="true" src={BallLogo} alt="Intuit QuickBooks Online" />
              <img aria-hidden="true" src={WordmarkLogo} alt="Quickbooks" />
            </Link>
            <B3 weight="demi" className={styles.businessName}>
              {businessName}
            </B3>
          </ClusterLayout>
          <FusionSearch />
          <ClusterLayout className={styles.headerRight} gap={4} nowrap>
            <IconControl aria-label="Tasks">
              <ClipboardCheck />
            </IconControl>
            <IconControl aria-label="Integrations">
              <ThirdPartyIntegration />
            </IconControl>
            <IconControl aria-label="Notifications">
              <Notification />
            </IconControl>
            <IconControl aria-label="Settings">
              <Settings />
            </IconControl>
            <IconControl aria-label="Help">
              <CircleQuestion />
            </IconControl>
            <Avatar size="xsmall" name="J" color="blue" />
            <FusionOmniNavButton />
          </ClusterLayout>
        </ClusterLayout>

        <ClusterLayout className={styles.main} gap={0}>
          <ClusterLayout
            className={styles.mainContent}
            gap={0}
            alignItems="flexStart"
            justifyContent="flexStart"
          >
            <div className={styles.navContainer} ref={rootRef}>
              <StackLayout gap={1} className={styles.nav}>
                <FusionPopoverNavItem popover={<GlobalCreate />}>
                  <button className={styles.button}>
                    <span className={styles.buttonIcon}>
                      <CirclePlus />
                    </span>
                    <B4 weight="medium">Create</B4>
                  </button>
                </FusionPopoverNavItem>
                <button className={styles.button}>
                  <span className={styles.buttonIcon}>
                    <Bookmark />
                  </span>
                  <B4 weight="medium">Bookmarks</B4>
                </button>
                <button
                  onClick={() => navigate(pathPrefix || '/')}
                  className={cx(styles.button, {
                    [styles.buttonActive]:
                      location.pathname.replace(/\/$/, '') ===
                        (pathPrefix || '/').replace(/\/$/, '') ||
                      (pathPrefix !== '/' && location.pathname === pathPrefix),
                  })}
                >
                  <span className={styles.buttonIcon}>
                    <Home />
                  </span>
                  <B4 weight="medium">Home</B4>
                </button>
                <button
                  onClick={() => navigate((pathPrefix || '') + '/feed')}
                  className={cx(styles.button, {
                    [styles.buttonActive]: location.pathname.startsWith(
                      (pathPrefix || '') + '/feed',
                    ),
                  })}
                >
                  <span className={styles.buttonIcon}>
                    <IntuitAssistThin />
                  </span>
                  <B4 weight="medium">Feed</B4>
                </button>
                <button className={styles.button}>
                  <span className={styles.buttonIcon}>
                    <ChartLine />
                  </span>
                  <B4 weight="medium">Reports</B4>
                </button>
                <button className={styles.button}>
                  <span className={styles.buttonIcon}>
                    <FusionAppStoreIcon />
                  </span>
                  <B4 weight="medium">App Store</B4>
                </button>

                <FusionPopoverNavItem
                  popover={<SubNav floating />}
                  className={cx(styles.button, {
                    [styles.buttonActive]: location.pathname.startsWith(
                      (pathPrefix || '') + '/app',
                    ),
                  })}
                >
                  <span className={styles.buttonIcon}>
                    <DotsNine />
                  </span>
                  <B4 weight="medium">All apps</B4>
                </FusionPopoverNavItem>
                <div className={styles.settingsButton}>
                  <button className={styles.button}>
                    <span className={styles.buttonIcon}>
                      <SlidersHThin />
                    </span>
                    <B4 weight="medium">Customize</B4>
                  </button>
                </div>
              </StackLayout>
              <SubNav />
            </div>
            <div className={styles.mainContentInner}>{children}</div>
            <div
              aria-hidden={!sidePanelOpen}
              className={cx(styles.sidePanel, {
                [styles.sidePanelOpen]: sidePanelOpen,
              })}
            >
              <OmniPanel />
            </div>
          </ClusterLayout>
        </ClusterLayout>
      </main>
    </FloatingTree>
  )
}

export default FusionShell
