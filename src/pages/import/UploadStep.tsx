import { useRef, useState } from 'react'
import { Dropdown, MenuItem } from '@ids-ts/dropdown'
import '@ids-ts/dropdown/dist/main.css'
import { Upload, CloudUpload, AiSparkles, Close } from '@design-systems/icons'
import styles from '../../styles/import/UploadStep.module.css'

interface UploadStepProps {
  onFileAttached: () => void
}

export default function UploadStep({ onFileAttached }: UploadStepProps) {
  const [showBanner, setShowBanner] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileAttached()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files?.[0]) {
      onFileAttached()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpeg,.jpg,.png,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className={styles.innerContainer}>
        <div className={styles.uploadSection}>
          <h2 className={styles.heading}>Upload a 1040 return</h2>

          {showBanner && (
            <div className={styles.infoBanner}>
              <div className={styles.infoBannerContent}>
                <AiSparkles size="small" className={styles.infoBannerIcon} />
                <div className={styles.infoBannerText}>
                  <span className={styles.infoBannerTitle}>
                    Import a 1040 to enable automated onboarding
                  </span>
                  <span className={styles.infoBannerBody}>
                    Once you import the 1040, you can have Intuit AI draft a client data request and return summary.
                  </span>
                </div>
              </div>
              <button
                className={styles.infoBannerClose}
                onClick={() => setShowBanner(false)}
                aria-label="Close"
              >
                <Close size="small" />
              </button>
            </div>
          )}
        </div>

        <div className={styles.fileFormatsSection}>
          <p className={styles.acceptedFormats}>
            Use one of our accepted file formats: .jpeg, .jpg, png, or .pdf.
          </p>

          <div
            className={styles.uploadZone}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className={styles.uploadZoneInner}>
              <p className={styles.uploadZoneLabel}>
                Drag and drop documents anywhere in the dotted lines or select another option
              </p>

              <button className={styles.uploadOption} onClick={handleUploadClick}>
                <div className={styles.uploadOptionIcon}>
                  <Upload size="medium" />
                </div>
                <div className={styles.uploadOptionText}>
                  <span className={styles.uploadOptionTitle}>Upload from this device</span>
                  <span className={styles.uploadOptionSubtitle}>Browse and select documents to upload</span>
                </div>
              </button>

              <div className={styles.uploadOption} role="button" tabIndex={0}>
                <div className={styles.uploadOptionIcon}>
                  <CloudUpload size="medium" />
                </div>
                <div className={styles.uploadOptionText}>
                  <span className={styles.uploadOptionTitle}>Get from cloud apps</span>
                  <span className={styles.uploadOptionSubtitle}>Connect a cloud account to import</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.dropdownWrapper}>
            <Dropdown
              label="Select the Tax year for this file?"
              value="2024"
            >
              <MenuItem value="2024">2024</MenuItem>
              <MenuItem value="2023">2023</MenuItem>
              <MenuItem value="2022">2022</MenuItem>
            </Dropdown>
          </div>

          <a className={styles.learnMore} href="#" onClick={e => e.preventDefault()}>
            Learn how to Import a 1040
          </a>
        </div>
      </div>
    </div>
  )
}
