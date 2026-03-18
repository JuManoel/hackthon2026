import { API_BASE_URL, TOKEN_STORAGE_KEY } from '@/config'
import { fetchApi } from '@/services/http.service'
import type { ChatMessage } from '@/types/chat'

interface ChatResponseBody {
  readonly response: string
}

function buildConversationContext(history: readonly ChatMessage[]): string {
  if (!history.length) return ''

  const recent = history.slice(-5)

  const lines = recent.map((entry) => {
    const prefix = entry.role === 'user' ? 'Usuario' : 'Tororoi'
    return `${prefix}: ${entry.content}`
  })

  return `Contexto de la conversación (últimos 5 mensajes, del más antiguo al más reciente):\n${lines.join(
    '\n'
  )}\n\n`
}

export async function sendMessageToGemini(
  message: string,
  history: readonly ChatMessage[],
  image?: File
): Promise<string> {
  const normalizedMessage = message.trim()

  if (!normalizedMessage && !image) {
    return ''
  }

  const token = globalThis.localStorage.getItem(TOKEN_STORAGE_KEY)

  const context = buildConversationContext(history)
  const composedMessage = `${context}Mensaje actual del usuario:\n${normalizedMessage}`

  // Create FormData for multipart/form-data request
  const formData = new FormData()
  formData.append('message', composedMessage)

  if (image) {
    formData.append('image', image)
  }

  // For FormData, we need to handle the request differently
  const normalizedBase = API_BASE_URL.replace(/\/$/, '')
  const url = `${normalizedBase}/chat/ask`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data: ChatResponseBody = await response.json()
  return data.response
}
