import type { FC, ReactNode } from 'react'

interface CardProps {
  readonly children: ReactNode
  readonly className?: string
}

export const Card: FC<CardProps> = ({ children, className }) => {
  const classes = [
    'shared-card rounded-xl border border-neutral-300 bg-neutral-0 shadow-[0_8px_18px_rgba(31,31,31,0.06)]',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <div className={classes}>{children}</div>
}
