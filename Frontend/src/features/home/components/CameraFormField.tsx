import type { FC, InputHTMLAttributes } from 'react'

interface CameraFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly id: string
  readonly label: string
  readonly errorMessage?: string
}

export const CameraFormField: FC<CameraFormFieldProps> = ({ id, label, errorMessage, ...inputProps }) => (
  <label className="cameras-form-field" htmlFor={id}>
    <span className="cameras-form-label">{label}</span>
    <span className="cameras-form-input-wrap">
      <input
        id={id}
        className={`cameras-form-input ${errorMessage ? 'cameras-form-input--invalid' : ''}`.trim()}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        {...inputProps}
      />
      {errorMessage ? (
        <span
          className="cameras-form-error-icon"
          role="img"
          aria-label={errorMessage}
          title={errorMessage}
        >
          !
        </span>
      ) : null}
    </span>
    {errorMessage ? (
      <span id={`${id}-error`} className="cameras-form-field-error" role="alert">
        {errorMessage}
      </span>
    ) : null}
  </label>
)
