import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Loop 2 BuildSpec: Jessica Drake (Austin TX) — Phase 2 insights/diagnostics
 * must be federal-only. No state return, state filing, or California diagnostics.
 */
const PHASE2_SOURCE_FILES = [
  'src/pages/data-review/AgentReportPane.tsx',
  'src/pages/data-review/phase1FlagMessages.ts',
  'src/pages/data-review/WelcomePane.tsx',
  'src/pages/data-review/Phase2Banner.tsx',
  'src/pages/data-review/Phase1Banner.tsx',
  'src/pages/data-review/Phase1IssueBanner.tsx',
]

const FORBIDDEN_PATTERNS = [
  /missingStateReturn/i,
  /state return/i,
  /state filing/i,
  /CA state/i,
  /California state/i,
  /state diagnostic/i,
  /State return setup/i,
]

describe('Phase 2 insights — no state return references', () => {
  for (const relPath of PHASE2_SOURCE_FILES) {
    it(`${relPath} has no state-return diagnostic copy`, () => {
      const src = readFileSync(join(process.cwd(), relPath), 'utf8')
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(src).not.toMatch(pattern)
      }
    })
  }

  it('AgentReportPane includes federal Form 2210 and Form 8960 insights', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/pages/data-review/AgentReportPane.tsx'),
      'utf8',
    )
    expect(src).toMatch(/estTaxPenalty/)
    expect(src).toMatch(/niitForm8960/)
    expect(src).toMatch(/Form 2210/)
    expect(src).toMatch(/Form 8960/)
  })

  it('return-summary insights are federal-only (Form 2210 + Form 8960)', () => {
    const src = readFileSync(
      join(process.cwd(), 'src/pages/data-review/phase1FlagMessages.ts'),
      'utf8',
    )
    expect(src).toMatch(/Form 2210/)
    expect(src).toMatch(/Form 8960/)
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(src).not.toMatch(pattern)
    }
  })
})
