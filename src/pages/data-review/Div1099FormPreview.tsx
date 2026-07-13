import { CLIENT_ADDRESS, formatClientCityStateZip } from '../../data/clientAddress'
import type { DivPayer } from './DetailFieldsDiv'
import styles from '../../styles/data-review/W2FormPreview.module.css'

const PAYER_DATA: Record<DivPayer, { ein: string; name: string; street: string; city: string; state: string; zip: string }> = {
  tokenFinancial: {
    ein: '26-7488943',
    name: 'Token Financial',
    street: '198 Maker Street',
    city: 'Chicago',
    state: 'IL',
    zip: '60606',
  },
  northmarkIndex: {
    ein: '26-7788990',
    name: 'Northmark Index Funds',
    street: '200 Market Street',
    city: 'Chicago',
    state: 'IL',
    zip: '60606',
  },
  beaconDividend: {
    ein: '33-2211445',
    name: 'Beacon Dividend Trust',
    street: '55 Beacon Way',
    city: 'Boston',
    state: 'MA',
    zip: '02108',
  },
}

const FORM_DATA: Record<DivPayer, { box1a: string; box1b: string; box4: string; box5: string }> = {
  tokenFinancial: { box1a: '331,250', box1b: '187,500', box4: '26,363', box5: '1,200' },
  northmarkIndex: { box1a: '12,400', box1b: '8,000', box4: '', box5: '' },
  beaconDividend: { box1a: '6,750', box1b: '4,200', box4: '', box5: '' },
}

export default function Div1099FormPreview({ payer }: { payer: DivPayer }) {
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
            <span className={styles.formTitle}>Form <strong>1099-DIV</strong></span>
            <span className={styles.formSubtitle}>Dividends and Distributions</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.yearBadge}>2025</div>
            <div className={styles.ombText}>OMB No. 1545-0110</div>
          </div>
        </div>

        <div className={styles.topGrid}>
          <div className={styles.boxA}>
            <span className={styles.boxLabel}>PAYER&apos;S name, street address, city, state, ZIP code, and telephone no.</span>
            <span className={styles.boxValueMulti}>
              {payerInfo.name}<br />
              {payerInfo.street}<br />
              {payerInfo.city}, {payerInfo.state} {payerInfo.zip}
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
            <span className={styles.numLabel}>1a Total ordinary dividends</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>{boxes.box1a}</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>1b Qualified dividends</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>{boxes.box1b}</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>4 Federal income tax withheld</span>
            <span className={boxes.box4 ? `${styles.numValue} ${styles.highlighted}` : styles.numValueEmpty}>
              {boxes.box4 || ''}
            </span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>5 Investment expenses</span>
            <span className={boxes.box5 ? styles.numValue : styles.numValueEmpty}>{boxes.box5 || ''}</span>
          </div>
        </div>

        <div className={styles.footer}>Copy B — For Recipient</div>
      </div>
    </div>
  )
}
