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
    selectedImage,
    isChatVisible,
    isInputDisabled,
    showTypingIndicator,
    isUsingTool,
    messageListEndRef,
    setComposerValue,
    setSelectedImage,
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
            isUsingTool={isUsingTool}
            messageListEndRef={messageListEndRef}
          />
          <ChatInputBar
            value={composerValue}
            disabled={isInputDisabled}
            selectedImage={selectedImage}
            onChange={setComposerValue}
            onImageChange={setSelectedImage}
            onSubmit={sendMessage}
          />
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
