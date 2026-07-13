import { CLIENT_ADDRESS, formatClientCityStateZip } from '../../data/clientAddress'
import styles from '../../styles/data-review/W2FormPreview.module.css'

export default function Nec1099FormPreview() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.deptText}>Department of the Treasury — Internal Revenue Service</div>
          </div>
          <div className={styles.headerCenter}>
            <span className={styles.formTitle}>Form <strong>1099-NEC</strong></span>
            <span className={styles.formSubtitle}>Nonemployee Compensation</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.yearBadge}>2025</div>
            <div className={styles.ombText}>OMB No. 1545-0116</div>
          </div>
        </div>

        <div className={styles.topGrid}>
          <div className={styles.boxA}>
            <span className={styles.boxLabel}>PAYER&apos;S name, street address, city, state, ZIP code, and telephone no.</span>
            <span className={styles.boxValueMulti}>
              Summit Advisory Partners LLC<br />
              410 Congress Street, Suite 900<br />
              Boston, MA 02210<br />
              617 555-0143
            </span>
          </div>
          <div className={styles.boxB}>
            <span className={styles.boxLabel}>PAYER&apos;S TIN</span>
            <span className={styles.boxValue}>47-2201893</span>
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
            <span className={styles.numLabel}>1 Nonemployee compensation</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>24,000</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>4 Federal income tax withheld</span>
            <span className={styles.numValueEmpty} />
          </div>
        </div>

        <div className={styles.footer}>Copy B — For Recipient</div>
      </div>
    </div>
  )
}
