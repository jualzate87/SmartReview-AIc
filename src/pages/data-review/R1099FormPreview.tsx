import { CLIENT_ADDRESS, formatClientCityStateZip } from '../../data/clientAddress'
import styles from '../../styles/data-review/W2FormPreview.module.css'

export default function R1099FormPreview() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.deptText}>Department of the Treasury — Internal Revenue Service</div>
          </div>
          <div className={styles.headerCenter}>
            <span className={styles.formTitle}>Form <strong>1099-R</strong></span>
            <span className={styles.formSubtitle}>Distributions From Pensions, Annuities, Retirement or Profit-Sharing Plans, IRAs, Insurance Contracts, etc.</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.yearBadge}>2025</div>
            <div className={styles.ombText}>OMB No. 1545-0119</div>
          </div>
        </div>

        <div className={styles.topGrid}>
          <div className={styles.boxA}>
            <span className={styles.boxLabel}>PAYER&apos;S name, street address, city, state, ZIP code, and telephone no.</span>
            <span className={styles.boxValueMulti}>
              Meridian Retirement Trust<br />
              500 Financial Plaza<br />
              Boston, MA 02110
            </span>
          </div>
          <div className={styles.boxB}>
            <span className={styles.boxLabel}>PAYER&apos;S TIN</span>
            <span className={styles.boxValue}>22-3334444</span>
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
            <span className={styles.numLabel}>1 Gross distribution</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>150,000</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>2a Taxable amount</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>150,000</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>4 Federal income tax withheld</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>30,000</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>7 Distribution code(s)</span>
            <span className={styles.numValue}>7</span>
          </div>
        </div>

        <div className={styles.footer}>Copy B — For Recipient</div>
      </div>
    </div>
  )
}
