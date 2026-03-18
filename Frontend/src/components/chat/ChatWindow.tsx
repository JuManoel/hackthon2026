import type { FC, ReactNode } from 'react'

import type { ChatUiState } from '@/types/chat'

interface ChatWindowProps {
  readonly chatState: ChatUiState
  readonly children: ReactNode
}

export const ChatWindow: FC<ChatWindowProps> = ({ chatState, children }) => {
  const isVisible = chatState !== 'closed'
  const windowClasses = ['bird-chat-window', isVisible ? 'is-visible' : null].filter(Boolean).join(' ')

  return (
    <section className={windowClasses} aria-hidden={!isVisible}>
      {children}
    </section>
  )
}
