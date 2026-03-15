import type { FC } from 'react'

import './badge.css'

type BadgeTone = 'default' | 'live'

interface BadgeProps {
  readonly label: string
  readonly tone?: BadgeTone
}

export const Badge: FC<BadgeProps> = ({ label, tone = 'default' }) => {
  return <span className={`shared-badge shared-badge--${tone}`}>{label}</span>
}
