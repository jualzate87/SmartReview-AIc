import { ZoomOut, ZoomIn, DotsSix } from '@design-systems/icons'
import { useState, useRef, useCallback, useEffect } from 'react'
import img1040PriorPage1 from '../../assets/jessica-1040-2024-variant-1.png'
import img1040PriorPage2 from '../../assets/jessica-1040-2024-variant-2.png'
import { PRIOR_YEAR_1040_FIELDS } from './priorYear1040Data'
import styles from '../../styles/data-review/PriorYear1040Panel.module.css'
import docStyles from '../../styles/data-review/DocumentPreview.module.css'
import dragStyles from '../../styles/data-review/DragHandle.module.css'

const ZOOM_LEVELS = [50, 60, 65, 70, 75, 85, 100, 125, 150, 200]

const PRIOR_YEAR_FIELDS = PRIOR_YEAR_1040_FIELDS

export default function PriorYear1040Panel() {
  const [zoomIndex, setZoomIndex] = useState(5) // 85%
  const zoom = ZOOM_LEVELS[zoomIndex]

  // ── Vertical split between doc image and fields (% of panel height) ──
  const [docHeightPct, setDocHeightPct] = useState(97)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleSplitDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return
    const startY = e.clientY
    const startPct = docHeightPct
    const totalH = container.getBoundingClientRect().height

    const onMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startY
      const newPct = Math.min(97, Math.max(10, startPct + (dy / totalH) * 100))
      setDocHeightPct(newPct)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [docHeightPct])

  // ── Click-and-drag panning ──
  const imageAreaRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ active: boolean; startX: number; startY: number; scrollLeft: number; scrollTop: number }>({
    active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0,
  })
  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const el = imageAreaRef.current
    if (!el) return
    dragState.current = { active: true, startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
    setIsDragging(false)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragState.current.active) return
      const dx = e.clientX - dragState.current.startX
      const dy = e.clientY - dragState.current.startY
      if (!isDragging && Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      setIsDragging(true)
      const el = imageAreaRef.current
      if (!el) return
      el.scrollLeft = dragState.current.scrollLeft - dx
      el.scrollTop  = dragState.current.scrollTop  - dy
    }
    const onMouseUp = () => {
      dragState.current.active = false
      setTimeout(() => setIsDragging(false), 0)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  // ── Trackpad pinch-to-zoom — non-passive to allow preventDefault ──
  useEffect(() => {
    const el = imageAreaRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()
      if (e.deltaY > 0) {
        setZoomIndex(i => Math.max(0, i - 1))
      } else {
        setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div ref={containerRef} className={styles.container}>
      {/* Document image — height controlled by split */}
      <div className={styles.docSection} style={{ height: `${docHeightPct}%` }}>
        <div
          ref={imageAreaRef}
          className={docStyles.imageArea}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={onMouseDown}
        >
          <div style={{ position: 'relative', width: `${zoom}%`, lineHeight: 0, flexShrink: 0 }}>
            <img src={img1040PriorPage1} alt="Form 1040 (2024) page 1 — Jessica Drake" className={docStyles.documentImage} draggable={false} />
            <img src={img1040PriorPage2} alt="Form 1040 (2024) page 2 — Jessica Drake" className={docStyles.documentImage} draggable={false} />
          </div>
        </div>
        <div className={docStyles.toolbar}>
          <div className={docStyles.toolbarControls}>
            <span className={docStyles.zoomLevel}>{zoom}%</span>
            <button className={docStyles.toolbarBtn} aria-label="Zoom out" onClick={() => setZoomIndex(i => Math.max(0, i - 1))} disabled={zoomIndex === 0}>
              <ZoomOut size="medium" />
            </button>
            <button className={docStyles.toolbarBtn} aria-label="Zoom in" onClick={() => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))} disabled={zoomIndex === ZOOM_LEVELS.length - 1}>
              <ZoomIn size="medium" />
            </button>
          </div>
        </div>
        {/* Drag handle pinned inside docSection so it's always visible */}
        <div className={dragStyles.handleHorizontal} onMouseDown={handleSplitDrag}>
          <DotsSix size="small" className={`${dragStyles.handleIcon} ${dragStyles.rotated90}`} />
        </div>
      </div>

      {/* Extracted fields — remaining height */}
      <div className={styles.fieldsSection}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Prior Year 1040 (2024)</h2>
        </div>
        <div className={styles.subHeader}>Jessica Drake · Austin, TX</div>

        <div className={styles.fieldsBody}>
          {PRIOR_YEAR_FIELDS.map((row, i) => {
            if (row.section) {
              return <div key={i} className={styles.sectionLabel}>{row.section}</div>
            }
            return (
              <div key={i} className={`${styles.fieldRow} ${row.bold ? styles.fieldRowBold : ''}`}>
                <span className={styles.lineNum}>{row.line}</span>
                <span className={styles.fieldLabel}>{row.label}</span>
                <span className={styles.fieldAmount}>{row.amount}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
