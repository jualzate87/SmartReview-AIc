import styles from '../../styles/data-review/DetailFields.module.css'

const FIELDS: { section?: string; line?: string; label?: string; amount?: string; bold?: boolean }[] = [
  { section: 'INCOME' },
  { line: '1a',  label: 'Total wages, salaries, tips (W-2)',       amount: '118,940' },
  { line: '1z',  label: 'Add lines 1a–1h',                         amount: '118,940' },
  { line: '2a',  label: 'Tax-exempt interest',                      amount: '180' },
  { line: '2b',  label: 'Taxable interest',                         amount: '1,986' },
  { line: '3a',  label: 'Qualified dividends',                      amount: '187,500' },
  { line: '3b',  label: 'Ordinary dividends',                       amount: '331,250' },
  { line: '7',   label: 'Capital gain or (loss)',                   amount: '194,600' },
  { line: '9',   label: 'Total income',                             amount: '646,776', bold: true },
  { section: 'ADJUSTMENTS TO INCOME' },
  { line: '11',  label: 'Adjusted gross income',                    amount: '646,776', bold: true },
  { section: 'DEDUCTIONS' },
  { line: '12',  label: 'Standard deduction',                       amount: '14,600' },
  { line: '15',  label: 'Taxable income',                           amount: '632,176', bold: true },
  { section: 'TAX AND CREDITS' },
  { line: '16',  label: 'Tax (see instructions)',                   amount: '120,410' },
  { line: '24',  label: 'Total tax',                                amount: '138,120', bold: true },
  { section: 'PAYMENTS' },
  { line: '25a', label: 'Federal income tax withheld (W-2)',        amount: '15,840' },
  { line: '25b', label: 'Federal income tax withheld (1099s)',      amount: '24,925' },
  { line: '25d', label: 'Total withholding',                        amount: '40,765' },
  { line: '33',  label: 'Total payments',                           amount: '40,765', bold: true },
  { line: '37',  label: 'Amount you owe',                           amount: '97,355' },
]

export default function PriorYear1040Fields() {
  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Prior Year 1040 (2024) — Jessica Drake</h2>
      </div>
      <div className={styles.inputContainer}>
        {FIELDS.map((row, i) => {
          if (row.section) {
            return <div key={i} className={styles.sectionHeader}>{row.section}</div>
          }
          return (
            <div key={i} className={styles.fieldRow}>
              <span className={styles.fieldLabel} style={row.bold ? { fontWeight: 600 } : undefined}>
                {row.line}&nbsp;&nbsp;{row.label}
              </span>
              <input
                className={styles.fieldInput}
                readOnly
                value={row.amount}
                style={row.bold ? { fontWeight: 600 } : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
