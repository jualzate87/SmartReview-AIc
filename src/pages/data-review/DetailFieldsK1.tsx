import SubTab from './SubTab'
import styles from '../../styles/data-review/DetailFields.module.css'

export default function DetailFieldsK1() {
  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2 className={styles.title}>Details: Partnership Info (1065 K-1) Easy Money Ltd.</h2>
        <SubTab tabs={[{ label: 'Easy Money Ltd.' }]} />
      </div>

      <div className={styles.inputContainer}>
        {/* Part III section */}
        <div className={styles.sectionHeader}>
          Part III - (Lines 1-10) - Partner's Share of Current Year Income - Federal Amounts
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(1) Ordinary business income (loss)</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value="5,000" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(5) Interest income: banks, savings &amp; loan, credit unions, etc.</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value="1,000" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(6A) Ordinary dividends</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value="500" />
        </div>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>(6B) Qualified dividends</span>
          <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value="25" />
        </div>
      </div>
    </div>
  )
}
