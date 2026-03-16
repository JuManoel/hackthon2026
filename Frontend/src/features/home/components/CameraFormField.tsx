import type { FC, InputHTMLAttributes } from 'react'

interface CameraFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly id: string
  readonly label: string
}

export const CameraFormField: FC<CameraFormFieldProps> = ({ id, label, ...inputProps }) => (
  <label className="cameras-form-field" htmlFor={id}>
    <span className="cameras-form-label">{label}</span>
    <input id={id} className="cameras-form-input" {...inputProps} />
  </label>
)
