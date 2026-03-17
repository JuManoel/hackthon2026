import type { FC } from 'react'

interface ChatOverlayProps {
  readonly visible: boolean
}

export const ChatOverlay: FC<ChatOverlayProps> = ({ visible }) => {
  const overlayClasses = ['bird-chat-overlay', visible ? 'is-visible' : null].filter(Boolean).join(' ')

  return <div className={overlayClasses} aria-hidden="true" />
}
