import type { FC } from 'react'

type BadgeTone = 'default' | 'live'

interface BadgeProps {
  readonly label: string
  readonly tone?: BadgeTone
}

export const Badge: FC<BadgeProps> = ({ label, tone = 'default' }) => {
  const baseClasses =
    'shared-badge inline-flex min-h-[22px] items-center justify-center rounded-full border px-2.5 text-[11px] font-medium leading-[14px]'
  const toneClasses =
    tone === 'live'
      ? 'shared-badge--live border-neutral-900 bg-neutral-100 text-neutral-900'
      : 'shared-badge--default border-neutral-400 bg-neutral-0 text-neutral-700'

  return <span className={`${baseClasses} ${toneClasses}`}>{label}</span>
}
