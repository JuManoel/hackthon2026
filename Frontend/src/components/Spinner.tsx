import type { CSSProperties, FC } from 'react'

import '@/components/spinner.css'

const spinnerSegments = 12

type SpinnerTone = 'light' | 'dark'
type SpinnerSize = 'sm' | 'md' | 'lg'

interface SpinnerProps {
  readonly tone?: SpinnerTone
  readonly size?: SpinnerSize
  readonly className?: string
  readonly ariaHidden?: boolean
  readonly ariaLabel?: string
}

type SpinnerSegmentStyle = CSSProperties & {
  readonly '--segment-index': number
}

export const Spinner: FC<SpinnerProps> = ({
  tone = 'dark',
  size = 'md',
  className,
  ariaHidden = true,
  ariaLabel,
}) => {
  const classes = ['spinner', `spinner--${tone}`, `spinner--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={classes}
      role={ariaHidden ? undefined : 'status'}
      aria-hidden={ariaHidden}
      aria-label={ariaHidden ? undefined : ariaLabel}
    >
      {Array.from({ length: spinnerSegments }, (_, segmentIndex) => {
        const segmentStyle: SpinnerSegmentStyle = { '--segment-index': segmentIndex }

        return <span key={segmentIndex} className="spinner-segment" style={segmentStyle} aria-hidden="true" />
      })}
    </div>
  )
}
