import type { ChangeEventHandler, FC } from 'react'

import '@/features/auth/auth.css'
import { usePasswordVisibility } from '@/features/auth/hooks/usePasswordVisibility'
import { InputControl } from '@/features/auth/components/InputControl'

interface PasswordFieldProps {
  readonly id: string
  readonly name?: string
  readonly label: string
  readonly placeholder: string
  readonly value: string
  readonly onChange: ChangeEventHandler<HTMLInputElement>
  readonly autoComplete?: string
  readonly required?: boolean
  readonly minLength?: number
  readonly maxLength?: number
  readonly pattern?: string
  readonly toggleLabel: string
  readonly error?: string | null
  readonly disabled?: boolean
}

export const PasswordField: FC<PasswordFieldProps> = ({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  maxLength,
  pattern,
  toggleLabel,
  error = null,
  disabled = false,
}) => {
  const { inputType, isVisible, toggle } = usePasswordVisibility()
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className={`auth-field ${error ? 'auth-field--error' : ''}`}>
      <label className="auth-label" htmlFor={id}>
        {label}
      </label>
      <div className="auth-password-wrapper">
        <InputControl
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          type={inputType}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          onChange={onChange}
          className="auth-input-password"
          isInvalid={Boolean(error)}
          ariaDescribedBy={errorId}
          disabled={disabled}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={toggle}
          disabled={disabled}
          aria-label={toggleLabel}
          title={toggleLabel}
        >
          {isVisible ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
              <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.91c5.63 0 10 7.09 10 7.09a19.07 19.07 0 0 1-3.02 3.61" />
              <path d="M6.61 6.61A19.94 19.94 0 0 0 2 12s4.37 7.09 10 7.09a10.9 10.9 0 0 0 4.26-.87" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M2 12s4.37-7.09 10-7.09S22 12 22 12s-4.37 7.09-10 7.09S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="auth-error-message" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
