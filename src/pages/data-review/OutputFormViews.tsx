import { useState } from 'react'
import { CircleInfo } from '@design-systems/icons'
import type { FieldOriginSource } from '../../data/fieldOrigins'
import type { LiveAmounts, LiveReturnTotals } from '../../data/liveReturn'
import { NIIT_AGI_THRESHOLD, SAFE_HARBOR_2210 } from '../../data/liveReturn'
import { CLIENT_ADDRESS, formatClientCityStateZip } from '../../data/clientAddress'
import { getScheduleLineFlyout } from '../../data/scheduleFieldOrigins'
import type { OutputFormId } from './outputForms'
import TaxControlDocPopover from './TaxControlDocPopover'
import Tooltip from './Tooltip'
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

type LineRowProps = {
  line: string
  label: string
  value: string | number
  kind?: 'source' | 'calc'
  bold?: boolean
  note?: string
  /** Unique id for schedule flyout content */
  fieldId: string
  formId: OutputFormId
  live: LiveReturnTotals
  amounts: LiveAmounts
  openFieldId: string | null
  onOpenFlyout: (fieldId: string, anchor: HTMLElement) => void
}

function LineRow({
  line,
  label,
  value,
  kind = 'calc',
  bold,
  note,
  fieldId,
  formId,
  live,
  amounts,
  openFieldId,
  onOpenFlyout,
}: LineRowProps) {
  const display = typeof value === 'number' ? fmt(value) : value
  const flyout = getScheduleLineFlyout(formId, fieldId, live, amounts)
  const hasFlyout = !!flyout
  const isOpen = openFieldId === fieldId

  const openFromRow = (rowEl: HTMLElement) => {
    if (!hasFlyout) return
    onOpenFlyout(fieldId, rowEl)
  }

  return (
    <tr
      className={`${styles.row} ${bold ? styles.rowBold : ''} ${hasFlyout ? styles.rowClickable : ''}`}
      data-field-row={hasFlyout ? fieldId : undefined}
      onMouseDown={hasFlyout ? e => e.stopPropagation() : undefined}
      onClick={hasFlyout ? e => openFromRow(e.currentTarget) : undefined}
      style={hasFlyout ? { cursor: 'pointer' } : undefined}
    >
      <td className={styles.cellLine}>{line}</td>
      <td className={styles.cellLabel}>
        <div className={styles.cellLabelInner}>
          {label}
          {note ? (
            <span style={{ display: 'block', fontSize: 11, color: '#6b6c72', fontWeight: 400 }}>{note}</span>
          ) : null}
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
          {hasFlyout && (
            <Tooltip
              text={kind === 'calc' ? 'Click row or icon to view subtotals' : 'Click row or icon to view sources'}
              placement="top"
              disabled={isOpen}
            >
              <button
                type="button"
                className={`${styles.summaryInfoBtn} ${isOpen ? styles.summaryInfoBtnActive : ''}`}
                aria-label={kind === 'calc' ? `View subtotals for ${label}` : `View sources for ${label}`}
                onClick={e => {
                  e.stopPropagation()
                  onOpenFlyout(fieldId, e.currentTarget)
                }}
              >
                <CircleInfo size="small" />
              </button>
            </Tooltip>
          )}
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

type SharedLineProps = Omit<
  LineRowProps,
  'line' | 'label' | 'value' | 'kind' | 'bold' | 'note' | 'fieldId'
>

function Schedule1View({ live, ssn, ...row }: { live: LiveReturnTotals; ssn: string } & SharedLineProps) {
  const blank = (line: string, label: string, fieldId: string) => (
    <LineRow {...row} live={live} line={line} label={label} value={0} fieldId={fieldId} />
  )
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="Schedule 1" title="Additional Income and Adjustments to Income" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        {blank('1', 'Taxable refunds, credits, or offsets', 'sch1-1')}
        {blank('2', 'Alimony received', 'sch1-2')}
        <LineRow
          {...row}
          live={live}
          line="3"
          label="Business income or (loss) — Schedule C"
          value={live.schedule1BusinessIncome}
          kind="calc"
          note={live.necOnReturn ? 'From Schedule C net profit' : 'No Schedule C income on return yet'}
          fieldId="sch1-3"
        />
        {blank('4', 'Other gains or (losses)', 'sch1-4')}
        {blank('5', 'Rental real estate, royalties, partnerships (Sch E)', 'sch1-5')}
        {blank('6', 'Farm income or (loss) — Schedule F', 'sch1-6')}
        {blank('7', 'Unemployment compensation', 'sch1-7')}
        <LineRow
          {...row}
          live={live}
          line="8"
          label="Other income"
          value={0}
          note="NEC flows through Schedule C (line 3), not here"
          fieldId="sch1-8"
        />
        <LineRow
          {...row}
          live={live}
          line="10"
          label="Total additional income — to Form 1040, line 8"
          value={live.schedule1BusinessIncome}
          bold
          kind="calc"
          fieldId="sch1-10"
        />
        <LineRow
          {...row}
          live={live}
          line="15"
          label="Deductible part of self-employment tax"
          value={Math.round(live.seTax / 2)}
          kind="calc"
          note={live.seTax > 0 ? '½ of Schedule SE tax' : undefined}
          fieldId="sch1-15"
        />
      </FormTable>
    </div>
  )
}

function ScheduleCView({
  live,
  amounts,
  ssn,
  ...row
}: { live: LiveReturnTotals; amounts: LiveAmounts; ssn: string } & SharedLineProps) {
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
          {...row}
          live={live}
          amounts={amounts}
          line="1"
          label="Gross receipts or sales"
          value={live.schCGross}
          kind="source"
          note={live.necOnReturn ? '1099-NEC Summit · Box 1' : 'Confirm 1099-NEC onto the return to populate'}
          fieldId="schC-1"
        />
        <LineRow {...row} live={live} amounts={amounts} line="2" label="Returns and allowances" value={0} fieldId="schC-2" />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="3"
          label="Subtract line 2 from line 1"
          value={live.schCGross}
          kind="calc"
          fieldId="schC-3"
        />
        <LineRow {...row} live={live} amounts={amounts} line="4" label="Cost of goods sold" value={0} fieldId="schC-4" />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="5"
          label="Gross profit"
          value={live.schCGross}
          kind="calc"
          bold
          fieldId="schC-5"
        />
        <LineRow {...row} live={live} amounts={amounts} line="8" label="Advertising" value={0} fieldId="schC-8" />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="18"
          label="Office expense"
          value={Math.round(amounts.schCExpenses * 0.35)}
          kind="source"
          note="Portion of client-confirmed expenses"
          fieldId="schC-18"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="22"
          label="Supplies"
          value={Math.round(amounts.schCExpenses * 0.25)}
          kind="source"
          fieldId="schC-22"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="24a"
          label="Travel"
          value={Math.round(amounts.schCExpenses * 0.4)}
          kind="source"
          fieldId="schC-24a"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="28"
          label="Total expenses"
          value={live.schCExpenses}
          kind="calc"
          bold
          note="Edit expense total from 1099-NEC review / questionnaire follow-up"
          fieldId="schC-28"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="31"
          label="Net profit (or loss) — to Schedule 1, line 3"
          value={live.schCNetProfit}
          kind="calc"
          bold
          fieldId="schC-31"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="SE"
          label="Self-employment tax (Schedule SE)"
          value={live.seTax}
          kind="calc"
          note={live.seTax > 0 ? '≈ 15.3% × 92.35% of net profit' : 'No SE tax until net profit ≥ $400'}
          fieldId="schC-SE"
        />
      </FormTable>
    </div>
  )
}

function ScheduleAView({
  live,
  amounts,
  ssn,
  ...row
}: { live: LiveReturnTotals; amounts: LiveAmounts; ssn: string } & SharedLineProps) {
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="Schedule A" title="Itemized Deductions" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="5a"
          label="State and local income / sales taxes"
          value={Math.round(amounts.saltTaxes * 0.55)}
          kind="source"
          fieldId="schA-5a"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="5b"
          label="State and local real estate taxes"
          value={Math.round(amounts.saltTaxes * 0.45)}
          kind="source"
          fieldId="schA-5b"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="5e"
          label="SALT deduction (capped)"
          value={Math.min(amounts.saltTaxes, 10_000)}
          kind="calc"
          note="SALT cap $10,000"
          fieldId="schA-5e"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="8a"
          label="Home mortgage interest (Form 1098)"
          value={amounts.mortgageInterest}
          kind="source"
          note={
            amounts.mortgageInterest > 0
              ? 'From Form 1098'
              : 'Form 1098 not in packet — client confirmed mortgage interest paid'
          }
          fieldId="schA-8a"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="11"
          label="Gifts to charity by cash or check"
          value={amounts.charitableContributions}
          kind="source"
          fieldId="schA-11"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="17"
          label="Total itemized deductions"
          value={live.itemizedDeduction}
          kind="calc"
          bold
          fieldId="schA-17"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
          line="—"
          label={`Standard deduction (single)`}
          value={live.stdDeduction}
          kind="calc"
          fieldId="schA-std"
        />
        <LineRow
          {...row}
          live={live}
          amounts={amounts}
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
          fieldId="schA-method"
        />
      </FormTable>
    </div>
  )
}

function ScheduleDView({ live, ssn, ...row }: { live: LiveReturnTotals; ssn: string } & SharedLineProps) {
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="Schedule D" title="Capital Gains and Losses" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow {...row} live={live} line="1a" label="Short-term totals from Form 8949" value={0} fieldId="schD-1a" />
        <LineRow
          {...row}
          live={live}
          line="7"
          label="Net short-term capital gain (or loss)"
          value={0}
          kind="calc"
          fieldId="schD-7"
        />
        <LineRow {...row} live={live} line="8a" label="Long-term totals from Form 8949" value={0} fieldId="schD-8a" />
        <LineRow
          {...row}
          live={live}
          line="15"
          label="Net long-term capital gain (or loss)"
          value={0}
          kind="calc"
          fieldId="schD-15"
        />
        <LineRow
          {...row}
          live={live}
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
          fieldId="schD-16"
        />
      </FormTable>
    </div>
  )
}

function Form8960View({ live, ssn, ...row }: { live: LiveReturnTotals; ssn: string } & SharedLineProps) {
  const overThreshold = live.totalIncome > NIIT_AGI_THRESHOLD
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="8960" title="Net Investment Income Tax — Individuals" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow
          {...row}
          live={live}
          line="1"
          label="Taxable interest"
          value={live.taxableInterest}
          kind="source"
          note="From 1099-INT forms"
          fieldId="f8960-1"
        />
        <LineRow
          {...row}
          live={live}
          line="2"
          label="Ordinary dividends"
          value={live.ordinaryDivs}
          kind="source"
          note="From 1099-DIV forms"
          fieldId="f8960-2"
        />
        <LineRow
          {...row}
          live={live}
          line="5a"
          label="Net gain from disposition of property"
          value={live.capitalGain}
          kind="source"
          fieldId="f8960-5a"
        />
        <LineRow
          {...row}
          live={live}
          line="8"
          label="Total investment income"
          value={live.netInvestmentIncome}
          kind="calc"
          bold
          fieldId="f8960-8"
        />
        <LineRow
          {...row}
          live={live}
          line="13"
          label="Modified AGI"
          value={live.totalIncome}
          kind="calc"
          note={`Threshold (single): $${NIIT_AGI_THRESHOLD.toLocaleString()}`}
          fieldId="f8960-13"
        />
        <LineRow
          {...row}
          live={live}
          line="14"
          label="Threshold amount"
          value={NIIT_AGI_THRESHOLD}
          kind="calc"
          fieldId="f8960-14"
        />
        <LineRow
          {...row}
          live={live}
          line="15"
          label="Subtract line 14 from line 13 (not less than zero)"
          value={Math.max(0, live.totalIncome - NIIT_AGI_THRESHOLD)}
          kind="calc"
          fieldId="f8960-15"
        />
        <LineRow
          {...row}
          live={live}
          line="16"
          label="Net investment income (smaller of line 8 or 15)"
          value={overThreshold ? live.netInvestmentIncome : 0}
          kind="calc"
          fieldId="f8960-16"
        />
        <LineRow
          {...row}
          live={live}
          line="17"
          label="Net investment income tax (line 16 × 3.8%)"
          value={live.niitTax}
          kind="calc"
          bold
          note={overThreshold ? 'Flows to Form 1040 Schedule 2 / total tax' : 'AGI below threshold — no NIIT'}
          fieldId="f8960-17"
        />
      </FormTable>
    </div>
  )
}

function Form2210View({ live, ssn, ...row }: { live: LiveReturnTotals; ssn: string } & SharedLineProps) {
  return (
    <div className={styles.formDoc}>
      <FormHeader formCode="2210" title="Underpayment of Estimated Tax by Individuals" />
      <TaxpayerStrip ssn={ssn} />
      <FormTable>
        <LineRow
          {...row}
          live={live}
          line="1"
          label="Current-year tax (Form 1040)"
          value={live.totalTax}
          kind="calc"
          fieldId="f2210-1"
        />
        <LineRow
          {...row}
          live={live}
          line="6"
          label="Required annual payment (safe harbor 110% of prior-year tax)"
          value={SAFE_HARBOR_2210}
          kind="calc"
          note="110% × $102,754 (2024 total tax)"
          fieldId="f2210-6"
        />
        <LineRow
          {...row}
          live={live}
          line="9"
          label="Income tax withheld (Form 1040 lines 25a–25d)"
          value={live.totalWithholding}
          kind="source"
          fieldId="f2210-9"
        />
        <LineRow
          {...row}
          live={live}
          line="10"
          label="Estimated tax payments"
          value={0}
          kind="source"
          note="Client confirmed $0 ES payments"
          fieldId="f2210-10"
        />
        <LineRow
          {...row}
          live={live}
          line="11"
          label="Total payments (lines 9 + 10)"
          value={live.totalWithholding}
          kind="calc"
          fieldId="f2210-11"
        />
        <LineRow
          {...row}
          live={live}
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
          fieldId="f2210-17"
        />
      </FormTable>
    </div>
  )
}

interface OutputFormViewsProps {
  formId: OutputFormId
  live: LiveReturnTotals
  amounts: LiveAmounts
  onNavigateSource?: (source: FieldOriginSource) => void
  onNavigateToSourceDoc?: (docId: string) => void
}

/** Renders non-1040 output forms. Summary and Form 1040 stay in LeftPanel1040. */
export default function OutputFormViews({
  formId,
  live,
  amounts,
  onNavigateSource,
  onNavigateToSourceDoc,
}: OutputFormViewsProps) {
  const ssn = live.employeeSsn || '—'
  const [flyoutField, setFlyoutField] = useState<string | null>(null)
  const [flyoutRect, setFlyoutRect] = useState<DOMRect | null>(null)

  const openFlyout = (fieldId: string, el: HTMLElement) => {
    if (flyoutField === fieldId) {
      setFlyoutField(null)
      setFlyoutRect(null)
      return
    }
    // Prefer amount cell when opening from the full row
    const rowEl = el.closest('tr') ?? el
    const cells = rowEl instanceof HTMLTableRowElement ? rowEl.querySelectorAll('td') : null
    const valueCell = cells?.[cells.length - 1] as HTMLElement | undefined
    const infoBtn = rowEl.querySelector?.(`.${styles.summaryInfoBtn}`) as HTMLElement | null
    const anchor = el.tagName === 'BUTTON' ? el : (infoBtn ?? valueCell ?? el)
    setFlyoutRect(anchor.getBoundingClientRect())
    setFlyoutField(fieldId)
  }

  const closeFlyout = () => {
    setFlyoutField(null)
    setFlyoutRect(null)
  }

  const flyout = flyoutField ? getScheduleLineFlyout(formId, flyoutField, live, amounts) : null

  const shared: SharedLineProps = {
    formId,
    live,
    amounts,
    openFieldId: flyoutField,
    onOpenFlyout: openFlyout,
  }

  let body: React.ReactNode = null
  switch (formId) {
    case 'sch1':
      body = <Schedule1View live={live} ssn={ssn} {...shared} />
      break
    case 'schC':
      body = <ScheduleCView live={live} amounts={amounts} ssn={ssn} {...shared} />
      break
    case 'schA':
      body = <ScheduleAView live={live} amounts={amounts} ssn={ssn} {...shared} />
      break
    case 'schD':
      body = <ScheduleDView live={live} ssn={ssn} {...shared} />
      break
    case 'f8960':
      body = <Form8960View live={live} ssn={ssn} {...shared} />
      break
    case 'f2210':
      body = <Form2210View live={live} ssn={ssn} {...shared} />
      break
    default:
      body = null
  }

  return (
    <>
      {body}
      {flyout && flyoutRect && (
        <TaxControlDocPopover
          rowLabel={flyout.label}
          mode={flyout.mode}
          items={flyout.items}
          sumLabel={flyout.sumLabel}
          sumValue={flyout.sumValue}
          footnote={flyout.footnote}
          onNavigateToDoc={
            flyout.mode === 'source'
              ? docId => {
                  const detailFieldId = flyout.detailByDocId?.[docId]
                  const item = flyout.items.find(d => d.docId === docId)
                  if (detailFieldId && onNavigateSource) {
                    onNavigateSource({
                      docId,
                      detailFieldId,
                      label: item?.label ?? docId,
                      box: '',
                      amount: item?.amount ?? 0,
                    })
                  } else {
                    onNavigateToSourceDoc?.(docId)
                  }
                  closeFlyout()
                }
              : undefined
          }
          anchorRect={flyoutRect}
          onClose={closeFlyout}
        />
      )}
    </>
  )
}
