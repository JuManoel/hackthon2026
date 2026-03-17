export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  readonly id: string
  readonly role: ChatRole
  readonly content: string
  readonly createdAt: number
}

export type ChatUiState = 'closed' | 'opening' | 'open' | 'loading' | 'disabled'
