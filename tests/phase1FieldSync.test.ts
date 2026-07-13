import { describe, expect, it } from 'vitest'
import {
  countPhase1FlagsForW2Payer,
  countPhase1FlagsForW2Tab,
  getTabFlagCounts,
  isBox12FlagResolved,
  isPhase1FlagResolved,
  PHASE1_FLAG_KEYS,
} from '../src/pages/data-review/phase1FieldSync'

function reviewed(...keys: string[]) {
  return new Map(keys.map(k => [k, { by: 'test', at: 'now' }]))
}

describe('W-2 Phase 1 flag counting', () => {
  it('counts all four Tech Circle flags when nothing is reviewed', () => {
    const empty = new Map<string, unknown>()
    expect(countPhase1FlagsForW2Payer('techCircle', empty)).toBe(4)
    expect(countPhase1FlagsForW2Tab(empty)).toBe(4)
    expect(getTabFlagCounts(empty).w2s).toBe(4)
  })

  it('drops wages from count when that key is reviewed', () => {
    const fields = reviewed('wages-techCircle')
    expect(countPhase1FlagsForW2Payer('techCircle', fields)).toBe(3)
  })

  it('identifies the remaining flags when wages is done', () => {
    const fields = reviewed('wages-techCircle')
    const w2Flags = PHASE1_FLAG_KEYS.filter(k =>
      ['ssn-techCircle', 'wages-techCircle', 'box12', 'ein-techCircle'].includes(k),
    )
    const unresolved = w2Flags.filter(k => !isPhase1FlagResolved(k, fields))
    expect(unresolved).toEqual(['ssn-techCircle', 'box12', 'ein-techCircle'])
    expect(unresolved.length).toBe(3)
  })

  it('clears box12 when all sub-rows are reviewed', () => {
    const fields = reviewed(
      'box12a-techCircle',
      'box12b-techCircle',
      'box12c-techCircle',
      'box12d-techCircle',
    )
    expect(isBox12FlagResolved(fields)).toBe(true)
    expect(isPhase1FlagResolved('box12', fields)).toBe(true)
    expect(countPhase1FlagsForW2Payer('techCircle', fields)).toBe(3)
  })

  it('clears box12 when the aggregate box12 key is reviewed directly', () => {
    const fields = reviewed('box12')
    expect(isBox12FlagResolved(fields)).toBe(true)
  })

  it('keeps tab and peel-tab counts in sync', () => {
    const fields = reviewed('wages-techCircle')
    const tabCount = getTabFlagCounts(fields).w2s
    const peelCount = countPhase1FlagsForW2Payer('techCircle', fields)
    expect(tabCount).toBe(peelCount)
    expect(tabCount).toBe(3)
  })

  it('hides W-2 badges when all four Phase 1 flags are resolved', () => {
    const fields = reviewed(
      'ssn-techCircle',
      'wages-techCircle',
      'box12',
      'ein-techCircle',
    )
    expect(countPhase1FlagsForW2Tab(fields)).toBe(0)
    expect(getTabFlagCounts(fields).w2s).toBe(0)
  })
})

describe('Phase 1 flag total', () => {
  it('tracks ten import flags across all document types', () => {
    expect(PHASE1_FLAG_KEYS.length).toBe(10)
    const empty = new Map<string, unknown>()
    const total = PHASE1_FLAG_KEYS.filter(k => !isPhase1FlagResolved(k, empty)).length
    expect(total).toBe(10)
    expect(getTabFlagCounts(empty)['1099-rs']).toBe(1)
  })
})
