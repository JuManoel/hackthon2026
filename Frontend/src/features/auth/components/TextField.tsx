import type { ChangeEventHandler, FC } from 'react'

import '../auth.css'
import { InputControl } from './InputControl'

interface TextFieldProps {
  readonly id: string
  readonly label: string
  readonly placeholder: string
  readonly value: string
  readonly onChange: ChangeEventHandler<HTMLInputElement>
  readonly type?: 'text' | 'password'
  readonly autoComplete?: string
  readonly error?: string | null
  readonly disabled?: boolean
}

export const TextField: FC<TextFieldProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  autoComplete,
  error = null,
  disabled = false,
}) => {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={`auth-field ${error ? 'auth-field--error' : ''}`}>
      <label className="auth-label" htmlFor={id}>
        {label}
      </label>
      <InputControl
        id={id}
        value={value}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        isInvalid={Boolean(error)}
        ariaDescribedBy={errorId}
        disabled={disabled}
        onChange={onChange}
      />
      {error ? (
        <p id={errorId} className="auth-error-message" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
