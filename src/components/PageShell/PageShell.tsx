import { ReactNode, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { CommentPencil, MapSigns, PlayFill, Expand, NewWindow, Book } from '@design-systems/icons'
import { getRouteLabels } from '../../data/appNavigationSections'
import { useFusion } from '../../contexts/fusion'
import styles from './PageShell.module.css'

const formatSegment = (segment: string) =>
  segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

interface PageShellProps {
  /** Override breadcrumb text (auto-generated from route if omitted) */
  breadcrumb?: string
  /** Override page title (auto-generated from route if omitted) */
  pageTitle?: string
  /** Content to render in the main content area */
  children: ReactNode
  /** Optional tertiary button text */
  tertiaryButtonText?: string
  /** Optional tertiary button click handler */
  onTertiaryClick?: () => void
  /** Optional secondary button text */
  secondaryButtonText?: string
  /** Optional secondary button click handler */
  onSecondaryClick?: () => void
  /** Optional primary button text */
  primaryButtonText?: string
  /** Optional primary button click handler */
  onPrimaryClick?: () => void
  /** Show/hide utility icons (Feedback, Tour, Tutorial, etc.) */
  showUtilityIcons?: boolean
}

const PageShell = ({
  breadcrumb: breadcrumbOverride,
  pageTitle: pageTitleOverride,
  children,
  tertiaryButtonText,
  onTertiaryClick,
  secondaryButtonText,
  onSecondaryClick,
  primaryButtonText,
  onPrimaryClick,
  showUtilityIcons = true,
}: PageShellProps) => {
  const location = useLocation()
  const { pathPrefix } = useFusion()
  const pathParts = location.pathname.split('/').filter(Boolean)

  const routeLabels = useMemo(
    () => getRouteLabels(location.pathname, pathPrefix),
    [location.pathname, pathPrefix],
  )

  const pageTitle =
    pageTitleOverride ??
    routeLabels?.pageLabel ??
    formatSegment(pathParts[pathParts.length - 1] || 'Home')

  const breadcrumbLink = routeLabels ? `${pathPrefix}/app/${routeLabels.sectionId}` : null
  const breadcrumbText =
    breadcrumbOverride ?? routeLabels?.sectionLabel ?? formatSegment(pathParts[0] || 'Home')

  const hasActions = tertiaryButtonText || secondaryButtonText || primaryButtonText

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageHeader}>
        <div className={styles.headerTopRow}>
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            {breadcrumbLink ? (
              <>
                <Link to={breadcrumbLink} className={styles.breadcrumbLink}>
                  {breadcrumbText}
                </Link>
                <span className={styles.breadcrumbSeparator} aria-hidden="true">
                  /
                </span>
                <span className={styles.breadcrumbCurrent} aria-current="page">
                  {pageTitle}
                </span>
              </>
            ) : (
              <span className={styles.breadcrumbCurrent}>{breadcrumbText}</span>
            )}
          </nav>

          {showUtilityIcons && (
            <div className={styles.utilityIcons}>
              <div className={styles.utilityItem}>
                <IconControl aria-label="Feedback" size="small">
                  <CommentPencil size="small" />
                </IconControl>
                <span className={styles.utilityLabel}>Feedback</span>
              </div>
              <div className={styles.utilityItem}>
                <IconControl aria-label="Tour" size="small">
                  <MapSigns size="small" />
                </IconControl>
                <span className={styles.utilityLabel}>Tour</span>
              </div>
              <div className={styles.utilityItem}>
                <IconControl aria-label="Tutorial" size="small">
                  <PlayFill size="small" />
                </IconControl>
                <span className={styles.utilityLabel}>Tutorial</span>
              </div>
              <IconControl aria-label="Documentation" size="small">
                <Book size="small" />
              </IconControl>
              <IconControl aria-label="Open in new window" size="small">
                <NewWindow size="small" />
              </IconControl>
              <IconControl aria-label="Fullscreen" size="small">
                <Expand size="small" />
              </IconControl>
            </div>
          )}
        </div>

        <div className={styles.headerBottomRow}>
          <h1 className={styles.pageTitle}>{pageTitle}</h1>

          {hasActions && (
            <div className={styles.actionButtons}>
              {tertiaryButtonText && (
                <Button priority="tertiary" onClick={onTertiaryClick}>
                  {tertiaryButtonText}
                </Button>
              )}
              {secondaryButtonText && (
                <Button priority="secondary" onClick={onSecondaryClick}>
                  {secondaryButtonText}
                </Button>
              )}
              {primaryButtonText && (
                <Button priority="primary" onClick={onPrimaryClick}>
                  {primaryButtonText}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={styles.pageContent}>{children}</div>
    </div>
  )
}

export default PageShell
