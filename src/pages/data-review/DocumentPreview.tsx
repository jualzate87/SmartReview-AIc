import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomOut, ZoomIn } from '@design-systems/icons'
import styles from '../../styles/data-review/DocumentPreview.module.css'

interface DocumentPreviewProps {
  imageSrc?: string | string[]
  alt: string
  /** When set, renders custom content instead of image(s) */
  customContent?: React.ReactNode
}

const ZOOM_LEVELS = [50, 60, 65, 70, 75, 85, 100, 125, 150, 200]

export default function DocumentPreview({ imageSrc, alt, customContent }: DocumentPreviewProps) {
  const [zoomIndex, setZoomIndex] = useState(5) // default 85%
  const zoom = ZOOM_LEVELS[zoomIndex]
  const images = imageSrc ? (Array.isArray(imageSrc) ? imageSrc : [imageSrc]) : []

  const zoomOut = () => setZoomIndex(i => Math.max(0, i - 1))
  const zoomIn  = () => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))

  // ── Click-and-drag panning ──
  const imageAreaRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })
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
      if (e.deltaY > 0) setZoomIndex(i => Math.max(0, i - 1))
      else              setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div className={styles.container}>
      {/* Scrollable image area */}
      <div
        ref={imageAreaRef}
        className={styles.imageArea}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
      >
        <div className={styles.imageAreaInner}>
          <div style={{ position: 'relative', width: customContent ? '100%' : `${zoom}%`, lineHeight: 0, flexShrink: 0 }}>
            {customContent ?? images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={images.length > 1 ? `${alt} — page ${i + 1}` : alt}
                className={styles.documentImage}
                draggable={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Zoom toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarControls}>
          <span className={styles.zoomLevel}>{zoom}%</span>
          <button
            className={styles.toolbarBtn}
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={zoomIndex === 0}
          >
            <ZoomOut size="medium" />
          </button>
          <button
            className={styles.toolbarBtn}
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          >
            <ZoomIn size="medium" />
          </button>
        </div>
      </div>
    </div>
  )
}
