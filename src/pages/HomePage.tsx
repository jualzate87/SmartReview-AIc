import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getConfig, applyTheme } from '../config'

export default function HomePage() {
  const navigate = useNavigate()

  useEffect(() => {
    const config = getConfig()
    if (config) {
      applyTheme(config.theme)
      navigate('/workspace', { replace: true })
    } else {
      navigate('/onboarding', { replace: true })
    }
  }, [navigate])

  return null
}
