import { OverflowWeb, ZoomOut, ZoomIn, FitToWidth, NewWindow, ArrowUp, ArrowDown } from '@design-systems/icons'
import w2Preview from '../../assets/w2-preview.png'
import styles from '../../styles/automated/LeftPanel.module.css'

export default function LeftPanel() {
  return (
    <div className={styles.leftPanel}>
      {/* Top file header */}
      <div className={styles.fileHeader}>
        <div className={styles.fileHeaderInfo}>
          <span className={styles.fileName}>W-2 Tech Circle.pdf</span>
          <span className={styles.fileDetails}>W-2 - Uploaded Feb 8</span>
        </div>
        <button className={styles.fileHeaderMenu} aria-label="More options">
          <OverflowWeb size="medium" />
        </button>
      </div>

      {/* Document viewer */}
      <div className={styles.documentViewer}>
        <img
          src={w2Preview}
          alt="W-2 Tech Circle document preview"
          className={styles.documentImage}
        />
      </div>

      {/* Bottom toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarControls}>
          {/* Zoom level indicator */}
          <span className={styles.zoomLevel}>100%</span>

          {/* Zoom out */}
          <button className={styles.toolbarBtn} aria-label="Zoom out">
            <ZoomOut size="medium" />
          </button>

          {/* Zoom in */}
          <button className={styles.toolbarBtn} aria-label="Zoom in">
            <ZoomIn size="medium" />
          </button>

          {/* Fit to width */}
          <button className={styles.toolbarBtn} aria-label="Fit to width">
            <FitToWidth size="medium" />
          </button>

          {/* New window */}
          <button className={styles.toolbarBtn} aria-label="Open in new window">
            <NewWindow size="medium" />
          </button>

          {/* Divider */}
          <div className={styles.toolbarDivider} />

          {/* Page controls */}
          <div className={styles.pageControls}>
            <span className={styles.pageLabel}>Page</span>
            <span className={styles.pageNumber}>1 </span>
            <span className={styles.pageTotal}>/ 2</span>
          </div>

          {/* Page up */}
          <button className={styles.pageNavBtn} aria-label="Previous page">
            <ArrowUp size="small" />
          </button>

          {/* Page down */}
          <button className={styles.pageNavBtn} aria-label="Next page">
            <ArrowDown size="small" />
          </button>
        </div>
      </div>
    </div>
  )
}
