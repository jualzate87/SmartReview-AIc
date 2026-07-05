import { describe, it, expect, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock localStorage — Node.js doesn't provide one
// ---------------------------------------------------------------------------
const storage = new Map<string, string>()
globalThis.localStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => storage.clear(),
  get length() {
    return storage.size
  },
  key: (index: number) => [...storage.keys()][index] ?? null,
} as Storage

// Import after mocking localStorage so the module picks up our mock
import { getConfig, saveConfig, clearConfig, type PrototypeConfig } from '../src/config'

describe('config.ts — saveConfig / getConfig / clearConfig', () => {
  beforeEach(() => {
    storage.clear()
  })

  it('returns null when no config has been saved', () => {
    expect(getConfig()).toBeNull()
  })

  it('round-trips a config through save and get', () => {
    const config: PrototypeConfig = {
      theme: 'intuit',
      libraries: ['ids-core', 'genux'],
      completedAt: '2026-03-11T00:00:00.000Z',
    }

    saveConfig(config)
    const retrieved = getConfig()

    expect(retrieved).toEqual(config)
  })

  it('clearConfig removes the stored config', () => {
    const config: PrototypeConfig = {
      theme: 'intuitenterprisesuite',
      libraries: ['ids-core'],
      completedAt: '2026-03-11T12:00:00.000Z',
    }

    saveConfig(config)
    expect(getConfig()).not.toBeNull()

    clearConfig()
    expect(getConfig()).toBeNull()
  })

  it('overwrites a previously saved config', () => {
    const first: PrototypeConfig = {
      theme: 'intuit',
      libraries: ['ids-core'],
      completedAt: '2026-03-11T00:00:00.000Z',
    }
    const second: PrototypeConfig = {
      theme: 'gbsgexperimental',
      libraries: ['ids-core', 'genux', 'appshell'],
      completedAt: '2026-03-11T01:00:00.000Z',
    }

    saveConfig(first)
    saveConfig(second)

    expect(getConfig()).toEqual(second)
  })

  it('returns null if localStorage contains invalid JSON', () => {
    storage.set('ids-prototype-config', 'not-valid-json{{{')
    expect(getConfig()).toBeNull()
  })
})
