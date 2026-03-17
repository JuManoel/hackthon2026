import { useState, type FC } from 'react'

import { labels } from '@/constants/labels'
import { useChat } from '@/hooks/useChat'

import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInputBar } from '@/components/chat/ChatInputBar'
import { ChatLauncher } from '@/components/chat/ChatLauncher'
import { ChatMessages } from '@/components/chat/ChatMessages'
import { ChatOverlay } from '@/components/chat/ChatOverlay'
import { ChatWindow } from '@/components/chat/ChatWindow'

import '@/components/chat/chat.css'

export const BirdHammerChat: FC = () => {
  const {
    chatState,
    messages,
    composerValue,
    isChatVisible,
    isInputDisabled,
    showTypingIndicator,
    messageListEndRef,
    setComposerValue,
    toggleChat,
    sendMessage,
  } = useChat()
  const [isStandingBirdDismissed, setIsStandingBirdDismissed] = useState(false)
  const isStandingBirdVisible = chatState === 'closed' && !isStandingBirdDismissed

  const handleToggleChat = (): void => {
    if (chatState !== 'closed') {
      setIsStandingBirdDismissed(false)
    }

    toggleChat()
  }

  return (
    <div className="bird-chat-root" data-chat-state={chatState}>
      <ChatOverlay visible={isChatVisible} />

      <ChatWindow chatState={chatState}>
        <article className="bird-chat-panel" aria-label={labels.chatWindowAriaLabel}>
          <ChatHeader chatState={chatState} />
          <ChatMessages
            messages={messages}
            showTypingIndicator={showTypingIndicator}
            messageListEndRef={messageListEndRef}
          />
          <ChatInputBar value={composerValue} disabled={isInputDisabled} onChange={setComposerValue} onSubmit={sendMessage} />
        </article>
      </ChatWindow>

      {isStandingBirdVisible ? (
        <button
          type="button"
          className="bird-chat-standing-trigger"
          aria-label={labels.chatStandingBirdHide}
          onClick={() => {
            setIsStandingBirdDismissed(true)
          }}
        >
          <img className="bird-chat-standing-image" src="/bird-standing.webp" alt={labels.chatStandingBirdAlt} />
        </button>
      ) : null}

      <ChatLauncher chatState={chatState} onToggle={handleToggleChat} />
    </div>
  )
}
