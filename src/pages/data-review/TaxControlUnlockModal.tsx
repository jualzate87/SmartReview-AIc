import { Modal, ModalHeader, ModalTitle, ModalContent, ModalActions } from '@ids-ts/modal-dialog'
import '@ids-ts/modal-dialog/dist/main.css'
import { Button } from '@ids-ts/button'
import '@ids-ts/button/dist/main.css'
import styles from '../../styles/data-review/LeftPanel1040.module.css'

/** Session-scoped — survives refresh within a tab but resets when Phase 1 flags reopen. */
export const TAX_CONTROL_MODAL_KEY = 'smartReviewProtoC:taxControlModalDismissed'
/** Legacy ProtoA/ProtoC key — clear so prior deploys don't block the modal forever. */
const LEGACY_TAX_CONTROL_MODAL_KEY = 'taxControlModalDismissed'

export function readTaxControlModalDismissed(): boolean {
  try {
    localStorage.removeItem(LEGACY_TAX_CONTROL_MODAL_KEY)
    return sessionStorage.getItem(TAX_CONTROL_MODAL_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissTaxControlModalForSession(): void {
  try {
    sessionStorage.setItem(TAX_CONTROL_MODAL_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function resetTaxControlModalDismiss(): void {
  try {
    sessionStorage.removeItem(TAX_CONTROL_MODAL_KEY)
    localStorage.removeItem(LEGACY_TAX_CONTROL_MODAL_KEY)
  } catch {
    /* ignore */
  }
}

interface TaxControlUnlockModalProps {
  open: boolean
  onClose: () => void
  onCheckTotals: () => void
}

export default function TaxControlUnlockModal({ open, onClose, onCheckTotals }: TaxControlUnlockModalProps) {
  const handleCheckTotals = () => {
    onCheckTotals()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="medium" dismissible>
      <ModalHeader alignment="center" transparentBackground onClose={onClose}>
        <ModalTitle title="Nice job! Want to check your totals?" />
      </ModalHeader>
      <ModalContent alignment="left">
        <p className={styles.controlModalBody}>
          Compare summary totals against the source documents to quickly see if everything aligns or if you need to look closer at the details.
        </p>
      </ModalContent>
      <ModalActions alignment="right">
        <Button priority="tertiary" onClick={onClose}>Not now</Button>
        <Button priority="primary" onClick={handleCheckTotals}>Check totals</Button>
      </ModalActions>
    </Modal>
  )
}
