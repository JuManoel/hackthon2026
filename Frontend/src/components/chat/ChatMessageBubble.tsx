import { useState, type FC, type ReactNode } from 'react'

import ReactMarkdown from 'react-markdown'

import { labels } from '@/constants/labels'
import type { ChatMessage } from '@/types/chat'

const HIGHLIGHT_PATTERN = /\[\[([^[\]]+)\]\]/g
const HIGHLIGHT_MARKER = '§§'

function normalizeAssistantContent(raw: string): string {
  let value = raw

  // Normalizar respuestas que ya vienen con §§...§§ desde el modelo
  if (value.includes(HIGHLIGHT_MARKER)) {
    value = value.replace(/§§([^§\n]+)§§/g, (_, inner: string) => {
      const cleaned = String(inner).trim()
      if (!cleaned) return ''
      return `**${HIGHLIGHT_MARKER}${cleaned}${HIGHLIGHT_MARKER}**`
    })
  }

  // Convertir [[...]] en el marcador interno de resaltado
  if (value.includes('[[')) {
    value = value.replace(HIGHLIGHT_PATTERN, (_, inner: string) => {
      const cleaned = String(inner).trim()
      if (!cleaned) return ''
      return `**${HIGHLIGHT_MARKER}${cleaned}${HIGHLIGHT_MARKER}**`
    })
  }

  return value
}

function getHighlightLabelFromStrong(children: ReactNode | ReactNode[]): string | null {
  const nodes = Array.isArray(children) ? children : [children]
  if (nodes.length === 0) return null

  if (!nodes.every((node) => typeof node === 'string')) {
    return null
  }

  const text = (nodes as string[]).join('')
  if (
    text.startsWith(HIGHLIGHT_MARKER) &&
    text.endsWith(HIGHLIGHT_MARKER) &&
    text.length > HIGHLIGHT_MARKER.length * 2
  ) {
    return stripHighlightMarkers(text)
  }

  return null
}

function stripHighlightMarkers(text: string): string {
  if (
    text.startsWith(HIGHLIGHT_MARKER) &&
    text.endsWith(HIGHLIGHT_MARKER) &&
    text.length > HIGHLIGHT_MARKER.length * 2
  ) {
    return text.slice(HIGHLIGHT_MARKER.length, -HIGHLIGHT_MARKER.length)
  }

  return text
}

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

      <div className={`bird-chat-message-bubble ${isAssistant ? 'is-assistant' : 'is-user'}`}>
        {isAssistant ? (
          <ReactMarkdown
            className="bird-chat-markdown"
            components={{
              strong({ children }) {
                const label = getHighlightLabelFromStrong(children)
                if (label) {
                  return <span className="bird-chat-highlight">{label}</span>
                }

                return <strong>{children}</strong>
              },
            }}
          >
            {normalizeAssistantContent(message.content)}
          </ReactMarkdown>
        ) : (
          <p className="bird-chat-plain-text">{message.content}</p>
        )}
      </div>
    </li>
  )
}
