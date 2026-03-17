import { labels } from '@/constants/labels'

const MOCK_RESPONSE_DELAY_MS = 1200

const MOCK_RESPONSES: readonly string[] = [
  labels.chatMockResponseFirst,
  labels.chatMockResponseSecond,
  labels.chatMockResponseThird,
]

let mockResponseIndex = 0

function wait(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, durationMs)
  })
}

export async function sendMessageToGemini(message: string): Promise<string> {
  await wait(MOCK_RESPONSE_DELAY_MS)

  const normalizedMessage = message.trim()
  if (!normalizedMessage) {
    return labels.chatMockResponseEmpty
  }

  const selectedResponse = MOCK_RESPONSES[mockResponseIndex % MOCK_RESPONSES.length]
  mockResponseIndex += 1

  return `${selectedResponse} ${labels.chatMockResponseEcho(normalizedMessage)}`
}
