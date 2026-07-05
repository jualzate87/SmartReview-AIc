import { createPortal } from 'react-dom'

type PortalProps = {
  id?: string
  children: React.ReactNode
}

export default function Portal({ id, children }: PortalProps) {
  return createPortal(children, id ? document.getElementById(id) || document.body : document.body)
}
