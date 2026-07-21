/**
 * Flyout content for Schedule / Form 8960 / 2210 output lines.
 * Same TaxControlDocPopover chrome as Summary — sources open docs from the flyout.
 */
import type { LiveAmounts, LiveReturnTotals } from './liveReturn'
import { NIIT_AGI_THRESHOLD, SAFE_HARBOR_2210, SEED_AMOUNTS } from './liveReturn'
import { getFieldOrigin } from './fieldOrigins'
import type { OutputFormId } from '../pages/data-review/outputForms'

export type ScheduleFlyoutItem = {
  id: string
  label: string
  amount?: number
  docId?: string
  note?: string
}

export type ScheduleFlyout = {
  label: string
  mode: 'source' | 'calc' | 'info'
  items: ScheduleFlyoutItem[]
  sumLabel?: string
  sumValue?: number
  footnote?: string
  /** Maps docId → Details field key for highlight navigation */
  detailByDocId?: Record<string, string>
}

function from1040Origin(
  fieldId: string,
  live: LiveReturnTotals,
  amounts: LiveAmounts,
  labelOverride?: string,
): ScheduleFlyout | null {
  const origin = getFieldOrigin(fieldId, live, amounts)
  if (!origin) return null

  if (origin.sources && origin.sources.length > 0) {
    const detailByDocId: Record<string, string> = {}
    const items: ScheduleFlyoutItem[] = origin.sources.map(s => {
      detailByDocId[s.docId] = s.detailFieldId
      return {
        id: `${s.docId}-${s.detailFieldId}`,
        label: s.box ? `${s.label} · ${s.box}` : s.label,
        amount: s.amount,
        docId: s.docId,
      }
    })
    return {
      label: labelOverride ?? origin.label,
      mode: 'source',
      items,
      detailByDocId,
      sumLabel: 'Total from sources',
    }
  }

  if (origin.calc?.components?.length) {
    return {
      label: labelOverride ?? origin.label,
      mode: 'calc',
      items: origin.calc.components.map((c, i) => ({
        id: `calc-${i}`,
        label: c.label,
        amount: c.amount,
      })),
      sumLabel: 'Total from lines',
      sumValue: origin.calc.total,
      footnote: origin.calc.footnote ?? origin.note,
    }
  }

  if (origin.note) {
    return {
      label: labelOverride ?? origin.label,
      mode: 'info',
      items: [{ id: 'note', label: 'Note', note: origin.note }],
    }
  }

  return null
}

function info(label: string, note: string, amount?: number): ScheduleFlyout {
  const items: ScheduleFlyoutItem[] = [{ id: 'note', label: 'Note', note }]
  if (amount !== undefined) {
    items.push({ id: 'cy', label: 'Current year (2025)', amount })
  }
  return {
    label,
    mode: 'info',
    items,
    sumLabel: amount !== undefined ? 'Amount' : undefined,
    sumValue: amount,
  }
}

function calc(
  label: string,
  components: { label: string; amount: number }[],
  total: number,
  footnote?: string,
): ScheduleFlyout {
  return {
    label,
    mode: 'calc',
    items: components.map((c, i) => ({ id: `c-${i}`, label: c.label, amount: c.amount })),
    sumLabel: 'Total from lines',
    sumValue: total,
    footnote,
  }
}

function source(
  label: string,
  docs: { docId: string; label: string; amount: number; detailFieldId: string }[],
  sumLabel = 'Total from sources',
): ScheduleFlyout {
  const detailByDocId: Record<string, string> = {}
  const items: ScheduleFlyoutItem[] = docs.map(d => {
    detailByDocId[d.docId] = d.detailFieldId
    return {
      id: `${d.docId}-${d.detailFieldId}`,
      label: d.label,
      amount: d.amount,
      docId: d.docId,
    }
  })
  return { label, mode: 'source', items, detailByDocId, sumLabel }
}

/** Unique line keys used by OutputFormViews LineRow `fieldId`. */
export function getScheduleLineFlyout(
  formId: OutputFormId,
  fieldId: string,
  live: LiveReturnTotals,
  amounts: LiveAmounts,
): ScheduleFlyout | null {
  switch (formId) {
    case 'sch1':
      return sch1Flyout(fieldId, live, amounts)
    case 'schC':
      return schCFlyout(fieldId, live, amounts)
    case 'schA':
      return schAFlyout(fieldId, live, amounts)
    case 'schD':
      return schDFlyout(fieldId, live)
    case 'f8960':
      return f8960Flyout(fieldId, live, amounts)
    case 'f2210':
      return f2210Flyout(fieldId, live)
    default:
      return null
  }
}

function sch1Flyout(fieldId: string, live: LiveReturnTotals, _amounts: LiveAmounts): ScheduleFlyout | null {
  switch (fieldId) {
    case 'sch1-3':
      return calc(
        'Business income (Schedule C)',
        [
          { label: 'Schedule C · Line 31 — Net profit', amount: live.schCNetProfit },
        ],
        live.schedule1BusinessIncome,
        live.necOnReturn
          ? 'Flows to Form 1040 line 8 via Schedule 1 line 10.'
          : 'No Schedule C income on the return yet — confirm 1099-NEC first.',
      )
    case 'sch1-8':
      return info(
        'Other income',
        'NEC nonemployee compensation flows through Schedule C (line 3), not Schedule 1 line 8 on this return.',
        0,
      )
    case 'sch1-10':
      return calc(
        'Total additional income',
        [{ label: 'Line 3 — Business income', amount: live.schedule1BusinessIncome }],
        live.schedule1BusinessIncome,
        'To Form 1040, line 8.',
      )
    case 'sch1-15':
      return calc(
        'Deductible part of SE tax',
        [{ label: '½ × Schedule SE tax', amount: Math.round(live.seTax / 2) }],
        Math.round(live.seTax / 2),
        live.seTax > 0 ? undefined : 'No SE tax until net profit is at least $400.',
      )
    default:
      return info('Schedule 1', 'No amount on this line for this return.', 0)
  }
}

function schCFlyout(fieldId: string, live: LiveReturnTotals, amounts: LiveAmounts): ScheduleFlyout | null {
  const office = Math.round(amounts.schCExpenses * 0.35)
  const supplies = Math.round(amounts.schCExpenses * 0.25)
  const travel = Math.round(amounts.schCExpenses * 0.4)

  switch (fieldId) {
    case 'schC-1':
      return live.necOnReturn
        ? source('Gross receipts', [
            {
              docId: '1099-nec-summit',
              label: 'Summit Advisory Partners (1099-NEC) · Box 1',
              amount: live.schCGross,
              detailFieldId: 'nec-box1',
            },
          ])
        : info(
            'Gross receipts',
            'Confirm 1099-NEC Box 1 onto the return to populate Schedule C gross receipts.',
            live.schCGross,
          )
    case 'schC-3':
    case 'schC-5':
      return calc(
        fieldId === 'schC-5' ? 'Gross profit' : 'Gross receipts after returns',
        [
          { label: 'Line 1 — Gross receipts', amount: live.schCGross },
          { label: 'Line 2 — Returns and allowances', amount: 0 },
        ],
        live.schCGross,
      )
    case 'schC-18':
      return info(
        'Office expense',
        'Portion of client-confirmed Schedule C expenses (software / workspace). Not from a source PDF in this packet.',
        office,
      )
    case 'schC-22':
      return info(
        'Supplies',
        'Portion of client-confirmed Schedule C expenses. Not from a source PDF in this packet.',
        supplies,
      )
    case 'schC-24a':
      return info(
        'Travel',
        'Portion of client-confirmed Schedule C expenses. Not from a source PDF in this packet.',
        travel,
      )
    case 'schC-28':
      return calc(
        'Total expenses',
        [
          { label: 'Line 18 — Office expense', amount: office },
          { label: 'Line 22 — Supplies', amount: supplies },
          { label: 'Line 24a — Travel', amount: travel },
        ],
        live.schCExpenses,
        'Edit the expense total from 1099-NEC review / questionnaire follow-up.',
      )
    case 'schC-31':
      return calc(
        'Net profit (or loss)',
        [
          { label: 'Line 5 — Gross profit', amount: live.schCGross },
          { label: 'Line 28 — Total expenses', amount: live.schCExpenses },
        ],
        live.schCNetProfit,
        'To Schedule 1, line 3 → Form 1040, line 8.',
      )
    case 'schC-SE':
      return calc(
        'Self-employment tax',
        [
          { label: 'Net profit × 92.35% × 15.3% (approx.)', amount: live.seTax },
        ],
        live.seTax,
        live.seTax > 0
          ? 'SE tax applies when net profit is at least $400.'
          : 'No SE tax until net profit is at least $400.',
      )
    default:
      return info('Schedule C', 'No amount on this line for this return.', 0)
  }
}

function schAFlyout(fieldId: string, live: LiveReturnTotals, amounts: LiveAmounts): ScheduleFlyout | null {
  const saltIncome = Math.round(amounts.saltTaxes * 0.55)
  const saltRe = Math.round(amounts.saltTaxes * 0.45)
  const saltCapped = Math.min(amounts.saltTaxes, 10_000)

  switch (fieldId) {
    case 'schA-5a':
      return info(
        'State and local income / sales taxes',
        'Estimated SALT income/sales tax portion used on this return.',
        saltIncome,
      )
    case 'schA-5b':
      return info(
        'State and local real estate taxes',
        'Estimated real estate tax portion used on this return.',
        saltRe,
      )
    case 'schA-5e':
      return calc(
        'SALT deduction (capped)',
        [
          { label: 'Line 5a — Income / sales taxes', amount: saltIncome },
          { label: 'Line 5b — Real estate taxes', amount: saltRe },
        ],
        saltCapped,
        'Federal SALT cap is $10,000.',
      )
    case 'schA-8a':
      return amounts.mortgageInterest > 0
        ? info(
            'Home mortgage interest',
            'From Form 1098 (mortgage interest). Open source documents from Inputs if available.',
            amounts.mortgageInterest,
          )
        : info(
            'Home mortgage interest',
            'Form 1098 is not in this packet — client confirmed mortgage interest was paid.',
            amounts.mortgageInterest,
          )
    case 'schA-11':
      return info(
        'Gifts to charity',
        'Cash/check charitable contributions claimed on Schedule A.',
        amounts.charitableContributions,
      )
    case 'schA-17':
      return calc(
        'Total itemized deductions',
        [
          { label: 'Line 5e — SALT (capped)', amount: saltCapped },
          { label: 'Line 8a — Mortgage interest', amount: amounts.mortgageInterest },
          { label: 'Line 11 — Charitable gifts', amount: amounts.charitableContributions },
        ],
        live.itemizedDeduction,
      )
    case 'schA-std':
      return calc(
        'Standard deduction (single)',
        [{ label: 'Single filer (2025)', amount: live.stdDeduction }],
        live.stdDeduction,
      )
    case 'schA-method':
      return info(
        live.deductionMethod === 'itemized' ? 'Using itemized deductions' : 'Using standard deduction',
        live.deductionMethod === 'itemized'
          ? 'Itemized total is larger than the standard deduction, so Schedule A is used on Form 1040 line 12.'
          : 'Standard deduction is larger than itemized, so Form 1040 line 12 uses the standard deduction.',
        live.deductionTaken,
      )
    default:
      return info('Schedule A', 'No amount on this line for this return.', 0)
  }
}

function schDFlyout(fieldId: string, live: LiveReturnTotals): ScheduleFlyout | null {
  switch (fieldId) {
    case 'schD-16':
      return from1040Origin('capitalGain', live, SEED_AMOUNTS, 'Combined net capital gain (or loss)')
        ?? info(
          'Combined net capital gain (or loss)',
          live.capitalGain === 0
            ? 'No 1099-B / Form 8949 in packet — prior year had $126,750 capital gain. Flows to Form 1040, line 7 when present.'
            : 'To Form 1040, line 7.',
          live.capitalGain,
        )
    case 'schD-7':
    case 'schD-15':
      return info(
        fieldId === 'schD-7' ? 'Net short-term capital gain (or loss)' : 'Net long-term capital gain (or loss)',
        'No Form 8949 activity on this return.',
        0,
      )
    default:
      return info('Schedule D', 'No capital gain or loss activity on this return.', 0)
  }
}

function f8960Flyout(fieldId: string, live: LiveReturnTotals, amounts: LiveAmounts): ScheduleFlyout | null {
  const over = live.totalIncome > NIIT_AGI_THRESHOLD
  const excess = Math.max(0, live.totalIncome - NIIT_AGI_THRESHOLD)

  switch (fieldId) {
    case 'f8960-1':
      return from1040Origin('taxableInterest', live, amounts, 'Taxable interest')
    case 'f8960-2':
      return from1040Origin('ordinaryDivs', live, amounts, 'Ordinary dividends')
    case 'f8960-5a':
      return from1040Origin('capitalGain', live, amounts, 'Net gain from disposition of property')
        ?? info('Net gain from disposition of property', 'No capital gain on this return.', live.capitalGain)
    case 'f8960-8':
      return calc(
        'Total investment income',
        [
          { label: 'Line 1 — Taxable interest', amount: live.taxableInterest },
          { label: 'Line 2 — Ordinary dividends', amount: live.ordinaryDivs },
          { label: 'Line 5a — Capital gain', amount: live.capitalGain },
        ],
        live.netInvestmentIncome,
      )
    case 'f8960-13':
      return calc(
        'Modified AGI',
        [{ label: 'Form 1040 · Total income (approx. MAGI)', amount: live.totalIncome }],
        live.totalIncome,
        `Single filer NIIT threshold: $${NIIT_AGI_THRESHOLD.toLocaleString()}.`,
      )
    case 'f8960-14':
      return info('Threshold amount', `Single filer threshold for NIIT.`, NIIT_AGI_THRESHOLD)
    case 'f8960-15':
      return calc(
        'MAGI over threshold',
        [
          { label: 'Line 13 — Modified AGI', amount: live.totalIncome },
          { label: 'Line 14 — Threshold', amount: NIIT_AGI_THRESHOLD },
        ],
        excess,
      )
    case 'f8960-16':
      return calc(
        'Net investment income subject to tax',
        [
          { label: 'Line 8 — Investment income', amount: live.netInvestmentIncome },
          { label: 'Line 15 — MAGI over threshold', amount: excess },
        ],
        over ? live.netInvestmentIncome : 0,
        over ? 'Smaller of line 8 or 15.' : 'AGI is below the threshold — NIIT is $0.',
      )
    case 'f8960-17':
      return calc(
        'Net investment income tax',
        [{ label: 'Line 16 × 3.8%', amount: live.niitTax }],
        live.niitTax,
        over
          ? 'Flows to Form 1040 Schedule 2 / total tax.'
          : 'AGI below threshold — no NIIT on this return.',
      )
    default:
      return info('Form 8960', 'See NIIT worksheet lines above.', 0)
  }
}

function f2210Flyout(fieldId: string, live: LiveReturnTotals): ScheduleFlyout | null {
  switch (fieldId) {
    case 'f2210-1':
      return from1040Origin('totalTax', live, SEED_AMOUNTS, 'Current-year tax')
        ?? calc('Current-year tax', [{ label: 'Form 1040 · Line 24', amount: live.totalTax }], live.totalTax)
    case 'f2210-6':
      return info(
        'Required annual payment (safe harbor)',
        '110% of prior-year (2024) total tax ($102,754).',
        SAFE_HARBOR_2210,
      )
    case 'f2210-9':
      return from1040Origin('totalWithholding', live, SEED_AMOUNTS, 'Income tax withheld')
        ?? calc(
          'Income tax withheld',
          [{ label: 'Form 1040 lines 25a–25d', amount: live.totalWithholding }],
          live.totalWithholding,
        )
    case 'f2210-10':
      return info('Estimated tax payments', 'Client confirmed $0 estimated tax payments.', 0)
    case 'f2210-11':
      return calc(
        'Total payments',
        [
          { label: 'Line 9 — Withholding', amount: live.totalWithholding },
          { label: 'Line 10 — Estimated payments', amount: 0 },
        ],
        live.totalWithholding,
      )
    case 'f2210-17':
      return calc(
        'Underpayment',
        [
          { label: 'Line 6 — Required annual payment', amount: SAFE_HARBOR_2210 },
          { label: 'Line 11 — Total payments', amount: live.totalWithholding },
        ],
        live.underpaymentAmount,
        live.underpaymentAmount > 0
          ? 'Payments are below the safe harbor — an underpayment penalty may apply.'
          : 'Payments meet or exceed the safe harbor.',
      )
    default:
      return info('Form 2210', 'Underpayment worksheet line.', 0)
  }
}
