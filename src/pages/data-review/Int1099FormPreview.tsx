import { CLIENT_ADDRESS, formatClientCityStateZip } from '../../data/clientAddress'
import type { IntPayer } from './DetailFields1099'
import styles from '../../styles/data-review/W2FormPreview.module.css'

const PAYER_DATA: Record<IntPayer, { ein: string; name: string; street: string; city: string; state: string; zip: string; payerPhone: string }> = {
  unwaverIngFinancial: {
    ein: '47-8821034',
    name: 'Unwavering Financial LLC',
    street: '800 Capital Way, Suite 1100',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    payerPhone: '(720) 555-0188',
  },
  harborlineCredit: {
    ein: '88-1122334',
    name: 'Harborline Credit Union',
    street: '100 Bank Plaza',
    city: 'Denver',
    state: 'CO',
    zip: '80202',
    payerPhone: '',
  },
  cascadeFederal: {
    ein: '91-4455667',
    name: 'Cascade Federal Savings',
    street: '88 Riverside Ave',
    city: 'Portland',
    state: 'OR',
    zip: '97204',
    payerPhone: '',
  },
}

const FORM_DATA: Record<IntPayer, { box1: string; box3: string; box8: string; box13: string; box15: string }> = {
  unwaverIngFinancial: { box1: '1,986', box3: '1,500', box8: '180', box13: 'CO-47882103', box15: '1,986' },
  harborlineCredit: { box1: '3,200', box3: '', box8: '', box13: '', box15: '' },
  cascadeFederal: { box1: '1,150', box3: '', box8: '', box13: '', box15: '' },
}

/** Panel-viewer 1099-INT preview — source-document values only. */
export default function Int1099FormPreview({ payer }: { payer: IntPayer }) {
  const payerInfo = PAYER_DATA[payer]
  const boxes = FORM_DATA[payer]

  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.deptText}>Department of the Treasury — Internal Revenue Service</div>
          </div>
          <div className={styles.headerCenter}>
            <span className={styles.formTitle}>Form <strong>1099-INT</strong></span>
            <span className={styles.formSubtitle}>Interest Income</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.yearBadge}>2025</div>
            <div className={styles.ombText}>OMB No. 1545-0112</div>
          </div>
        </div>

        <div className={styles.topGrid}>
          <div className={styles.boxA}>
            <span className={styles.boxLabel}>PAYER&apos;S name, street address, city, state, ZIP, and telephone no.</span>
            <span className={styles.boxValueMulti}>
              {payerInfo.name}<br />
              {payerInfo.street}<br />
              {payerInfo.city}, {payerInfo.state} {payerInfo.zip}
              {payerInfo.payerPhone ? <><br />{payerInfo.payerPhone}</> : null}
            </span>
          </div>
          <div className={styles.boxB}>
            <span className={styles.boxLabel}>PAYER&apos;S TIN</span>
            <span className={styles.boxValue}>{payerInfo.ein}</span>
          </div>
          <div className={styles.boxC}>
            <span className={styles.boxLabel}>RECIPIENT&apos;S TIN</span>
            <span className={styles.boxValue}>987-65-4321</span>
          </div>
          <div className={styles.boxD}>
            <span className={styles.boxLabel}>RECIPIENT&apos;S name</span>
            <span className={styles.boxValue}>{CLIENT_ADDRESS.name}</span>
          </div>
          <div className={styles.boxE} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.boxLabel}>Street address (including apt. no.)</span>
            <span className={styles.boxValueMulti}>
              {CLIENT_ADDRESS.street}<br />
              {formatClientCityStateZip()}
            </span>
          </div>
        </div>

        <div className={styles.bodyGrid}>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>1 Interest income</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>{boxes.box1}</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>2 Early withdrawal penalty</span>
            <span className={styles.numValueEmpty} />
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>3 Interest on U.S. Savings Bonds &amp; Treasury obligations</span>
            <span className={boxes.box3 ? `${styles.numValue} ${styles.highlighted}` : styles.numValueEmpty}>
              {boxes.box3 || ''}
            </span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>4 Federal income tax withheld</span>
            <span className={styles.numValueEmpty} />
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>5 Investment expenses</span>
            <span className={styles.numValueEmpty} />
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>6 Foreign tax paid</span>
            <span className={styles.numValueEmpty} />
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>8 Tax-exempt interest</span>
            <span className={boxes.box8 ? styles.numValue : styles.numValueEmpty}>{boxes.box8 || ''}</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>9 Specified private activity bond interest</span>
            <span className={styles.numValueEmpty} />
          </div>
        </div>

        {(boxes.box13 || boxes.box15) && (
          <div className={styles.stateGrid}>
            <div className={styles.stateBox}>
              <span className={styles.stateLabel}>13 State / Payer&apos;s state no.</span>
              <span className={styles.stateValue}>{boxes.box13 || '—'}</span>
            </div>
            <div className={styles.stateBox}>
              <span className={styles.stateLabel}>14 State tax withheld</span>
              <span className={styles.stateValue}>—</span>
            </div>
            <div className={styles.stateBox}>
              <span className={styles.stateLabel}>15 State income</span>
              <span className={styles.stateValue}>{boxes.box15 || '—'}</span>
            </div>
          </div>
        )}

        <div className={styles.footer}>Copy B — For Recipient</div>
      </div>
    </div>
  )
}
