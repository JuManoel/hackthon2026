import type { FC } from 'react'
import { CircleHelp } from 'lucide-react'

import { MAP_LABELS } from '../constants/map.labels'

export const BirdMapLegend: FC = () => {
  return (
    <aside className="bird-map-legend" aria-label={MAP_LABELS.activeZone}>
      <details className="bird-map-legend-dropdown">
        <summary className="bird-map-legend-toggle" aria-label={MAP_LABELS.activeZone}>
          <CircleHelp size={16} aria-hidden="true" focusable="false" />
        </summary>

        <div className="bird-map-legend-panel">
          <div className="bird-map-legend-list">
            <div className="bird-map-legend-item">
              <span className="bird-map-legend-dot bird-map-legend-dot--low" />
              <span className="bird-map-legend-label">{MAP_LABELS.lowActivity}</span>
            </div>
            <div className="bird-map-legend-item">
              <span className="bird-map-legend-dot bird-map-legend-dot--medium" />
              <span className="bird-map-legend-label">{MAP_LABELS.mediumActivity}</span>
            </div>
            <div className="bird-map-legend-item">
              <span className="bird-map-legend-dot bird-map-legend-dot--high" />
              <span className="bird-map-legend-label">{MAP_LABELS.highActivity}</span>
            </div>
            <div className="bird-map-legend-item">
              <span className="bird-map-legend-dot bird-map-legend-dot--birds" />
              <span className="bird-map-legend-label">{MAP_LABELS.birdPointsLegend}</span>
            </div>
            <div className="bird-map-legend-item">
              <span className="bird-map-legend-dot bird-map-legend-dot--live" />
              <span className="bird-map-legend-label">{MAP_LABELS.liveActivity}</span>
            </div>
          </div>
        </div>
      </details>
    </aside>
  )
}
