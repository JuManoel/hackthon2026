import type { ButtonHTMLAttributes, FC, ReactNode } from 'react'

import './button.css'

type ButtonVariant = 'neutral' | 'primary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode
  readonly variant?: ButtonVariant
}

export const Button: FC<ButtonProps> = ({ children, variant = 'neutral', className, ...props }) => {
  const classes = ['shared-button', `shared-button--${variant}`, className].filter(Boolean).join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
