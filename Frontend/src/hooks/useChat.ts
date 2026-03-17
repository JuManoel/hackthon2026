import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'

import { sendMessageToGemini } from '@/services/chatService'
import type { ChatMessage, ChatRole, ChatUiState } from '@/types/chat'

const CHAT_OPENING_DURATION_MS = 260
const CHAT_DISABLED_TRANSITION_MS = 120

type TimerHandle = ReturnType<typeof globalThis.setTimeout>

function createMessageId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function toChatMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: createMessageId(),
    role,
    content,
    createdAt: Date.now(),
  }
}

interface UseChatResult {
  readonly chatState: ChatUiState
  readonly messages: readonly ChatMessage[]
  readonly composerValue: string
  readonly isChatVisible: boolean
  readonly isInputDisabled: boolean
  readonly showTypingIndicator: boolean
  readonly messageListEndRef: RefObject<HTMLDivElement | null>
  readonly setComposerValue: (value: string) => void
  readonly toggleChat: () => void
  readonly sendMessage: () => Promise<void>
}

export function useChat(): UseChatResult {
  const [chatState, setChatState] = useState<ChatUiState>('closed')
  const [composerValue, setComposerValue] = useState('')
  const [messages, setMessages] = useState<readonly ChatMessage[]>([])

  const messageListEndRef = useRef<HTMLDivElement>(null)
  const openingTimerRef = useRef<TimerHandle | null>(null)
  const disabledTimerRef = useRef<TimerHandle | null>(null)
  const requestSerialRef = useRef(0)

  const isChatVisible = chatState !== 'closed'
  const isInputDisabled = chatState === 'opening' || chatState === 'loading' || chatState === 'disabled'
  const showTypingIndicator = chatState === 'loading' || chatState === 'disabled'

  const clearTransitionTimers = useCallback(() => {
    if (openingTimerRef.current !== null) {
      globalThis.clearTimeout(openingTimerRef.current)
      openingTimerRef.current = null
    }

    if (disabledTimerRef.current !== null) {
      globalThis.clearTimeout(disabledTimerRef.current)
      disabledTimerRef.current = null
    }
  }, [])

  const closeChat = useCallback(() => {
    requestSerialRef.current += 1
    clearTransitionTimers()
    setChatState('closed')
  }, [clearTransitionTimers])

  const toggleChat = useCallback(() => {
    if (chatState === 'closed') {
      clearTransitionTimers()
      setChatState('opening')

      openingTimerRef.current = globalThis.setTimeout(() => {
        setChatState('open')
        openingTimerRef.current = null
      }, CHAT_OPENING_DURATION_MS)

      return
    }

    closeChat()
  }, [chatState, clearTransitionTimers, closeChat])

  const sendMessage = useCallback(async () => {
    const normalizedMessage = composerValue.trim()

    if (!normalizedMessage || chatState !== 'open') {
      return
    }

    const requestSerial = requestSerialRef.current + 1
    requestSerialRef.current = requestSerial

    setMessages((currentMessages) => [...currentMessages, toChatMessage('user', normalizedMessage)])
    setComposerValue('')
    setChatState('loading')

    disabledTimerRef.current = globalThis.setTimeout(() => {
      setChatState((currentState) => (currentState === 'loading' ? 'disabled' : currentState))
      disabledTimerRef.current = null
    }, CHAT_DISABLED_TRANSITION_MS)

    try {
      const response = await sendMessageToGemini(normalizedMessage)

      if (requestSerial !== requestSerialRef.current) {
        return
      }

      setMessages((currentMessages) => [...currentMessages, toChatMessage('assistant', response)])
      setChatState('open')
    } catch {
      if (requestSerial !== requestSerialRef.current) {
        return
      }

      setChatState('open')
    }
  }, [chatState, composerValue])

  useEffect(() => {
    if (!isChatVisible) {
      return
    }

    messageListEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chatState, isChatVisible, messages])

  useEffect(() => {
    return () => {
      clearTransitionTimers()
      requestSerialRef.current += 1
    }
  }, [clearTransitionTimers])

  return useMemo(
    () => ({
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
    }),
    [chatState, messages, composerValue, isChatVisible, isInputDisabled, showTypingIndicator, toggleChat, sendMessage],
  )
}
