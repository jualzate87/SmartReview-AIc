/** Output forms / schedules shown beside the 1040 Summary in the left panel. */

export type OutputFormId =
  | 'summary'
  | '1040'
  | 'sch1'
  | 'schC'
  | 'schA'
  | 'schD'
  | 'f8960'
  | 'f2210'

export const OUTPUT_FORM_OPTIONS: { id: OutputFormId; label: string; shortLabel: string }[] = [
  { id: 'summary', label: 'Return Summary', shortLabel: 'Summary' },
  { id: '1040', label: 'Form 1040', shortLabel: '1040' },
  { id: 'sch1', label: 'Schedule 1 — Additional Income', shortLabel: 'Sch 1' },
  { id: 'schC', label: 'Schedule C — Business', shortLabel: 'Sch C' },
  { id: 'schA', label: 'Schedule A — Itemized Deductions', shortLabel: 'Sch A' },
  { id: 'schD', label: 'Schedule D — Capital Gains', shortLabel: 'Sch D' },
  { id: 'f8960', label: 'Form 8960 — NIIT', shortLabel: '8960' },
  { id: 'f2210', label: 'Form 2210 — Underpayment', shortLabel: '2210' },
]

/** Map Phase 2 openForm actions → left-panel form id. */
export const OPEN_FORM_TO_OUTPUT: Record<string, OutputFormId> = {
  'Form 8960': 'f8960',
  'Open Form 8960': 'f8960',
  'Form 2210': 'f2210',
  'Open Form 2210': 'f2210',
  'Schedule C': 'schC',
  'Open Schedule C': 'schC',
  'Schedule A': 'schA',
  'Open Schedule A': 'schA',
  'Form 1098': 'schA',
  'Open Form 1098': 'schA',
  'Schedule 1': 'sch1',
  'Schedule D': 'schD',
  'Form 1040': '1040',
}

export function resolveOutputFormFromAction(label?: string, note?: string): OutputFormId | null {
  if (label && OPEN_FORM_TO_OUTPUT[label]) return OPEN_FORM_TO_OUTPUT[label]
  const hay = `${label ?? ''} ${note ?? ''}`.toLowerCase()
  if (hay.includes('8960')) return 'f8960'
  if (hay.includes('2210')) return 'f2210'
  if (hay.includes('schedule c') || hay.includes('sch c')) return 'schC'
  if (hay.includes('schedule a') || hay.includes('1098')) return 'schA'
  if (hay.includes('schedule d')) return 'schD'
  if (hay.includes('schedule 1')) return 'sch1'
  if (hay.includes('1040')) return '1040'
  return null
}
