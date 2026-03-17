import { useState, type FC } from 'react'

import { labels } from '@/constants/labels'
import type { ChatMessage } from '@/types/chat'

interface ChatMessageBubbleProps {
  readonly message: ChatMessage
}

export const ChatMessageBubble: FC<ChatMessageBubbleProps> = ({ message }) => {
  const isAssistant = message.role === 'assistant'
  const [avatarLoadError, setAvatarLoadError] = useState(false)

  return (
    <li className={`bird-chat-message-item ${isAssistant ? 'is-assistant' : 'is-user'}`}>
      {isAssistant ? (
        <div className="bird-chat-message-avatar" aria-hidden="true">
          {avatarLoadError ? (
            <span>{labels.chatAssistantAvatarFallback}</span>
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
      ) : null}

      <p className={`bird-chat-message-bubble ${isAssistant ? 'is-assistant' : 'is-user'}`}>{message.content}</p>
    </li>
  )
}
