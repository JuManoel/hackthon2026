import { TOKEN_STORAGE_KEY } from '@/config'
import { fetchApi } from '@/services/http.service'
import type { ChatMessage } from '@/types/chat'

interface ChatRequestBody {
  readonly message: string
}

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
    '\n',
  )}\n\n`
}

export async function sendMessageToGemini(
  message: string,
  history: readonly ChatMessage[],
): Promise<string> {
  const normalizedMessage = message.trim()

  if (!normalizedMessage) {
    return ''
  }

  const token = globalThis.localStorage.getItem(TOKEN_STORAGE_KEY)

  const context = buildConversationContext(history)
  const composedMessage = `${context}Mensaje actual del usuario:\n${normalizedMessage}`

  const payload: ChatRequestBody = {
    message: composedMessage,
  }

  const response = await fetchApi<ChatResponseBody>('/chat/ask', {
    method: 'POST',
    body: payload,
    token,
  })

  return response.response
}
