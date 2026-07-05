import { useEffect, useState } from 'react'
import styles from './FusionSubNav.module.css'
import { Bookmark, ChevronDown, ChevronRight, Diamond, MenuCollapse } from '@design-systems/icons'
import ClusterLayout from '../ClusterLayout'
// eslint-disable-next-line no-restricted-imports
import cx from 'classnames'
import { useLocation, useNavigate } from 'react-router-dom'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { useFusion } from '../../contexts/fusion'
import { B3, B4 } from '@ids-ts/typography'
import '@ids-ts/typography/dist/main.css'
import FusionPopoverNavItem from './FusionPopoverNavItem'
import Portal from '../Portal'
import { appNavigationSections, getActiveSection } from '../../data/appNavigationSections'

function SubNavLinks({
  links,
  pathPrefix,
  className,
  floating,
}: {
  links: { name: string; link: string }[]
  pathPrefix: string
  className?: string
  floating?: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [urlActiveLink, setUrlActiveLink] = useState<string | undefined>(undefined)

  function onLinkClick(link: string) {
    navigate(`${pathPrefix}/app${link}`)
  }

  useEffect(() => {
    const raw = pathPrefix === '/' ? location.pathname : location.pathname.replace(pathPrefix, '')
    const pathNorm = raw.startsWith('/') ? raw : '/' + raw
    setUrlActiveLink(links.find((link) => pathNorm.includes(link.link))?.name)
  }, [location.pathname, links, pathPrefix])

  return (
    <ul className={cx(styles.subNavLinks, className)} key={'subnav-' + links.length}>
      {links.map((link) => (
        <li key={link.name + '-' + link.link + '-subnav'}>
          <button
            onClick={() => onLinkClick(link.link)}
            className={cx(styles.subNavLink, {
              [styles.subNavLinkActive]: urlActiveLink === link.name,
              [styles.subNavLinkSub]: true,
              [styles.subNavLinkSubFloating]: floating,
            })}
          >
            <B3 weight="medium" className={styles.subNavLinkText}>
              {link.name}
            </B3>
            {!floating && <Bookmark size={'xsmall'} />}
          </button>
        </li>
      ))}
    </ul>
  )
}

function SubNavSection({
  section,
  links,
  activeSection,
  toggleSection,
  openSections,
  pathPrefix,
  paidUpgrade,
  icon,
  floating,
}: {
  section: string
  links: { name: string; link: string }[]
  activeSection: string | null
  toggleSection: (section: string) => void
  pathPrefix: string
  paidUpgrade?: boolean
  icon: string
  openSections: Set<string>
  floating?: boolean
}) {
  return (
    <FusionPopoverNavItem
      popover={<SubNavLinks links={links} pathPrefix={pathPrefix} floating={floating} />}
      disabled={!floating || paidUpgrade}
      id={`subnav-${section}`}
    >
      <div
        className={cx(styles.subNavSectionContainer, {
          [styles.subNavSectionContainerOpen]: openSections.has(section),
        })}
        key={section}
      >
        <button
          type="button"
          className={cx(styles.subNavLink, {
            [styles.subNavLinkActive]: activeSection === section && !openSections.has(section),
          })}
          onClick={() => toggleSection(section)}
        >
          <ClusterLayout justifyContent="spaceBetween">
            <ClusterLayout>
              <span className={styles.subNavLinkIcon}>
                <img src={icon} alt={section} />
              </span>
              <B3 weight="medium">{section}</B3>
            </ClusterLayout>
            {!paidUpgrade ? (
              !floating ? (
                <ChevronDown
                  className={cx(styles.accordionIcon, {
                    [styles.accordionIconOpen]: openSections.has(section),
                  })}
                  size={'xsmall'}
                />
              ) : (
                <ChevronRight size={'xsmall'} />
              )
            ) : (
              <Diamond size={'xsmall'} />
            )}
          </ClusterLayout>
        </button>
        {!paidUpgrade && !floating && (
          <div
            className={cx(styles.subNavSectionContent, {
              [styles.subNavSectionContentOpen]: openSections.has(section),
            })}
          >
            <SubNavLinks
              links={links}
              pathPrefix={pathPrefix}
              className={floating ? styles.subNavLinksFloating : undefined}
            />
          </div>
        )}
      </div>
    </FusionPopoverNavItem>
  )
}

function SubNav({ floating }: { floating?: boolean }) {
  const { toggleSubNav, subNavOpen, sidePanelOpen, pathPrefix } = useFusion()
  const location = useLocation()
  const activeSection = getActiveSection(location.pathname, pathPrefix)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (activeSection) {
      setOpenSections((prev) => {
        if (prev.has(activeSection)) return prev
        const next = new Set(prev)
        next.add(activeSection)
        return next
      })
    }
  }, [activeSection])

  function toggleSection(section: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }

  return (
    <div
      className={cx(styles.subNav, {
        [styles.subNavOpen]: subNavOpen,
        [styles.sidePanelOpen]: sidePanelOpen,
        [styles.visible]: true,
        [styles.floating]: floating,
      })}
    >
      {!floating && (
        <ClusterLayout justifyContent="spaceBetween" nowrap className={styles.header}>
          <B4 weight="demi">All Apps</B4>
          <Portal id="subnav-toggle">
            <div
              className={cx(styles.subnavToggle, {
                [styles.subNavOpen]: subNavOpen,
                [styles.hidden]: !location.pathname.includes('/app'),
              })}
            >
              <IconControl aria-label="Toggle subnav" onClick={toggleSubNav}>
                <MenuCollapse size={'small'} />
              </IconControl>
            </div>
          </Portal>
        </ClusterLayout>
      )}
      <nav>
        {appNavigationSections.map((section) => (
          <SubNavSection
            key={section.id}
            section={section.label}
            links={section.links}
            pathPrefix={pathPrefix}
            openSections={openSections}
            icon={section.icon}
            activeSection={activeSection}
            toggleSection={toggleSection}
            paidUpgrade={section.paidUpgrade}
            floating={floating}
          />
        ))}
      </nav>
    </div>
  )
}

export default SubNav
