import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../../styles/data-review/LeftPanel1040.module.css'

/** Session-scoped — show once when flags clear and docs still need review. */
export const DOC_REVIEW_MODAL_KEY = 'smartReviewProtoC:docReviewTransitionModalShown'

export function readDocReviewModalShown(): boolean {
  try {
    return sessionStorage.getItem(DOC_REVIEW_MODAL_KEY) === '1'
  } catch {
    return false
  }
}

export function markDocReviewModalShown(): void {
  try {
    sessionStorage.setItem(DOC_REVIEW_MODAL_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function resetDocReviewModalShown(): void {
  try {
    sessionStorage.removeItem(DOC_REVIEW_MODAL_KEY)
  } catch {
    /* ignore */
  }
}

interface DocReviewTransitionModalProps {
  open: boolean
  onClose: () => void
  onReviewNextDocument: () => void
}

export default function DocReviewTransitionModal({
  open,
  onClose,
  onReviewNextDocument,
}: DocReviewTransitionModalProps) {
  const handleReviewNext = () => {
    onReviewNextDocument()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="medium" dismissible>
      <ModalHeader alignment="center" transparentBackground onClose={onClose}>
        <ModalTitle title="Flags resolved — finish document review" />
      </ModalHeader>
      <ModalContent alignment="left">
        <p className={styles.controlModalBody}>
          No open flags remain. Some documents never had flags — confirm each source document
          (and questionnaire) before continuing.
        </p>
      </ModalContent>
      <ModalActions alignment="right">
        <Button priority="tertiary" onClick={onClose}>
          I&apos;ll review them
        </Button>
        <Button priority="primary" onClick={handleReviewNext}>
          Review next document
        </Button>
      </ModalActions>
    </Modal>
  )
}
