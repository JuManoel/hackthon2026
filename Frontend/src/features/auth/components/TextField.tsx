import type { ChangeEventHandler, FC } from 'react'

import '@/features/auth/auth.css'
import { InputControl } from '@/features/auth/components/InputControl'

interface TextFieldProps {
  readonly id: string
  readonly name?: string
  readonly label: string
  readonly placeholder: string
  readonly value: string
  readonly onChange: ChangeEventHandler<HTMLInputElement>
  readonly type?: 'text' | 'password'
  readonly autoComplete?: string
  readonly inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  readonly required?: boolean
  readonly minLength?: number
  readonly maxLength?: number
  readonly pattern?: string
  readonly error?: string | null
  readonly disabled?: boolean
}

export const TextField: FC<TextFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  autoComplete,
  inputMode,
  required,
  minLength,
  maxLength,
  pattern,
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
        name={name}
        value={value}
        placeholder={placeholder}
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
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
