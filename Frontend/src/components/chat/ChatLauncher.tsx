import type { FC } from 'react'
import { MessageCircle } from 'lucide-react'

import { labels } from '@/constants/labels'
import type { ChatUiState } from '@/types/chat'

interface ChatLauncherProps {
  readonly chatState: ChatUiState
  readonly onToggle: () => void
}

export const ChatLauncher: FC<ChatLauncherProps> = ({ chatState, onToggle }) => {
  const isOpen = chatState !== 'closed'
  const launcherLabel = isOpen ? labels.chatLauncherCloseAria : labels.chatLauncherOpenAria
  const launcherClasses = ['bird-chat-launcher', isOpen ? 'is-open' : null].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={launcherClasses}
      aria-label={launcherLabel}
      title={launcherLabel}
      onClick={onToggle}
    >
      <MessageCircle className="bird-chat-launcher-icon" aria-hidden="true" />
      <span className="bird-chat-launcher-pulse" aria-label={labels.chatLauncherPulseAria} />
    </button>
  )
}
