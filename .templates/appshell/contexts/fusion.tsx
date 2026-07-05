/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

type FusionContextType = {
  subNavOpen: boolean
  toggleSubNav: () => void
  sidePanelOpen: boolean
  toggleSidePanel: () => void
  /** Base path for the app (matches Router basename); used so pathname comparisons work when deployed under a subpath. */
  pathPrefix: string
}

const FusionContext = createContext<FusionContextType>({
  subNavOpen: false,
  toggleSubNav: () => {},
  sidePanelOpen: false,
  toggleSidePanel: () => {},
  pathPrefix: '/',
})

export function FusionProvider({
  children,
  pathPrefix,
}: {
  children: React.ReactNode
  pathPrefix: string
}) {
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [userHiddenSubNav, setUserHiddenSubNav] = useState(false)
  const location = useLocation()
  const [subNavOpen, setSubNavOpen] = useState(location.pathname !== pathPrefix)

  function toggleSubNav() {
    setUserHiddenSubNav((prev) => !prev)
    setSubNavOpen((prev) => !prev)
  }

  function toggleSidePanel() {
    setSidePanelOpen((prev) => !prev)
  }

  useEffect(() => {
    if ((location.pathname === pathPrefix && subNavOpen) || !location.pathname.includes('/app')) {
      setSubNavOpen(false)
    }
    if (location.pathname.includes('/app') && !subNavOpen && !userHiddenSubNav) {
      setSubNavOpen(true)
    }
  }, [location.pathname, pathPrefix, userHiddenSubNav, subNavOpen])

  return (
    <FusionContext.Provider
      value={{
        subNavOpen,
        toggleSubNav,
        sidePanelOpen,
        toggleSidePanel,
        pathPrefix,
      }}
    >
      {children}
    </FusionContext.Provider>
  )
}

export function useFusion() {
  const context = useContext(FusionContext)
  if (!context) {
    throw new Error('useFusion must be used within a FusionProvider')
  }
  return context
}
