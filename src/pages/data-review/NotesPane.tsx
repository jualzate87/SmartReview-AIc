import { useState, useRef, useEffect } from 'react'
import { Close, CircleCheck, Edit } from '@design-systems/icons'
import styles from '../../styles/data-review/NotesPane.module.css'

export type Note = {
  id: string
  text: string
  author: string
  at: string
  context?: string
}

interface NotesPaneProps {
  notes: Note[]
  onAdd: (text: string) => void
  onEdit: (id: string, text: string) => void
  onClose: () => void
  closing?: boolean
}

function renderNoteText(text: string) {
  const parts = text.split(/(@\w+)/g)
  return parts.map((part, i) =>
    part.startsWith('@')
      ? <span key={i} className={styles.mention}>{part}</span>
      : part
  )
}

export default function NotesPane({ notes, onAdd, onEdit, onClose, closing = false }: NotesPaneProps) {
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const editTextareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    if (editingId) editTextareaRef.current?.focus()
  }, [editingId])

  const handlePost = () => {
    const trimmed = draft.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setDraft('')
  }

  const startEdit = (note: Note) => {
    setEditingId(note.id)
    setEditDraft(note.text)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft('')
  }

  const saveEdit = () => {
    const trimmed = editDraft.trim()
    if (!trimmed || !editingId) return
    onEdit(editingId, trimmed)
    setEditingId(null)
    setEditDraft('')
  }

  return (
    <div className={`${styles.panel} ${closing ? styles.panelClosing : ''}`}>

      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Comments</span>
        <button className={styles.closeBtn} aria-label="Close comments" onClick={onClose}>
          <Close size="small" />
        </button>
      </div>

      {/* Notes list */}
      <div className={styles.notesList}>
        {notes.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="5" width="20" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <line x1="10" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="10" y1="19" x2="17" y2="19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className={styles.emptyTitle}>No comments yet</p>
            <p className={styles.emptyBody}>Add a comment to flag something for your team or leave context for a reviewer.</p>
          </div>
        ) : (
          <div className={styles.noteItems}>
            {notes.map(note => {
              const isEditing = editingId === note.id
              return (
                <div key={note.id} className={styles.noteCard}>
                  <div className={styles.noteHeader}>
                    <div className={styles.noteAvatar}>
                      {note.author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className={styles.noteMeta}>
                      <span className={styles.noteAuthor}>{note.author}</span>
                      <span className={styles.noteAt}>{note.at}</span>
                    </div>
                    {!isEditing && (
                      <button
                        className={styles.editBtn}
                        aria-label="Edit comment"
                        onClick={() => startEdit(note)}
                      >
                        <Edit size="small" />
                      </button>
                    )}
                  </div>
                  {note.context && (
                    <div className={styles.noteContext}>
                      <span className={styles.noteContextIcon}><CircleCheck size="small" /></span>
                      {note.context}
                    </div>
                  )}
                  {isEditing ? (
                    <div className={styles.editArea}>
                      <div className={styles.editBox}>
                        <textarea
                          ref={editTextareaRef}
                          className={styles.editInput}
                          value={editDraft}
                          onChange={e => setEditDraft(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') cancelEdit()
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit()
                          }}
                          rows={3}
                        />
                      </div>
                      <div className={styles.editActions}>
                        <button className={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                        <button
                          className={`${styles.postBtn} ${editDraft.trim() ? styles.postBtnActive : ''}`}
                          disabled={!editDraft.trim()}
                          onClick={saveEdit}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles.noteText}>{renderNoteText(note.text)}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Compose area */}
      <div className={styles.compose}>
        <div className={styles.composeBox}>
          <textarea
            ref={textareaRef}
            className={styles.composeInput}
            placeholder="Add a note… Use @ to mention a team member"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
            }}
            rows={3}
          />
        </div>
        <div className={styles.composeActions}>
          <button className={styles.cancelBtn} onClick={() => setDraft('')}>Clear</button>
          <button
            className={`${styles.postBtn} ${draft.trim() ? styles.postBtnActive : ''}`}
            disabled={!draft.trim()}
            onClick={handlePost}
          >
            Post note
          </button>
        </div>
      </div>

    </div>
  )
}
