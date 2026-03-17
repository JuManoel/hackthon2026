import { useState, type FC } from 'react'

import { labels } from '@/constants/labels'
import type { ChatUiState } from '@/types/chat'

interface ChatHeaderProps {
  readonly chatState: ChatUiState
}

export const ChatHeader: FC<ChatHeaderProps> = ({ chatState }) => {
  const showTypingStatus = chatState === 'loading' || chatState === 'disabled'
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  return (
    <header className="bird-chat-header">
      <div className="bird-chat-header-avatar" aria-hidden="true">
        {avatarLoadError ? (
          labels.chatAssistantAvatarFallback
        ) : (
          <img
            className="bird-chat-message-avatar-image"
            src="/bird.webp"
            alt={labels.chatAssistantAvatarAlt}
            onError={() => {
              setAvatarLoadError(true)
            }}
          />
        )}
      </div>

      <div className="bird-chat-header-content">
        <h2 className="bird-chat-header-title">{labels.chatTitle}</h2>
        <p className="bird-chat-header-status" aria-live="polite">
          {showTypingStatus ? labels.chatTypingStatus : labels.chatTitle}
        </p>
      </div>
    </header>
  )
}
