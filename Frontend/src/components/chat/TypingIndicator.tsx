import type { FC } from 'react'

import { labels } from '@/constants/labels'

export const TypingIndicator: FC = () => {
  return (
    <div className="bird-chat-typing" role="status" aria-live="polite" aria-label={labels.chatTypingStatus}>
      <span className="bird-chat-typing-dot" />
      <span className="bird-chat-typing-dot" />
      <span className="bird-chat-typing-dot" />
    </div>
  )
}
