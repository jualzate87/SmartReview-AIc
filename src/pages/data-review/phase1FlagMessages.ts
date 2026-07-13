/**
 * Loop 2 Build Spec Part 3 — Phase 1 flag messages (verbatim for C2/C3 parity).
 */
export const PHASE1_FLAG_MESSAGES = {
  w2: {
    ssn: 'Employee SSN not imported. Required for e-filing. Enter manually.',
    ein: 'Employer EIN not imported. Required for e-filing. Enter manually.',
    box12: 'Box 12 amounts not imported. Codes present, amounts missing. Enter manually.',
    wages: 'Low confidence (72%). Box 1 wages may be misread. Source shows 148,940; return has 118,940.',
  },
  div: {
    fedTaxWithheld: 'Low confidence (68%). Box 4 withholding may be misread. Source shows 26,363; return has 24,925.',
    divCollectibles: 'Collectibles (28%) gain not imported. Review source and enter if applicable.',
    divNonDiv: 'Nondividend distributions not imported. Review source and enter if applicable.',
    ordinaryDivs: 'Low confidence (74%). Ordinary dividends may be misread. Verify against source.',
  },
  int: {
    taxableInterest: 'Low confidence (72%). Box 1 interest may be misread. Verify against source.',
  },
  r: {
    grossDistrib: 'Low confidence (70%). Gross distribution may be misread. Verify against source.',
  },
} as const

/** Loop 2 Build Spec Part 3 — return-summary insights (Phase 2). */
export const RETURN_SUMMARY_INSIGHTS = {
  estTaxPenalty: 'Estimated tax penalty may apply. Review Form 2210.',
  niit: 'Net investment income tax may apply. Review Form 8960.',
} as const
