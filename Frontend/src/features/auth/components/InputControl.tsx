import type { ChangeEventHandler, FC, HTMLInputTypeAttribute } from 'react'

import '@/features/auth/auth.css'

interface InputControlProps {
  readonly id: string
  readonly name?: string
  readonly value: string
  readonly placeholder: string
  readonly type: HTMLInputTypeAttribute
  readonly autoComplete?: string
  readonly inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search'
  readonly required?: boolean
  readonly min?: number | string
  readonly max?: number | string
  readonly minLength?: number
  readonly maxLength?: number
  readonly pattern?: string
  readonly className?: string
  readonly isInvalid?: boolean
  readonly ariaDescribedBy?: string
  readonly disabled?: boolean
  readonly onChange: ChangeEventHandler<HTMLInputElement>
}

export const InputControl: FC<InputControlProps> = ({
  id,
  name,
  value,
  placeholder,
  type,
  autoComplete,
  inputMode,
  required,
  min,
  max,
  minLength,
  maxLength,
  pattern,
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
      name={name}
      className={inputClassName}
      value={value}
      placeholder={placeholder}
      type={type}
      autoComplete={autoComplete}
      inputMode={inputMode}
      required={required}
      min={min}
      max={max}
      minLength={minLength}
      maxLength={maxLength}
      pattern={pattern}
      aria-invalid={isInvalid}
      aria-describedby={ariaDescribedBy}
      disabled={disabled}
      onChange={onChange}
    />
  )
}
