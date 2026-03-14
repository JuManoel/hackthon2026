import type { ChangeEventHandler, FC } from 'react'

import '../auth.css'

interface InputControlProps {
  readonly id: string
  readonly value: string
  readonly placeholder: string
  readonly type: 'text' | 'password'
  readonly autoComplete?: string
  readonly className?: string
  readonly isInvalid?: boolean
  readonly ariaDescribedBy?: string
  readonly disabled?: boolean
  readonly onChange: ChangeEventHandler<HTMLInputElement>
}

export const InputControl: FC<InputControlProps> = ({
  id,
  value,
  placeholder,
  type,
  autoComplete,
  className,
  isInvalid = false,
  ariaDescribedBy,
  disabled = false,
  onChange,
}) => {
  const inputClassName = className ? `auth-input ${className}` : 'auth-input'

  return (
    <input
      id={id}
      className={inputClassName}
      value={value}
      placeholder={placeholder}
      type={type}
      autoComplete={autoComplete}
      aria-invalid={isInvalid}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onChange={onChange}
    />
  )
}
