import type { FC, RefObject } from 'react'

import { labels } from '@/constants/labels'
import type { ChatMessage } from '@/types/chat'

import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import { TypingIndicator } from '@/components/chat/TypingIndicator'

interface ChatMessagesProps {
  readonly messages: readonly ChatMessage[]
  readonly showTypingIndicator: boolean
  readonly isUsingTool?: boolean
  readonly messageListEndRef: RefObject<HTMLDivElement | null>
}

export const ChatMessages: FC<ChatMessagesProps> = ({ messages, showTypingIndicator, isUsingTool, messageListEndRef }) => {
  const showInitialState = messages.length === 0 && !showTypingIndicator

  return (
    <div className="bird-chat-messages" aria-label={labels.chatMessagesAriaLabel} role="log" aria-live="polite">
      <ul className={`bird-chat-message-list ${showInitialState ? 'is-initial' : ''}`.trim()}>
        {showInitialState ? (
          <li className="bird-chat-initial-state">
            <p className="bird-chat-initial-greeting">
              <strong>{labels.chatInitialGreetingBold}</strong>
              {` ${labels.chatInitialGreetingRest}`}
            </p>
            <img className="bird-chat-initial-bird" src="/bird-init.webp" alt={labels.chatInitialBirdAlt} />
          </li>
        ) : null}

        {messages.map((message) => (
          <ChatMessageBubble key={message.id} message={message} />
        ))}

        {showTypingIndicator ? (
          <li className="bird-chat-message-item is-assistant">
            <div className="bird-chat-message-avatar" aria-hidden="true">
              <img className="bird-chat-message-avatar-image" src="/bird.webp" alt={labels.chatAssistantAvatarAlt} />
            </div>
            <TypingIndicator isUsingTool={isUsingTool} />
          </li>
        ) : null}
      </ul>

      <div ref={messageListEndRef} />
    </div>
  )
}
