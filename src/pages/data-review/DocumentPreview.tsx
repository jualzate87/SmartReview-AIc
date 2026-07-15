import { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomOut, ZoomIn, Search } from '@design-systems/icons'
import styles from '../../styles/data-review/DocumentPreview.module.css'

interface DocumentPreviewProps {
  imageSrc?: string | string[]
  alt: string
  /** When set, renders custom content instead of image(s) */
  customContent?: React.ReactNode
}

const ZOOM_LEVELS = [50, 60, 65, 70, 75, 85, 100, 125, 150, 200]
const LOUPE_DIAMETER = 210
const LOUPE_ZOOM = 2

type LoupeState = {
  visible: boolean
  left: number
  top: number
  backgroundImage: string
  backgroundSize: string
  backgroundPosition: string
}

const HIDDEN_LOUPE: LoupeState = {
  visible: false,
  left: 0,
  top: 0,
  backgroundImage: 'none',
  backgroundSize: '0 0',
  backgroundPosition: '0 0',
}

export default function DocumentPreview({ imageSrc, alt, customContent }: DocumentPreviewProps) {
  const [zoomIndex, setZoomIndex] = useState(5) // default 85%
  const zoom = ZOOM_LEVELS[zoomIndex]
  const images = imageSrc ? (Array.isArray(imageSrc) ? imageSrc : [imageSrc]) : []
  const canMagnify = !customContent && images.length > 0

  const [magnifyOn, setMagnifyOn] = useState(false)
  const [loupe, setLoupe] = useState<LoupeState>(HIDDEN_LOUPE)

  const zoomOut = () => setZoomIndex(i => Math.max(0, i - 1))
  const zoomIn  = () => setZoomIndex(i => Math.min(ZOOM_LEVELS.length - 1, i + 1))

  // ── Click-and-drag panning ──
  const imageAreaRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ active: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (magnifyOn) return
    if (e.button !== 0) return
    const el = imageAreaRef.current
    if (!el) return
    dragState.current = { active: true, startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop }
    setIsDragging(false)
  }, [magnifyOn])

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

  // Clear loupe whenever magnify is turned off; disable when no image preview
  useEffect(() => {
    if (!magnifyOn) setLoupe(HIDDEN_LOUPE)
  }, [magnifyOn])

  useEffect(() => {
    if (!canMagnify && magnifyOn) {
      setMagnifyOn(false)
      setLoupe(HIDDEN_LOUPE)
    }
  }, [canMagnify, magnifyOn])

  const updateLoupe = useCallback((clientX: number, clientY: number) => {
    const area = imageAreaRef.current
    if (!area) {
      setLoupe(HIDDEN_LOUPE)
      return
    }

    const imgs = area.querySelectorAll<HTMLImageElement>('img')
    let hit: HTMLImageElement | null = null
    for (const img of imgs) {
      const r = img.getBoundingClientRect()
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
        hit = img
        break
      }
    }

    if (!hit) {
      setLoupe(HIDDEN_LOUPE)
      return
    }

    const rect = hit.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const bgW = rect.width * LOUPE_ZOOM
    const bgH = rect.height * LOUPE_ZOOM
    const bgPosX = -(x * LOUPE_ZOOM - LOUPE_DIAMETER / 2)
    const bgPosY = -(y * LOUPE_ZOOM - LOUPE_DIAMETER / 2)
    const src = hit.currentSrc || hit.src

    setLoupe({
      visible: true,
      left: clientX - LOUPE_DIAMETER / 2,
      top: clientY - LOUPE_DIAMETER / 2,
      backgroundImage: `url("${src}")`,
      backgroundSize: `${bgW}px ${bgH}px`,
      backgroundPosition: `${bgPosX}px ${bgPosY}px`,
    })
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!magnifyOn) return
    updateLoupe(e.clientX, e.clientY)
  }, [magnifyOn, updateLoupe])

  const onPointerLeave = useCallback(() => {
    if (!magnifyOn) return
    setLoupe(HIDDEN_LOUPE)
  }, [magnifyOn])

  const toggleMagnify = () => {
    setMagnifyOn(on => !on)
  }

  const areaCursor = magnifyOn
    ? (loupe.visible ? 'none' : 'crosshair')
    : (isDragging ? 'grabbing' : 'grab')

  return (
    <div className={styles.container}>
      {/* Scrollable image area */}
      <div
        ref={imageAreaRef}
        className={styles.imageArea}
        style={{ cursor: areaCursor }}
        onMouseDown={onMouseDown}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
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

      {magnifyOn && loupe.visible && (
        <div
          className={styles.loupe}
          aria-hidden="true"
          style={{
            left: loupe.left,
            top: loupe.top,
            width: LOUPE_DIAMETER,
            height: LOUPE_DIAMETER,
            backgroundImage: loupe.backgroundImage,
            backgroundSize: loupe.backgroundSize,
            backgroundPosition: loupe.backgroundPosition,
          }}
        />
      )}

      {/* Zoom toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarControls}>
          <span className={styles.zoomLevel}>{zoom}%</span>
          <button
            type="button"
            className={styles.toolbarBtn}
            aria-label="Zoom out"
            onClick={zoomOut}
            disabled={zoomIndex === 0}
          >
            <ZoomOut size="medium" />
          </button>
          <button
            type="button"
            className={styles.toolbarBtn}
            aria-label="Zoom in"
            onClick={zoomIn}
            disabled={zoomIndex === ZOOM_LEVELS.length - 1}
          >
            <ZoomIn size="medium" />
          </button>
          {canMagnify && (
            <button
              type="button"
              className={`${styles.toolbarBtn} ${magnifyOn ? styles.toolbarBtnActive : ''}`}
              aria-label="Magnify"
              aria-pressed={magnifyOn}
              title="Magnify"
              onClick={toggleMagnify}
            >
              <Search size="medium" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
