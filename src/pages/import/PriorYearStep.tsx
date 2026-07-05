import { useState } from 'react'
import { OverflowWeb, ZoomIn, ZoomOut } from '@design-systems/icons'
import pdfPreview from '../../assets/1040-preview.png'
import styles from '../../styles/import/ReviewStep.module.css'

const PRIOR_YEAR_FIELDS = [
  { label: 'Total wages', value: '$ 214, 237.' },
  { label: 'Tax-exempt interest', value: '$ 100.' },
  { label: 'Taxable interest', value: '$ 61.' },
  { label: 'Qualified dividends', value: '$ 611.' },
  { label: 'Ordinary dividends', value: '$ 1,239.' },
  { label: 'IRA Distributions', value: '$ 6,197.' },
  { label: 'Taxable IRA distributions', value: '$197' },
  { label: 'Pensions and annuities', value: '$197' },
  { label: 'Taxable pensions and annuities', value: '$197' },
  { label: 'Social security benefits', value: '$197' },
  { label: 'Taxable social security benefits', value: '$197' },
  { label: 'Capital gain or loss', value: '$197' },
]

export default function PriorYearStep() {
  const [matchedOnly, setMatchedOnly] = useState(true)

  return (
    <div className={styles.splitContainer}>
      {/* LEFT COLUMN — same as Screen 6 */}
      <div className={styles.leftColumn}>
        <div className={styles.fileHeader}>
          <div className={styles.fileHeaderInfo}>
            <span className={styles.fileHeaderName}>W2 Michael Yan.pdf</span>
            <span className={styles.fileHeaderMeta}>W2 - Uploaded Feb 8</span>
          </div>
          <button className={styles.fileHeaderMenu} aria-label="More options">
            <OverflowWeb size="medium" />
          </button>
        </div>

        <div className={styles.pdfViewer}>
          <img
            src={pdfPreview}
            alt="1040 tax form preview"
            className={styles.pdfImage}
          />
        </div>

        <div className={styles.zoomControls}>
          <button className={styles.zoomButton} aria-label="Zoom in">
            <ZoomIn size="large" />
          </button>
          <button className={styles.zoomButton} aria-label="Zoom out">
            <ZoomOut size="large" />
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN — Prior year data */}
      <div className={styles.rightColumn}>
        <h2 className={styles.rightHeading}>Prior year information</h2>

        {/* All fields / Matched fields toggle */}
        <div className={styles.toggleGroup}>
          <button
            className={`${styles.toggleBtn} ${!matchedOnly ? styles.toggleBtnActive : ''}`}
            onClick={() => setMatchedOnly(false)}
          >
            All fields
          </button>
          <button
            className={`${styles.toggleBtn} ${matchedOnly ? styles.toggleBtnActive : ''}`}
            onClick={() => setMatchedOnly(true)}
          >
            Matched fields
          </button>
        </div>

        <div className={styles.fieldsContainer}>
          {/* Section header */}
          <div className={styles.sectionRow}>
            <span className={styles.sectionLabel}>Prior year summary (For comparisson)</span>
          </div>

          {/* Financial fields */}
          {PRIOR_YEAR_FIELDS.map(({ label, value }) => (
            <div key={label} className={styles.fieldRow}>
              <span className={styles.fieldLabel}>{label}</span>
              <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value={value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
