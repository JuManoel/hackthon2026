import type { FC, ReactNode } from 'react'

type CameraPopupValueTone = 'normal' | 'strong' | 'accent'

export interface CameraPopupSummaryRow {
  readonly label: string
  readonly value: string
  readonly tone?: CameraPopupValueTone
  readonly italic?: boolean
}

export interface CameraPopupDetailItem {
  readonly id: string
  readonly primaryText: string
  readonly secondaryText: string
}

interface CameraPopupCardProps {
  readonly title: string
  readonly subtitle?: string
  readonly summaryRows: readonly CameraPopupSummaryRow[]
  readonly detailsTitle: string
  readonly detailItems: readonly CameraPopupDetailItem[]
  readonly action: ReactNode
}

export const CameraPopupCard: FC<CameraPopupCardProps> = ({
  title,
  subtitle,
  summaryRows,
  detailsTitle,
  detailItems,
  action,
}) => {
  return (
    <article className="camera-popup-card">
      <header className="camera-popup-card-header">
        <h4 className="camera-popup-card-title">{title}</h4>
      </header>

      {subtitle ? <p className="camera-popup-card-subtitle">{subtitle}</p> : null}

      <ul className="camera-popup-card-summary">
        {summaryRows.map((row) => {
          const valueClasses = [
            'camera-popup-card-summary-value',
            `camera-popup-card-summary-value--${row.tone ?? 'normal'}`,
            row.italic ? 'camera-popup-card-summary-value--italic' : null,
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={`${row.label}-${row.value}`} className="camera-popup-card-summary-row">
              <span className="camera-popup-card-summary-label">{row.label}</span>
              <span className={valueClasses}>{row.value}</span>
            </li>
          )
        })}
      </ul>

      <p className="camera-popup-card-details-title">{detailsTitle}</p>
      <ul className="camera-popup-card-details">
        {detailItems.map((item) => (
          <li key={item.id} className="camera-popup-card-details-item">
            <span className="camera-popup-card-details-primary">{item.primaryText}</span>
            <span className="camera-popup-card-details-secondary">{item.secondaryText}</span>
          </li>
        ))}
      </ul>

      <div className="camera-popup-card-action">{action}</div>
    </article>
  )
}
