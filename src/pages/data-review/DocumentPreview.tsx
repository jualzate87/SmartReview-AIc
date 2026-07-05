import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomOut, ZoomIn } from '@design-systems/icons'
import styles from '../../styles/data-review/DocumentPreview.module.css'

type DocType = 'w2' | '1099-int' | '1099-div' | 'k1' | '1040'

interface FieldOverlay {
  left: string; top: string; width: string; height: string
}

// Overlay positions (%) measured via pixel-level border scan on each PNG
// W-2 (both): 2284×1540px — wages row y=66–185; Box1/2 split x=1724; right edge x=2213
// 1099-INT (MegaBank): 1146×762px — value col x=542–742; Box1 y=54–197; Box2 y=197–269
// 1099-DIV (Citigroup): 1400×620px — box row y=277–370; Box1a x=2–200; Box1b x=200–390
const OVERLAYS: Record<DocType, Partial<Record<string, FieldOverlay>>> = {
  'w2': {
    // Box 1  "1 Wages, tips"  x=1100–1724, y=148–265  (pixel-verified, below OMB row border)
    wages:       { left: '48.2%', top: '9.6%', width: '27.3%', height: '7.6%' },
    // Box 2  "2 Federal income tax withheld"  x=1724–2213, y=148–265
    withholding: { left: '75.5%', top: '9.6%', width: '21.4%', height: '7.6%' },
    // Box 12a  x=1240–2212, y=474–554
    box12:       { left: '54.3%', top: '30.8%', width: '42.6%', height: '5.2%' },
  },
  '1099-int': {
    // Box 1  "1 Interest income"  x=542–742, y=54–197
    taxableInterest: { left: '47.3%', top: '7.1%',  width: '17.5%', height: '18.8%' },
    // Box 2  "2 Early withdrawal penalty"  x=542–742, y=197–269
    earlyWithdrawal: { left: '47.3%', top: '25.9%', width: '17.5%', height:  '9.4%' },
  },
  '1099-div': {
    // Box 1a  "Total ordinary dividends"  x=2–200, y=277–370
    ordinaryDivs:  { left: '0.1%',  top: '44.7%', width: '14.1%', height: '15.0%' },
    // Box 1b  "Qualified dividends"        x=200–390, y=277–370
    qualifiedDivs: { left: '14.3%', top: '44.7%', width: '13.6%', height: '15.0%' },
  },
  'k1': {},
  '1040': {},
}

interface DocumentPreviewProps {
  imageSrc: string
  alt: string
  selectedField?: string | null
  highlightMode?: 'orange' | 'blue'
  docType?: DocType
}

const ZOOM_LEVELS = [50, 60, 65, 70, 75, 85, 100, 125, 150, 200]

export default function DocumentPreview({ imageSrc, alt, selectedField, highlightMode = 'blue', docType = 'w2' }: DocumentPreviewProps) {
  const [zoomIndex, setZoomIndex] = useState(5) // default 85%
  const zoom = ZOOM_LEVELS[zoomIndex]

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

  // Find if there's an overlay for the currently selected field on this doc type
  const overlay = selectedField ? OVERLAYS[docType]?.[selectedField] : undefined

  return (
    <div className={styles.container}>
      {/* Scrollable image area */}
      <div
        ref={imageAreaRef}
        className={styles.imageArea}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
      >
        <div style={{ position: 'relative', width: `${zoom}%`, lineHeight: 0, flexShrink: 0 }}>
          <img
            src={imageSrc}
            alt={alt}
            className={styles.documentImage}
            draggable={false}
          />

          {/* Field highlight overlay — marker-pen style highlight over the field */}
          {overlay && (
            <div
              style={{
                position: 'absolute',
                left:   overlay.left,
                top:    overlay.top,
                width:  overlay.width,
                height: overlay.height,
                background: highlightMode === 'orange'
                  ? 'rgba(201, 80, 15, 0.22)'
                  : 'rgba(32, 94, 163, 0.18)',
                outline: highlightMode === 'orange'
                  ? '3px solid rgba(201, 80, 15, 0.7)'
                  : '3px solid rgba(32, 94, 163, 0.7)',
                outlineOffset: '1px',
                borderRadius: '2px',
                pointerEvents: 'none',
                zIndex: 3,
                transition: 'opacity 200ms ease',
                boxShadow: highlightMode === 'orange'
                  ? '0 0 0 4px rgba(201, 80, 15, 0.08)'
                  : '0 0 0 4px rgba(32, 94, 163, 0.08)',
              }}
            />
          )}
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
