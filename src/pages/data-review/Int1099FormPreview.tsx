import styles from '../../styles/data-review/Int1099FormPreview.module.css'
import { CLIENT_ADDRESS } from '../../data/clientAddress'

/** Unwavering 1099-INT panel preview — FINAL PDF had Georgetown placeholders. */
const PAYER = {
  name: 'Unwavering Financial LLC',
  street: '800 Capital Way, Suite 1100',
  cityStateZip: 'Denver, CO 80202',
  phone: '(720) 555-0188',
  ein: '47-8821034',
}

const FORM = {
  box1: '1,986.00',
  box3: '1,500.00',
  box8: '180.00',
  account: '33-2211445',
  recipientTin: '987-65-4321',
}

export default function Int1099FormPreview() {
  return (
    <div className={styles.form} role="img" aria-label="Form 1099-INT — Unwavering Financial LLC">
      <div className={styles.topMeta}>
        <span>FDEA1302 10/18/25</span>
        <span className={styles.corrected}>☐ CORRECTED</span>
      </div>

      <div className={styles.grid}>
        <div className={`${styles.cell} ${styles.payerCell}`}>
          <div className={styles.cellLabel}>PAYER&apos;S name, street address, city or town, state or province, country, ZIP or foreign postal code, and telephone no.</div>
          <div className={styles.payerBlock}>
            <div>{PAYER.name}</div>
            <div>{PAYER.street}</div>
            <div>{PAYER.cityStateZip}</div>
            <div>{PAYER.phone}</div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.titleBlock}>
            <div className={styles.formTitle}>1099-INT</div>
            <div className={styles.formSubtitle}>Interest Income</div>
            <div className={styles.copyB}>Copy B For Recipient</div>
            <div className={styles.omb}>OMB No. 1545-0112</div>
            <div className={styles.year}>2025</div>
          </div>
        </div>

        <div className={styles.tinRow}>
          <div className={styles.cell}>
            <div className={styles.cellLabel}>PAYER&apos;S TIN</div>
            <div className={styles.tinValue}>{PAYER.ein}</div>
          </div>
          <div className={styles.cell}>
            <div className={styles.cellLabel}>RECIPIENT&apos;S TIN</div>
            <div className={styles.tinValue}>{FORM.recipientTin}</div>
          </div>
        </div>

        <div className={`${styles.cell} ${styles.recipientCell}`}>
          <div className={styles.cellLabel}>RECIPIENT&apos;S name</div>
          <div className={styles.valueText}>{CLIENT_ADDRESS.name}</div>
          <div className={styles.cellLabel} style={{ marginTop: 8 }}>Street address (including apt. no.)</div>
          <div className={styles.valueText}>{CLIENT_ADDRESS.street}</div>
          <div className={styles.cellLabel} style={{ marginTop: 8 }}>City or town, state or province, country, ZIP or foreign postal code</div>
          <div className={styles.valueText}>
            {CLIENT_ADDRESS.city}, {CLIENT_ADDRESS.state} {CLIENT_ADDRESS.zip}
          </div>
        </div>

        <div className={styles.boxesCol}>
          <div className={styles.box}>
            <div className={styles.boxNum}>1</div>
            <div className={styles.boxLabel}>Interest income</div>
            <div className={styles.boxValue}>$ {FORM.box1}</div>
          </div>
          <div className={styles.box}>
            <div className={styles.boxNum}>2</div>
            <div className={styles.boxLabel}>Early withdrawal penalty</div>
            <div className={styles.boxValue} />
          </div>
          <div className={styles.box}>
            <div className={styles.boxNum}>3</div>
            <div className={styles.boxLabel}>Interest on U.S. Savings Bonds and Treas. obligations</div>
            <div className={styles.boxValue}>$ {FORM.box3}</div>
          </div>
          <div className={styles.box}>
            <div className={styles.boxNum}>4</div>
            <div className={styles.boxLabel}>Federal income tax withheld</div>
            <div className={styles.boxValue} />
          </div>
          <div className={styles.box}>
            <div className={styles.boxNum}>8</div>
            <div className={styles.boxLabel}>Tax-exempt interest</div>
            <div className={styles.boxValue}>$ {FORM.box8}</div>
          </div>
        </div>

        <div className={`${styles.cell} ${styles.accountCell}`}>
          <div className={styles.cellLabel}>Account number (see instructions)</div>
          <div className={styles.valueText}>{FORM.account}</div>
          <div className={styles.fatca}>☑ FATCA filing requirement</div>
        </div>
      </div>

      <div className={styles.footer}>
        Form 1099-INT (Rev. January 2025) — Unwavering Financial LLC · EIN {PAYER.ein}
      </div>
    </div>
  )
}
