import { type ChangeEvent, type ComponentProps, type FC } from 'react'
import { SendHorizontal } from 'lucide-react'

import { labels } from '@/constants/labels'
import { Button } from '@/shared/ui/button/Button'

interface ChatInputBarProps {
  readonly value: string
  readonly disabled: boolean
  readonly onChange: (value: string) => void
  readonly onSubmit: () => Promise<void>
}

export const ChatInputBar: FC<ChatInputBarProps> = ({ value, disabled, onChange, onSubmit }) => {
  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (event): void => {
    event.preventDefault()
    void onSubmit()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value)
  }

  return (
    <form className="bird-chat-input-bar" onSubmit={handleSubmit}>
      <input
        id="bird-chat-composer"
        type="text"
        className="bird-chat-input"
        value={value}
        placeholder={labels.chatInputPlaceholder}
        aria-label={labels.chatInputLabel}
        disabled={disabled}
        onChange={handleChange}
      />

      <Button type="submit" className="bird-chat-send-button" variant="primary" disabled={disabled || !value.trim()}>
        <SendHorizontal className="bird-chat-send-icon" aria-hidden="true" />
        <span className="sr-only">{labels.chatSendButton}</span>
      </Button>
    </form>
  )
}
