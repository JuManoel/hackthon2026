import type { ButtonHTMLAttributes, FC, ReactNode } from 'react'

type ButtonVariant = 'neutral' | 'primary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode
  readonly variant?: ButtonVariant
}

export const Button: FC<ButtonProps> = ({ children, variant = 'neutral', className, ...props }) => {
  const baseClasses =
    'shared-button inline-flex items-center justify-center rounded-[10px] border min-h-[34px] px-3 py-1.5 text-label-sm transition-colors duration-150 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
  const toneClasses =
    variant === 'primary'
      ? 'shared-button--primary border-neutral-900 bg-neutral-900 text-neutral-0 hover:bg-neutral-800'
      : variant === 'ghost'
        ? 'shared-button--ghost border-transparent bg-transparent text-neutral-900 hover:bg-neutral-100'
        : 'shared-button--neutral border-neutral-400 bg-neutral-0 text-neutral-900 hover:border-neutral-500 hover:bg-neutral-100'
  const classes = [baseClasses, toneClasses, className].filter(Boolean).join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
