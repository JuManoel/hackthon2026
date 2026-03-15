import type { FC, ReactNode } from 'react'

import './card.css'

interface CardProps {
  readonly children: ReactNode
  readonly className?: string
}

export const Card: FC<CardProps> = ({ children, className }) => {
  const classes = ['shared-card', className].filter(Boolean).join(' ')

  return <div className={classes}>{children}</div>
}
