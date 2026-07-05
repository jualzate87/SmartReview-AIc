import { useState } from 'react'
import { OverflowWeb, ZoomIn, ZoomOut } from '@design-systems/icons'
import { Tabs } from '@cgds/tabs'
import pdfPreview from '../../assets/1040-preview.png'
import styles from '../../styles/import/ReviewStep.module.css'

export default function ReviewPersonalStep() {
  const [matchedOnly, setMatchedOnly] = useState(true)

  return (
    <div className={styles.splitContainer}>
      {/* LEFT COLUMN */}
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

      {/* RIGHT COLUMN */}
      <div className={styles.rightColumn}>
        <h2 className={styles.rightHeading}>Review personal information</h2>

        <div className={styles.tabsLeftAligned}>
        <Tabs start={0} alignment="left">
          <Tabs.Title>Client information</Tabs.Title>
          <Tabs.Title>Dependents</Tabs.Title>
          <Tabs.Title>Misc info/ Direct deposit</Tabs.Title>
          <Tabs.Panel><span /></Tabs.Panel>
          <Tabs.Panel><span /></Tabs.Panel>
          <Tabs.Panel><span /></Tabs.Panel>
        </Tabs>
        </div>

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

        {/* Fields content */}
        <div className={styles.fieldsContainer}>
          {/* Taxpayer section */}
          <div className={styles.sectionRow}>
            <span className={styles.sectionLabel}>Taxpayer</span>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Name</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value="Testee Summary" />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>SSN</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputSmall}`} readOnly value="534-02-8622" />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Marital status</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value="Married" />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Filing status</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value="MFJ" />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Occupation</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value="Nutritionist" />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Home address</span>
            <div className={styles.addressRow}>
              <input className={`${styles.fieldInput} ${styles.addressStreet}`} readOnly value="151 Franklin Street" />
              <input className={`${styles.fieldInput} ${styles.addressCity}`} readOnly value="Chicago" />
              <input className={`${styles.fieldInput} ${styles.addressState}`} readOnly value="IL" />
              <input className={`${styles.fieldInput} ${styles.addressZip}`} readOnly value="60606" />
            </div>
          </div>

          {/* Spouse information section */}
          <div className={styles.sectionRow}>
            <span className={styles.sectionLabel}>Spouse information</span>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Spouse name</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value="James Summaary" />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Spouse SSN</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value="872-33-9461" />
          </div>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Occupation</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value="VP Controller" />
          </div>

          {/* Address section */}
          <div className={styles.sectionRow}>
            <span className={styles.sectionLabel}>Address</span>
          </div>

          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Street address</span>
            <input className={`${styles.fieldInput} ${styles.fieldInputWide}`} readOnly value="422 SPOTSWOOD GRAVEL HILL RD" />
          </div>
        </div>
      </div>
    </div>
  )
}
