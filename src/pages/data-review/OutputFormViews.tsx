import type { LiveAmounts, LiveReturnTotals } from '../../data/liveReturn'
import { NIIT_AGI_THRESHOLD, SAFE_HARBOR_2210 } from '../../data/liveReturn'
import { CLIENT_ADDRESS, formatClientCityStateZip } from '../../data/clientAddress'
import type { OutputFormId } from './outputForms'
import styles from '../../styles/data-review/LeftPanel1040.module.css'

function fmt(n: number) {
  return n.toLocaleString('en-US')
}

function FormHeader({
  formCode,
  title,
}: {
  formCode: string
  title: string
}) {
  return (
    <div className={styles.irsHeader}>
      <div className={styles.irsLeft}>
        <div className={styles.irsDept}>Department of the Treasury — Internal Revenue Service</div>
        <div className={styles.irsTitle}>
          Form <strong>{formCode}</strong> {title}
        </div>
      </div>
      <div className={styles.irsRight}>
        <div className={styles.irsYear}>2025</div>
        <div className={styles.irsOmb}>OMB No. 1545-0074</div>
      </div>
    </div>
  )
}

function TaxpayerStrip({ ssn }: { ssn: string }) {
  return (
    <div className={styles.infoGrid}>
      <div className={styles.infoRow}>
        <div className={styles.infoField} style={{ flex: 2 }}>
          <span className={styles.infoLabel}>Name</span>
          <span className={styles.infoValue}>Jessica Drake</span>
        </div>
        <div className={styles.infoField} style={{ flex: 2 }}>
          <span className={styles.infoLabel}>SSN</span>
          <span className={styles.infoValue}>{ssn || '—'}</span>
        </div>
        <div className={styles.infoField} style={{ flex: 3 }}>
          <span className={styles.infoLabel}>Address</span>
          <span className={styles.infoValue}>
            {CLIENT_ADDRESS.street}, {formatClientCityStateZip()}
          </span>
        </div>
      </div>
    </div>
  )
}

function LineRow({
  line,
  label,
  value,
  kind = 'calc',
  bold,
  note,
}: {
  line: string
  label: string
  value: string | number
  kind?: 'source' | 'calc'
  bold?: boolean
  note?: string
}) {
  const display = typeof value === 'number' ? fmt(value) : value
  return (
    <tr className={`${styles.row} ${bold ? styles.rowBold : ''} ${styles.rowClickable}`}>
      <td className={styles.cellLine}>{line}</td>
      <td className={styles.cellLabel}>
        <div className={styles.cellLabelInner}>
          {label}
          {note ? <span style={{ display: 'block', fontSize: 11, color: '#6b6c72', fontWeight: 400 }}>{note}</span> : null}
        </div>
      </td>
      <td className={styles.cellLineRight}>{line}</td>
      <td className={styles.cellValue}>
        <div className={styles.cellValueInner}>
          <div
            className={`${styles.valueBox} ${kind === 'source' ? styles.valueBoxSource : styles.valueBoxCalc}`}
          >
            <span className={`${styles.valueNum} ${kind === 'source' ? styles.valueNumSource : styles.valueNumCalc}`}>
              {display}
            </span>
          </div>
        </div>
      </td>
    </tr>
  )
}

function FormTable({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className={styles.colHeaders}>
        <div className={styles.colLine} />
        <div className={styles.colDesc}>Description</div>
        <div className={styles.colLineR} />
        <div className={styles.colVal}>Amount</div>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchSource}`} />
          From documents / inputs
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.legendSwatchCalc}`} />
          Calculated
        </span>
      </div>
      <table className={styles.table}>
        <tbody>{children}</tbody>
      </table>
    </>
  )
}

function Schedule1View({ live, ssn }: { live: LiveReturnTotals; ssn: string }) {
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="Schedule 1" title="Additional Income and Adjustments to Income" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow line="1" label="Taxable refunds, credits, or offsets" value={0} />
        <LineRow line="2" label="Alimony received" value={0} />
        <LineRow
          line="3"
          label="Business income or (loss) — Schedule C"
          value={live.schedule1BusinessIncome}
          kind="calc"
          note={live.necOnReturn ? 'From Schedule C net profit' : 'No Schedule C income on return yet'}
        />
        <LineRow line="4" label="Other gains or (losses)" value={0} />
        <LineRow line="5" label="Rental real estate, royalties, partnerships (Sch E)" value={0} />
        <LineRow line="6" label="Farm income or (loss) — Schedule F" value={0} />
        <LineRow line="7" label="Unemployment compensation" value={0} />
        <LineRow
          line="8"
          label="Other income"
          value={0}
          note="NEC flows through Schedule C (line 3), not here"
        />
        <LineRow
          line="10"
          label="Total additional income — to Form 1040, line 8"
          value={live.schedule1BusinessIncome}
          bold
          kind="calc"
        />
        <LineRow
          line="15"
          label="Deductible part of self-employment tax"
          value={Math.round(live.seTax / 2)}
          kind="calc"
          note={live.seTax > 0 ? '½ of Schedule SE tax' : undefined}
        />
      </FormTable>
    </div>
  )
}

function ScheduleCView({ live, amounts, ssn }: { live: LiveReturnTotals; amounts: LiveAmounts; ssn: string }) {
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="Schedule C" title="Profit or Loss From Business (Sole Proprietorship)" />
      <TaxpayerStrip ssn={ssn} />
      <div className={styles.infoGrid}>
        <div className={styles.infoRow}>
          <div className={styles.infoField} style={{ flex: 2 }}>
            <span className={styles.infoLabel}>Principal business / profession</span>
            <span className={styles.infoValue}>Consulting — Summit Advisory Partners</span>
          </div>
          <div className={styles.infoField}>
            <span className={styles.infoLabel}>Business code</span>
            <span className={styles.infoValue}>541990</span>
          </div>
          <div className={styles.infoField}>
            <span className={styles.infoLabel}>Accounting method</span>
            <span className={styles.infoValue}>Cash</span>
          </div>
        </div>
      </div>
      <FormTable>
        <LineRow
          line="1"
          label="Gross receipts or sales"
          value={live.schCGross}
          kind="source"
          note={live.necOnReturn ? '1099-NEC Summit · Box 1' : 'Confirm 1099-NEC onto the return to populate'}
        />
        <LineRow line="2" label="Returns and allowances" value={0} />
        <LineRow line="3" label="Subtract line 2 from line 1" value={live.schCGross} kind="calc" />
        <LineRow line="4" label="Cost of goods sold" value={0} />
        <LineRow line="5" label="Gross profit" value={live.schCGross} kind="calc" bold />
        <LineRow
          line="8"
          label="Advertising"
          value={0}
        />
        <LineRow
          line="18"
          label="Office expense"
          value={Math.round(amounts.schCExpenses * 0.35)}
          kind="source"
          note="Portion of client-confirmed expenses"
        />
        <LineRow
          line="22"
          label="Supplies"
          value={Math.round(amounts.schCExpenses * 0.25)}
          kind="source"
        />
        <LineRow
          line="24a"
          label="Travel"
          value={Math.round(amounts.schCExpenses * 0.4)}
          kind="source"
        />
        <LineRow
          line="28"
          label="Total expenses"
          value={live.schCExpenses}
          kind="calc"
          bold
          note="Edit expense total from 1099-NEC review / questionnaire follow-up"
        />
        <LineRow
          line="31"
          label="Net profit (or loss) — to Schedule 1, line 3"
          value={live.schCNetProfit}
          kind="calc"
          bold
        />
        <LineRow
          line="SE"
          label="Self-employment tax (Schedule SE)"
          value={live.seTax}
          kind="calc"
          note={live.seTax > 0 ? '≈ 15.3% × 92.35% of net profit' : 'No SE tax until net profit ≥ $400'}
        />
      </FormTable>
    </div>
  )
}

function ScheduleAView({ live, amounts, ssn }: { live: LiveReturnTotals; amounts: LiveAmounts; ssn: string }) {
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="Schedule A" title="Itemized Deductions" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow
          line="5a"
          label="State and local income / sales taxes"
          value={Math.round(amounts.saltTaxes * 0.55)}
          kind="source"
        />
        <LineRow
          line="5b"
          label="State and local real estate taxes"
          value={Math.round(amounts.saltTaxes * 0.45)}
          kind="source"
        />
        <LineRow
          line="5e"
          label="SALT deduction (capped)"
          value={Math.min(amounts.saltTaxes, 10_000)}
          kind="calc"
          note="SALT cap $10,000"
        />
        <LineRow
          line="8a"
          label="Home mortgage interest (Form 1098)"
          value={amounts.mortgageInterest}
          kind="source"
          note={
            amounts.mortgageInterest > 0
              ? 'From Form 1098'
              : 'Form 1098 not in packet — client confirmed mortgage interest paid'
          }
        />
        <LineRow
          line="11"
          label="Gifts to charity by cash or check"
          value={amounts.charitableContributions}
          kind="source"
        />
        <LineRow
          line="17"
          label="Total itemized deductions"
          value={live.itemizedDeduction}
          kind="calc"
          bold
        />
        <LineRow
          line="—"
          label={`Standard deduction (single)`}
          value={live.stdDeduction}
          kind="calc"
        />
        <LineRow
          line="1040-12"
          label={
            live.deductionMethod === 'itemized'
              ? 'Using itemized — larger than standard'
              : 'Using standard — larger than itemized'
          }
          value={live.deductionTaken}
          kind="calc"
          bold
          note={`Method: ${live.deductionMethod}`}
        />
      </FormTable>
    </div>
  )
}

function ScheduleDView({ live, ssn }: { live: LiveReturnTotals; ssn: string }) {
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="Schedule D" title="Capital Gains and Losses" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow line="1a" label="Short-term totals from Form 8949" value={0} />
        <LineRow line="7" label="Net short-term capital gain (or loss)" value={0} kind="calc" />
        <LineRow line="8a" label="Long-term totals from Form 8949" value={0} />
        <LineRow line="15" label="Net long-term capital gain (or loss)" value={0} kind="calc" />
        <LineRow
          line="16"
          label="Combined net capital gain (or loss) — to Form 1040, line 7"
          value={live.capitalGain}
          kind="calc"
          bold
          note={
            live.capitalGain === 0
              ? 'No 1099-B / Form 8949 in packet — prior year had $126,750 capital gain'
              : undefined
          }
        />
      </FormTable>
    </div>
  )
}

function Form8960View({ live, ssn }: { live: LiveReturnTotals; ssn: string }) {
  const overThreshold = live.totalIncome > NIIT_AGI_THRESHOLD
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="8960" title="Net Investment Income Tax — Individuals" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow
          line="1"
          label="Taxable interest"
          value={live.taxableInterest}
          kind="source"
          note="From 1099-INT forms"
        />
        <LineRow
          line="2"
          label="Ordinary dividends"
          value={live.ordinaryDivs}
          kind="source"
          note="From 1099-DIV forms"
        />
        <LineRow line="5a" label="Net gain from disposition of property" value={live.capitalGain} kind="source" />
        <LineRow
          line="8"
          label="Total investment income"
          value={live.netInvestmentIncome}
          kind="calc"
          bold
        />
        <LineRow
          line="13"
          label="Modified AGI"
          value={live.totalIncome}
          kind="calc"
          note={`Threshold (single): $${NIIT_AGI_THRESHOLD.toLocaleString()}`}
        />
        <LineRow
          line="14"
          label="Threshold amount"
          value={NIIT_AGI_THRESHOLD}
          kind="calc"
        />
        <LineRow
          line="15"
          label="Subtract line 14 from line 13 (not less than zero)"
          value={Math.max(0, live.totalIncome - NIIT_AGI_THRESHOLD)}
          kind="calc"
        />
        <LineRow
          line="16"
          label="Net investment income (smaller of line 8 or 15)"
          value={overThreshold ? live.netInvestmentIncome : 0}
          kind="calc"
        />
        <LineRow
          line="17"
          label="Net investment income tax (line 16 × 3.8%)"
          value={live.niitTax}
          kind="calc"
          bold
          note={overThreshold ? 'Flows to Form 1040 Schedule 2 / total tax' : 'AGI below threshold — no NIIT'}
        />
      </FormTable>
    </div>
  )
}

function Form2210View({ live, ssn }: { live: LiveReturnTotals; ssn: string }) {
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="2210" title="Underpayment of Estimated Tax by Individuals" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow
          line="1"
          label="Current-year tax (Form 1040)"
          value={live.totalTax}
          kind="calc"
        />
        <LineRow
          line="6"
          label="Required annual payment (safe harbor 110% of prior-year tax)"
          value={SAFE_HARBOR_2210}
          kind="calc"
          note="110% × $102,754 (2024 total tax)"
        />
        <LineRow
          line="9"
          label="Income tax withheld (Form 1040 lines 25a–25d)"
          value={live.totalWithholding}
          kind="source"
        />
        <LineRow
          line="10"
          label="Estimated tax payments"
          value={0}
          kind="source"
          note="Client confirmed $0 ES payments"
        />
        <LineRow
          line="11"
          label="Total payments (lines 9 + 10)"
          value={live.totalWithholding}
          kind="calc"
        />
        <LineRow
          line="17"
          label="Underpayment"
          value={live.underpaymentAmount}
          kind="calc"
          bold
          note={
            live.underpaymentAmount > 0
              ? 'Payments below safe harbor — penalty may apply'
              : 'Payments meet or exceed safe harbor'
          }
        />
      </FormTable>
    </div>
  )
}

interface OutputFormViewsProps {
  formId: OutputFormId
  live: LiveReturnTotals
  amounts: LiveAmounts
}

/** Renders non-1040 output forms. Summary and Form 1040 stay in LeftPanel1040. */
export default function OutputFormViews({ formId, live, amounts }: OutputFormViewsProps) {
  const ssn = live.employeeSsn || '—'

  switch (formId) {
    case 'sch1':
      return <Schedule1View live={live} ssn={ssn} />
    case 'schC':
      return <ScheduleCView live={live} amounts={amounts} ssn={ssn} />
    case 'schA':
      return <ScheduleAView live={live} amounts={amounts} ssn={ssn} />
    case 'schD':
      return <ScheduleDView live={live} ssn={ssn} />
    case 'f8960':
      return <Form8960View live={live} ssn={ssn} />
    case 'f2210':
      return <Form2210View live={live} ssn={ssn} />
    default:
      return null
  }
}
