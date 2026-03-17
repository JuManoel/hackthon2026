import type { FC } from 'react'

import { Spinner } from '@/components/Spinner'

interface AuthSubmitButtonProps {
  readonly label: string
  readonly loadingLabel: string
  readonly isLoading?: boolean
  readonly disabled?: boolean
  readonly onClick?: () => void
  readonly type?: 'button' | 'submit'
}

export const AuthSubmitButton: FC<AuthSubmitButtonProps> = ({
  label,
  loadingLabel,
  isLoading = false,
  disabled = false,
  onClick,
  type = 'submit',
}) => {
  return (
    <button className="auth-submit" type={type} disabled={disabled || isLoading} onClick={onClick}>
      {isLoading ? (
        <span className="auth-submit-content">
          <Spinner tone="light" size="sm" className="auth-submit-spinner" />
          <span>{loadingLabel}</span>
        </span>
      ) : (
        label
      )}
    </button>
  )
}