import styles from '../../styles/data-review/W2FormPreview.module.css'

/** Panel-viewer W-2 preview for Tech Circle Inc — Jessica Drake TY 2025.
 *  Data-only preview; does NOT affect DetailFields input values. */
export default function W2FormPreview() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.form}>
        {/* Header row */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.deptText}>Department of the Treasury — Internal Revenue Service</div>
          </div>
          <div className={styles.headerCenter}>
            <span className={styles.formTitle}>Form <strong>W-2</strong></span>
            <span className={styles.formSubtitle}>Wage and Tax Statement</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.yearBadge}>2025</div>
            <div className={styles.ombText}>OMB No. 1545-0008</div>
            <div className={styles.efileLogo}>
              <span className={styles.efileText}>IRS</span>
              <span className={styles.efileSub}>e-file</span>
            </div>
          </div>
        </div>

        {/* Top section: boxes a-e */}
        <div className={styles.topGrid}>
          <div className={styles.boxA}>
            <span className={styles.boxLabel}>a Employee&apos;s social security number</span>
            <span className={`${styles.boxValue} ${styles.highlighted}`}>987-65-4321</span>
          </div>
          <div className={styles.boxB}>
            <span className={styles.boxLabel}>b Employer identification number (EIN)</span>
            <span className={styles.boxValue}>94-1234567</span>
          </div>
          <div className={styles.boxC}>
            <span className={styles.boxLabel}>c Employer&apos;s name, address, and ZIP code</span>
            <span className={styles.boxValueMulti}>
              Tech Circle Inc<br />
              321 Main Orchard Dr<br />
              Reno, NV 89501
            </span>
          </div>
          <div className={styles.boxD}>
            <span className={styles.boxLabel}>d Control number</span>
            <span className={styles.boxValueEmpty} />
          </div>
          <div className={styles.boxE}>
            <span className={styles.boxLabel}>e Employee&apos;s name, address, and ZIP code</span>
            <span className={styles.boxValueMulti}>
              Jessica Drake<br />
              333 Easy Street<br />
              Austin, TX 78704
            </span>
          </div>
        </div>

        {/* Main body: numbered boxes */}
        <div className={styles.bodyGrid}>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>1 Wages, tips, other compensation</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>148,940</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>2 Federal income tax withheld</span>
            <span className={`${styles.numValue} ${styles.highlighted}`}>15,840</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>3 Social security wages</span>
            <span className={styles.numValue}>148,940</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>4 Social security tax withheld</span>
            <span className={styles.numValue}>9,234.28</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>5 Medicare wages and tips</span>
            <span className={styles.numValue}>148,940</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>6 Medicare tax withheld</span>
            <span className={styles.numValue}>2,159.63</span>
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>7 Social security tips</span>
            <span className={styles.numValueEmpty} />
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>8 Allocated tips</span>
            <span className={styles.numValueEmpty} />
          </div>

          {/* Box 9 blank */}
          <div className={styles.numBoxWide}>
            <span className={styles.numLabel}>9</span>
            <span className={styles.numValueEmpty} />
          </div>

          {/* Box 10-11 */}
          <div className={styles.numBox}>
            <span className={styles.numLabel}>10 Dependent care benefits</span>
            <span className={styles.numValueEmpty} />
          </div>
          <div className={styles.numBox}>
            <span className={styles.numLabel}>11 Nonqualified plans</span>
            <span className={styles.numValueEmpty} />
          </div>

          {/* Box 12 */}
          <div className={styles.box12Section}>
            <span className={styles.box12Title}>12 See instructions for box 12</span>
            <div className={styles.box12Rows}>
              <div className={styles.box12Row}>
                <span className={styles.box12Code}>12a C</span>
                <span className={styles.box12Amt}>225</span>
              </div>
              <div className={styles.box12Row}>
                <span className={styles.box12Code}>12b AA</span>
                <span className={styles.box12Amt}>13,456</span>
              </div>
              <div className={styles.box12Row}>
                <span className={styles.box12Code}>12c DD</span>
                <span className={styles.box12Amt}>15,658</span>
              </div>
              <div className={styles.box12Row}>
                <span className={styles.box12Code}>12d</span>
                <span className={styles.box12AmtEmpty} />
              </div>
            </div>
          </div>

          {/* Box 13 */}
          <div className={styles.box13Section}>
            <span className={styles.box13Title}>13</span>
            <div className={styles.box13Checks}>
              <label className={styles.checkItem}>
                <span className={styles.checkbox} /> Statutory employee
              </label>
              <label className={styles.checkItem}>
                <span className={`${styles.checkbox} ${styles.checked}`}>✕</span> Retirement plan
              </label>
              <label className={styles.checkItem}>
                <span className={styles.checkbox} /> Third-party sick pay
              </label>
            </div>
          </div>

          {/* Box 14 */}
          <div className={styles.numBoxWide}>
            <span className={styles.numLabel}>14 Other</span>
            <span className={styles.numValueEmpty} />
          </div>
        </div>

        {/* State/local boxes 15-20 */}
        <div className={styles.stateGrid}>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>15 State</span>
            <span className={styles.stateValue}>—</span>
          </div>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>Employer&apos;s state ID no.</span>
            <span className={styles.stateValue}>—</span>
          </div>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>16 State wages, tips, etc.</span>
            <span className={styles.stateValue}>—</span>
          </div>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>17 State income tax</span>
            <span className={styles.stateValue}>—</span>
          </div>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>18 Local wages, tips, etc.</span>
            <span className={styles.stateValue}>—</span>
          </div>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>19 Local income tax</span>
            <span className={styles.stateValue}>—</span>
          </div>
          <div className={styles.stateBox}>
            <span className={styles.stateLabel}>20 Locality name</span>
            <span className={styles.stateValue}>—</span>
          </div>
        </div>

        <div className={styles.footer}>
          Copy B — To Be Filed With Employee&apos;s FEDERAL Tax Return.
        </div>
      </div>
    </div>
  )
}
