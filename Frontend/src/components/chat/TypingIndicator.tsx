import type { FC } from 'react'

import { labels } from '@/constants/labels'

interface TypingIndicatorProps {
  readonly isUsingTool?: boolean
}

export const TypingIndicator: FC<TypingIndicatorProps> = ({ isUsingTool }) => {
  return (
    <div className="bird-chat-typing-container">
      <div className="bird-chat-typing" role="status" aria-live="polite" aria-label={labels.chatTypingStatus}>
        <span className="bird-chat-typing-dot" />
        <span className="bird-chat-typing-dot" />
        <span className="bird-chat-typing-dot" />
      </div>
      {isUsingTool && (
        <span className="bird-chat-typing-tool-status">Analizando imagen de ave...</span>
      )}
    </div>
  )
}
