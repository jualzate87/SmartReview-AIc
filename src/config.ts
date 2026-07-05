const STORAGE_KEY = 'ids-prototype-config'

export interface PrototypeConfig {
  theme: string
  libraries: string[]
  completedAt: string
}

export const THEME_OPTIONS = [
  {
    id: 'intuit',
    name: 'Intuit',
    description: 'The base Intuit design system theme. Used across core Intuit products.',
    dataTheme: 'intuit',
  },
  {
    id: 'intuitaccountantsuite',
    name: 'Intuit Accountant Suite',
    description: 'Tailored for accountant-facing products and workflows.',
    dataTheme: 'intuitaccountantsuite',
  },
  {
    id: 'intuitenterprisesuite',
    name: 'Intuit Enterprise Suite',
    description: 'Designed for enterprise-scale products and experiences.',
    dataTheme: 'intuitenterprisesuite',
  },
  {
    id: 'gbsgexperimental',
    name: 'GBSG Experimental',
    description: 'An experimental theme for exploring new design directions.',
    dataTheme: 'gbsgexperimental',
  },
] as const

export const LIBRARY_OPTIONS = [
  {
    id: 'ids-core',
    name: 'IDS Core',
    description: 'The base @ids-ts/* component library. Always included.',
    available: true,
    required: true,
  },
  {
    id: 'templado',
    name: 'Templado',
    description: 'Template-driven layouts and page patterns.',
    available: false,
    required: false,
  },
  {
    id: 'genux',
    name: 'GenUX',
    description: 'Generative UX components and AI-powered patterns.',
    available: true,
    required: false,
  },
  {
    id: 'appshell',
    name: 'AppShell',
    description: 'Application shell framework with navigation and chrome.',
    available: true,
    required: false,
  },
] as const

export function getConfig(): PrototypeConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PrototypeConfig
  } catch {
    return null
  }
}

export function saveConfig(config: PrototypeConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function applyTheme(themeId: string): void {
  document.documentElement.setAttribute('data-theme', themeId)
}
