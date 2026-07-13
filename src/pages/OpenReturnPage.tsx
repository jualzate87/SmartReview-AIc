import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CloudUpload, Upload,
  OverflowWeb, ChevronDown, ChevronUp, Download, Copy,
  Notification, Settings, Lock, List, Edit,
  Checklist, Send, CircleClock, Rocket,
} from '@design-systems/icons'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import { Badge } from '@ids-ts/badge'
import '@ids-ts/badge/dist/main.css'
import { IconControl } from '@ids-ts/icon-control'
import '@ids-ts/icon-control/dist/main.css'
import { Checkbox } from '@ids-ts/checkbox'
import '@ids-ts/checkbox/dist/main.css'
import ToastMessage from '@ids-ts/toast-message'
import '@ids-ts/toast-message/dist/main.css'
import sparklesIcon from '../assets/icons/sparkles.svg'
import inventoryIcon from '../assets/icons/inventory-stock-report.svg'
import helpIcon from '../assets/icons/help-icon.svg'
import readyToImportIcon from '../assets/icons/ready-to-import.svg'
import sidebarTaxOrganizerIcon from '../assets/icons/sidebar-tax-organizer.svg'
import sidebarImportHubIcon from '../assets/icons/sidebar-import-hub.svg'
import sidebarDocumentsListIcon from '../assets/icons/sidebar-documents-list.svg'
import sidebarClientActivityIcon from '../assets/icons/sidebar-client-activity.svg'
import sidebarFlaggedItemsIcon from '../assets/icons/sidebar-flagged-items.svg'
import sidebarCommentsIcon from '../assets/icons/sidebar-comments.svg'
import ProConnectNav from './ProConnectNav'
import { SOURCE_DOCUMENTS } from '../data/sourceDocuments'
import styles from '../styles/OpenReturnPage.module.css'

type Step = 1 | 2 | 3 | 4 | 5

const CHECKLIST_ITEMS = SOURCE_DOCUMENTS.map(doc => ({
  id: doc.id,
  type: doc.formType,
  label: doc.label,
}))

/** Received tab rows — derived from canonical source document list. */
const RECEIVED_DOCS = SOURCE_DOCUMENTS.map(doc => ({
  id: doc.id,
  name: doc.label,
  status: 'Ready to import',
  type: doc.formType,
  date: 'Jun 27',
}))

export default function OpenReturnPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(4)

  // Prevent browser back button from leaving this page during the test
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const [progress, setProgress] = useState(2)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [checklistOpen, setChecklistOpen] = useState(true)
  const [lastYearOpen, setLastYearOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const processFiles = (files: File[]) => {
    if (!files.length) return
    const names = files.map(f => f.name)
    setUploadedFiles(names)
    setStep(3)
    setToastOpen(true)
    timerRef.current = setTimeout(() => setStep(4), 2000)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    dragCounterRef.current = 0
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    processFiles(files)
    e.target.value = ''
  }

  // Step 1 and 5: animate progress bar then auto-advance
  useEffect(() => {
    if (step !== 1 && step !== 5) return
    setProgress(2)
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          timerRef.current = setTimeout(() => {
            if (step === 1) setStep(2)
            else navigate('/smart-return')
          }, 400)
          return 100
        }
        return Math.min(100, p + 2)
      })
    }, 40)
    return () => {
      clearInterval(interval)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [step, navigate])

  // Force Intuit blue tokens
  useEffect(() => {
    const el = document.documentElement
    const prev = el.getAttribute('data-theme')
    el.setAttribute('data-theme', 'intuit')
    el.style.setProperty('--color-action-standard', '#205ea3')
    el.style.setProperty('--color-action-standard-hover', '#174d87')
    return () => {
      if (prev) el.setAttribute('data-theme', prev)
      el.style.removeProperty('--color-action-standard')
      el.style.removeProperty('--color-action-standard-hover')
    }
  }, [])

  return (
    <div
      className={styles.page}
      data-theme="intuit"
      style={{
        '--color-action-standard': '#205ea3',
        '--color-action-standard-hover': '#174d87',
        '--color-action-standard-active': '#174d87',
        '--color-ui-secondary': '#21262a',
      } as React.CSSProperties}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <ToastMessage
        open={toastOpen}
        actionLabel="Dismiss"
        dismissible
        duration={4000}
        showIcon
        onClose={() => setToastOpen(false)}
        onActionClick={() => setToastOpen(false)}
      >
        Document uploaded successfully
      </ToastMessage>

      <div className={styles.rightSide}>
        {/* ── Top product bar ── */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <span className={styles.firmName}>HONEY TAX ACCOUNTING</span>
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.topNavBtn}><img src={helpIcon} alt="" style={{width:20,height:20}} /><span>Help</span></button>
            <button className={styles.topNavBtn}><Notification size="small" /><span>Notifications</span></button>
            <button className={styles.topNavBtn}><Settings size="small" /><span>Settings</span></button>
            <div className={styles.avatar}>S</div>
          </div>
        </div>

        {/* ── Return sub-header ── */}
        <div className={styles.returnSubHeader}>
          <div className={styles.returnSubHeaderLeft}>
            {/* Client name */}
            <div className={styles.clientName}>
              <span className={styles.clientNameText}>Jessica</span>
              <span className={styles.clientNameText}>Drake</span>
            </div>
            {/* Lock icon */}
            <div className={styles.lockIcon}><Lock size="small" /></div>
            {/* Client profile button */}
            <button className={styles.clientProfileBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#5d686f"/></svg>
              Client profile
            </button>
            {/* Divider */}
            <div className={styles.subHeaderDivider} />
            {/* Tax year */}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Tax year</span>
              <div className={styles.metaValue}>
                <span className={styles.metaValueText}>2025</span>
                <span className={styles.metaInfoIcon}><ChevronDown size="xsmall" /></span>
              </div>
            </div>
            {/* Return type */}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Return type</span>
              <div className={styles.metaValue}>
                <span className={styles.metaValueText}>1040</span>
                <span className={styles.metaInfoIcon}><ChevronDown size="xsmall" /></span>
              </div>
            </div>
          </div>
          <div className={styles.returnSubHeaderRight}>
            {/* Presence avatars */}
            <div className={styles.presenceGroup}>
              <div className={styles.presenceAvatar} style={{ background: '#236cff' }}>D</div>
              <div className={styles.presenceAvatar} style={{ background: '#7c00f6' }}>H</div>
              <div className={`${styles.presenceAvatar} ${styles.presenceOverflow}`}>+1</div>
            </div>
            {/* Select Assignee */}
            <button className={styles.dropdownBtn}>
              Select Assignee <ChevronDown size="small" />
            </button>
            {/* Select Status */}
            <button className={styles.dropdownBtn}>
              Select Status <ChevronDown size="small" />
            </button>
            {/* Return actions */}
            <button className={styles.returnActionsBtn}>
              Return actions <ChevronDown size="small" />
            </button>
          </div>
        </div>

        {/* ── Tabs row ── */}
        <div className={styles.tabsRow}>
          <div className={styles.tabsRowLeft}>
            {[
              { icon: List, label: 'Profile', active: false, onClick: () => {} },
              { icon: Rocket, label: 'SmartReturn', active: true, onClick: () => {} },
              { icon: Edit, label: 'Input return', active: false, onClick: () => {} },
              { icon: Checklist, label: 'Check return', active: false, onClick: () => {} },
              { icon: Send, label: 'File return', active: false, onClick: () => {} },
            ].map(tab => {
              const IconComp = tab.icon
              return (
                <button key={tab.label} className={`${styles.tab} ${tab.active ? styles.tabActive : ''}`} onClick={tab.onClick}>
                  <div className={styles.tabContent}>
                    <IconComp size="small" style={{ color: tab.active ? '#21262a' : '#5d686f' }} />
                    <span className={styles.tabLabel}>{tab.label}</span>
                  </div>
                  <div className={styles.tabStroke} />
                </button>
              )
            })}
          </div>
          <div className={styles.tabsRowRight}>
            <div className={styles.tabsMeta}>
              <div className={styles.tabsMetaItem}>
                <CloudUpload size="small" />
                Saved at 11:34 AM
              </div>
              <div className={styles.tabsMetaItem}>
                <CircleClock size="small" />
                Prep time: 0 mins
              </div>
            </div>
            <button className={styles.refreshFormsBtn}>Refresh forms</button>
          </div>
        </div>

      <div className={styles.body}>
        <div className={styles.main}>

          {/* ── STEP 1: Loading ── */}
          {step === 1 && (
            <div className={styles.loadingState}>
              <div className={styles.loadingIllustration}>
                <img src={inventoryIcon} alt="" className={styles.loadingIcon} />
              </div>
              <p className={styles.loadingText}>Preparing documents for extraction</p>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* ── STEP 5: Importing / loading before SmartReturn ── */}
          {step === 5 && (
            <div className={styles.loadingState}>
              <div className={styles.loadingIllustration}>
                <img src={inventoryIcon} alt="" className={styles.loadingIcon} />
              </div>
              <p className={styles.loadingText}>Importing documents to SmartReturn…</p>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* ── STEP 2: Let's get Jessica's documents ── */}
          {step === 2 && (
            <div className={styles.contentArea}>
              <div className={styles.pageHeading}>
                <h1 className={styles.pageTitle}>Let's get Jessica's documents</h1>
                <p className={styles.pageSubtitle}>Gather your client's documents from the checklist, and import them all at once.</p>
              </div>

              {/* Upload zone — normal state, drag-and-drop enabled */}
              <div
                className={`${styles.uploadZone} ${isDragging ? styles.uploadZoneDragging : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <p className={styles.uploadZoneLabel}>Drop files here or click to upload</p>
                <div className={styles.uploadCards}>
                  <button className={styles.uploadCard} onClick={handleUploadClick}>
                    <Upload size="large" className={styles.uploadCardIcon} />
                    <span className={styles.uploadCardLabel}>Upload from this device</span>
                  </button>
                  <button className={styles.uploadCard}>
                    <CloudUpload size="large" className={styles.uploadCardIcon} />
                    <span className={styles.uploadCardLabel}>Get from cloud apps</span>
                  </button>
                </div>
              </div>

              {/* Checklist */}
              <div className={styles.checklist}>
                <button className={styles.checklistHeader} onClick={() => setChecklistOpen(o => !o)}>
                  <div className={styles.checklistHeaderLeft}>
                    <img src={sparklesIcon} alt="" className={styles.checklistHeaderIcon} />
                    <span className={styles.checklistHeaderTitle}>Tax year 2025 document checklist</span>
                  </div>
                  <div className={styles.checklistHeaderRight}>
                    <Button priority="tertiary" size="small">
                      {checklistOpen ? 'Show less' : 'Show more'}
                      {checklistOpen ? <ChevronUp size="small" /> : <ChevronDown size="small" />}
                    </Button>
                  </div>
                </button>

                {checklistOpen && (
                  <>
                    <div className={styles.checklistTabs}>
                      <span className={`${styles.checklistTab} ${styles.checklistTabActive}`}>
                        Needed <Badge status="info" value={CHECKLIST_ITEMS.length} />
                      </span>
                    </div>
                    <div className={styles.checklistBody}>
                      <p className={styles.checklistDescription}>
                        We've pre-filled this checklist based on last year's return. Review the checklist and add or remove items as needed.
                      </p>
                      {CHECKLIST_ITEMS.map(item => (
                        <div key={item.id} className={styles.checklistRow}>
                          <div className={styles.checklistRowInfo}>
                            <span className={styles.checklistRowType}>{item.type}</span>
                            <span className={styles.checklistRowLabel}>{item.label}</span>
                          </div>
                          <IconControl aria-label="More options" size="small" shape="square"><OverflowWeb /></IconControl>
                        </div>
                      ))}
                    </div>
                    <div className={styles.checklistFooter}>
                      <IconControl aria-label="Copy" size="small" shape="square"><Copy /></IconControl>
                      <IconControl aria-label="Download" size="small" shape="square"><Download /></IconControl>
                      <div className={styles.checklistFooterActions}>
                        <Button priority="tertiary" onClick={() => {}}>Edit request</Button>
                        <Button priority="secondary" onClick={() => { setUploadedFiles([]); setStep(3); timerRef.current = setTimeout(() => setStep(4), 2500) }}>Send Link request</Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Uploading / drag-active state ── */}
          {step === 3 && (
            <div className={styles.contentArea}>
              <div className={styles.pageHeading}>
                <h1 className={styles.pageTitle}>Let's get Jessica's documents</h1>
                <p className={styles.pageSubtitle}>Gather your client's documents from the checklist, and import them all at once.</p>
              </div>

              {/* Upload zone — drag active (blue border, actual filenames as chips) */}
              <div className={styles.uploadZoneActive}>
                {uploadedFiles.length > 0 && (
                  <div className={styles.uploadZoneActivePdfs}>
                    {uploadedFiles.slice(0, 3).map(name => (
                      <span key={name} className={styles.pdfChip} style={{ background: '#dc2626' }}>
                        {name.length > 14 ? name.slice(0, 12) + '…' : name}
                      </span>
                    ))}
                    {uploadedFiles.length > 3 && (
                      <span className={styles.pdfChipBadge}>
                        <span className={styles.pdfChip} style={{ background: '#dc2626' }}>
                          {uploadedFiles[3].slice(0, 10) + '…'}
                        </span>
                        <span className={styles.pdfChipCount}>{uploadedFiles.length}</span>
                      </span>
                    )}
                  </div>
                )}
                <Upload size="large" className={styles.uploadActiveIcon} />
                <p className={styles.uploadActiveTitle}>Uploading {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}…</p>
                <p className={styles.uploadActiveSubtitle}>Please wait while we process your documents</p>
                <div className={styles.uploadingBar}>
                  <div className={styles.uploadingBarFill} />
                </div>
              </div>

              {/* Checklist — still showing Needed tab with 5 badge */}
              <div className={styles.checklist}>
                <button className={styles.checklistHeader} onClick={() => setChecklistOpen(o => !o)}>
                  <div className={styles.checklistHeaderLeft}>
                    <img src={sparklesIcon} alt="" className={styles.checklistHeaderIcon} />
                    <span className={styles.checklistHeaderTitle}>Tax year 2025 document checklist</span>
                  </div>
                  <div className={styles.checklistHeaderRight}>
                    <Button priority="tertiary" size="small">
                      {checklistOpen ? 'Show less' : 'Show more'}
                      {checklistOpen ? <ChevronUp size="small" /> : <ChevronDown size="small" />}
                    </Button>
                  </div>
                </button>

                {checklistOpen && (
                  <>
                    <div className={styles.checklistTabs}>
                      <span className={`${styles.checklistTab} ${styles.checklistTabActive}`}>
                        Needed <span className={styles.tabBadge}>{CHECKLIST_ITEMS.length}</span>
                      </span>
                    </div>
                    <div className={styles.checklistBody}>
                      <p className={styles.checklistDescription}>
                        We've pre-filled this checklist based on last year's return. Review the checklist and add or remove items as needed.
                      </p>
                      {CHECKLIST_ITEMS.map(item => (
                        <div key={item.id} className={styles.checklistRow}>
                          <div className={styles.checklistRowInfo}>
                            <span className={styles.checklistRowType}>{item.type}</span>
                            <span className={styles.checklistRowLabel}>{item.label}</span>
                          </div>
                          <IconControl aria-label="More options" size="small" shape="square"><OverflowWeb /></IconControl>
                        </div>
                      ))}
                    </div>
                    <div className={styles.checklistFooter}>
                      <IconControl aria-label="Copy" size="small" shape="square"><Copy /></IconControl>
                      <IconControl aria-label="Download" size="small" shape="square"><Download /></IconControl>
                      <div className={styles.checklistFooterActions}>
                        <Button priority="tertiary" onClick={() => {}}>Edit request</Button>
                        <Button priority="secondary" onClick={() => setStep(4)}>Send Link request</Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: You're making progress ── */}
          {step === 4 && (
            <div className={styles.contentArea}>
              <div className={styles.pageHeading}>
                <h1 className={styles.pageTitle}>You're making progress</h1>
                <p className={styles.pageSubtitle}>When you're ready, select documents to import. We'll import them and take you to review your return.</p>
              </div>

              {/* Upload zone — normal */}
              <div className={styles.uploadZone}>
                <p className={styles.uploadZoneLabel}>Drop files here or click to upload</p>
                <div className={styles.uploadCards}>
                  <button className={styles.uploadCard}>
                    <Upload size="large" className={styles.uploadCardIcon} />
                    <span className={styles.uploadCardLabel}>Upload from this device</span>
                  </button>
                  <button className={styles.uploadCard}>
                    <CloudUpload size="large" className={styles.uploadCardIcon} />
                    <span className={styles.uploadCardLabel}>Get from cloud apps</span>
                  </button>
                </div>
              </div>

              {/* Checklist — SENT badge + Received/Needed tabs + table */}
              <div className={styles.checklist}>
                <button className={styles.checklistHeader} onClick={() => setChecklistOpen(o => !o)}>
                  <div className={styles.checklistHeaderLeft}>
                    <img src={sparklesIcon} alt="" className={styles.checklistHeaderIcon} />
                    <span className={styles.checklistHeaderTitle}>Tax year 2025 document checklist</span>
                    <span className={styles.sentBadgePill}>SENT</span>
                  </div>
                  <div className={styles.checklistHeaderRight}>
                    <Button priority="tertiary" size="small">
                      {checklistOpen ? 'Show less' : 'Show more'}
                      {checklistOpen ? <ChevronUp size="small" /> : <ChevronDown size="small" />}
                    </Button>
                  </div>
                </button>

                {checklistOpen && (
                  <>
                    <div className={styles.checklistTabs}>
                      <span className={`${styles.checklistTab} ${styles.checklistTabActive}`}>
                        Received <span className={styles.tabBadge}>{RECEIVED_DOCS.length}</span>
                      </span>
                      <span className={styles.checklistTab}>
                        Needed <span className={styles.tabBadge}>0</span>
                      </span>
                    </div>
                    <div className={styles.checklistBody}>
                      {/* Sticky header + scrollable rows (~6 visible) */}
                      <div className={styles.tableScroll}>
                        <div className={styles.tableHeader}>
                          <div className={styles.tableCheckAll}>
                            <Checkbox defaultChecked size="small" onChange={() => {}} />
                          </div>
                          <span className={styles.tableColName}>Name ↕</span>
                          <span className={styles.tableColStatus}>Import status</span>
                          <span className={styles.tableColType}>Type ↕</span>
                          <span className={styles.tableColDate}>Updated ↕</span>
                          <span className={styles.tableColMenu}></span>
                        </div>

                        <div className={styles.tableRows}>
                          {RECEIVED_DOCS.map(doc => (
                            <div key={doc.id} className={styles.tableRow}>
                              <div className={styles.tableCheckAll}>
                                <Checkbox defaultChecked size="small" onChange={() => {}} />
                              </div>
                              <a className={styles.tableDocName}>{doc.name}</a>
                              <div className={styles.tableStatus}>
                                <img src={readyToImportIcon} alt="" className={styles.statusIcon} />
                                <span className={styles.statusText}>{doc.status}</span>
                              </div>
                              <div className={styles.tableType}>
                                <span className={styles.typeText}>{doc.type}</span>
                                <ChevronDown size="xsmall" />
                              </div>
                              <span className={styles.tableDate}>{doc.date}</span>
                              <IconControl aria-label="More options" size="small" shape="square"><OverflowWeb /></IconControl>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Table footer */}
                      <div className={styles.tableFooter}>
                        <div className={styles.tableFooterLeft}>
                          <IconControl aria-label="Copy" size="small" shape="square"><Copy /></IconControl>
                          <IconControl aria-label="Download" size="small" shape="square"><Download /></IconControl>
                        </div>
                        <div className={styles.tableFooterRight}>
                          <Button priority="tertiary" onClick={() => {}}>Edit request</Button>
                          <Button priority="primary" onClick={() => { setProgress(2); setStep(5) }}>
                            Import ready documents
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Last year's documents collapsed */}
              <div className={styles.lastYearSection}>
                <button className={styles.lastYearHeader} onClick={() => setLastYearOpen(o => !o)}>
                  <span className={styles.lastYearTitle}>Last years' documents</span>
                  <div className={styles.lastYearRight}>
                    <span className={styles.showToggle}>Show more</span>
                    <ChevronDown size="small" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarItem}>
            <img src={sidebarTaxOrganizerIcon} alt="" className={styles.sidebarIcon} />
            <span>Tax<br/>Organizer</span>
          </div>
          <div className={styles.sidebarItem}>
            <img src={sidebarImportHubIcon} alt="" className={styles.sidebarIcon} />
            <span>Import<br/>hub</span>
          </div>
          <div className={styles.sidebarItem}>
            <img src={sidebarDocumentsListIcon} alt="" className={styles.sidebarIcon} />
            <span>Documents<br/>list</span>
          </div>
          <div className={styles.sidebarItem}>
            <img src={sidebarClientActivityIcon} alt="" className={styles.sidebarIcon} />
            <span>Client<br/>activity</span>
          </div>
          <div className={styles.sidebarDivider} />
          <div className={styles.sidebarItem}>
            <img src={sidebarFlaggedItemsIcon} alt="" className={styles.sidebarIcon} />
            <span>Flagged<br/>items</span>
          </div>
          <div className={styles.sidebarItem}>
            <img src={sidebarCommentsIcon} alt="" className={styles.sidebarIcon} />
            <span>Comments</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
