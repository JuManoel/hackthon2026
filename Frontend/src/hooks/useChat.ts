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

function toChatMessage(role: ChatRole, content: string, imageUrl?: string): ChatMessage {
  return {
    id: createMessageId(),
    role,
    content,
    createdAt: Date.now(),
    imageUrl,
  }
}

interface UseChatResult {
  readonly chatState: ChatUiState
  readonly messages: readonly ChatMessage[]
  readonly composerValue: string
  readonly selectedImage: File | null
  readonly isChatVisible: boolean
  readonly isInputDisabled: boolean
  readonly showTypingIndicator: boolean
  readonly isUsingTool: boolean
  readonly messageListEndRef: RefObject<HTMLDivElement | null>
  readonly setComposerValue: (value: string) => void
  readonly setSelectedImage: (image: File | null) => void
  readonly toggleChat: () => void
  readonly sendMessage: () => Promise<void>
}

export function useChat(): UseChatResult {
  const [chatState, setChatState] = useState<ChatUiState>('closed')
  const [composerValue, setComposerValue] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [messages, setMessages] = useState<readonly ChatMessage[]>([])
  const [isUsingTool, setIsUsingTool] = useState(false)

  const messageListEndRef = useRef<HTMLDivElement>(null)
  const openingTimerRef = useRef<TimerHandle | null>(null)
  const disabledTimerRef = useRef<TimerHandle | null>(null)
  const requestSerialRef = useRef(0)

  const isChatVisible = chatState !== 'closed'
  const isInputDisabled =
    chatState === 'opening' || chatState === 'loading' || chatState === 'disabled'
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

    if (!normalizedMessage && !selectedImage) {
      return
    }

    if (chatState !== 'open') {
      return
    }

    const requestSerial = requestSerialRef.current + 1
    requestSerialRef.current = requestSerial

    // Create object URL for the image to display in chat
    const imageUrl = selectedImage ? URL.createObjectURL(selectedImage) : undefined

    // Display user message with image if present
    const userMessageText = normalizedMessage || 'Imagen'
    const userMessage = toChatMessage('user', userMessageText, imageUrl)

    setMessages((currentMessages) => [...currentMessages, userMessage])
    setComposerValue('')
    const currentImage = selectedImage
    setIsUsingTool(currentImage !== null)
    setSelectedImage(null)
    setChatState('loading')

    disabledTimerRef.current = globalThis.setTimeout(() => {
      setChatState((currentState) => (currentState === 'loading' ? 'disabled' : currentState))
      disabledTimerRef.current = null
    }, CHAT_DISABLED_TRANSITION_MS)

    try {
      const response = await sendMessageToGemini(
        normalizedMessage,
        messages,
        currentImage ?? undefined
      )

      if (requestSerial !== requestSerialRef.current) {
        // Clean up object URL if request was cancelled
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl)
        }
        return
      }

      setIsUsingTool(false)
      setMessages((currentMessages) => [...currentMessages, toChatMessage('assistant', response)])
      setChatState('open')
    } catch {
      if (requestSerial !== requestSerialRef.current) {
        // Clean up object URL if request was cancelled
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl)
        }
        return
      }

      setIsUsingTool(false)
      setChatState('open')
    }
  }, [chatState, composerValue, selectedImage, messages])

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
    }),
    [
      chatState,
      messages,
      composerValue,
      selectedImage,
      isChatVisible,
      isInputDisabled,
      showTypingIndicator,
      isUsingTool,
      toggleChat,
      sendMessage,
    ]
  )
}
