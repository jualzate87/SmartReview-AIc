import styles from '../../styles/data-review/W2FormPreview.module.css'

/** Panel-viewer 1099-INT preview for Unwavering Financial — Jessica Drake TY 2025.
 *  Source-document values only; does NOT affect DetailFields1099 return inputs. */
export default function Int1099FormPreview() {
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
              Unwavering Financial LLC<br />
              800 Capital Way, Suite 1100<br />
              Denver, CO 80202<br />
              (720) 555-0188
            </span>
          </div>
          <div className={styles.boxB}>
            <span className={styles.boxLabel}>PAYER&apos;S TIN</span>
            <span className={styles.boxValue}>47-8821034</span>
          </div>
          <div className={styles.boxC}>
            <span className={styles.boxLabel}>RECIPIENT&apos;S TIN</span>
            <span className={styles.boxValue}>987-65-4321</span>
          </div>
          <div className={styles.boxD}>
            <span className={styles.boxLabel}>RECIPIENT&apos;S name</span>
            <span className={styles.boxValue}>Jessica Drake</span>
          </div>
          <div className={styles.boxE} style={{ gridColumn: '1 / -1' }}>
            <span className={styles.boxLabel}>Street address (including apt. no.)</span>
            <span className={styles.boxValueMulti}>
              333 Easy Street<br />
              Austin, TX 78704
            </span>
          </div>
        </div>

        <div className={styles.bodyGrid}>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>1 Interest income</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>1,986</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>2 Early withdrawal penalty</span>
            <span className={styles.numValueEmpty} />
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>3 Interest on U.S. Savings Bonds &amp; Treasury obligations</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>1,500</span>
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
            <span className={styles.numValue}>180</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>9 Specified private activity bond interest</span>
            <span className={styles.numValueEmpty} />
          </div>
        </div>

        <div className={styles.stateGrid}>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>13 State / Payer&apos;s state no.</span>
            <span className={styles.stateValue}>CO-47882103</span>
          </div>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>14 State tax withheld</span>
            <span className={styles.stateValue}>—</span>
          </div>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>15 State income</span>
            <span className={styles.stateValue}>1,986</span>
          </div>
        </div>

        <div className={styles.footer}>
          Copy B — For Recipient
        </div>
      </div>
    </div>
  )
}
