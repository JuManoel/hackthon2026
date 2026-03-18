import type { FC } from 'react'

import { Card } from '@/shared/ui/card/Card'

interface BirdMapEmptyStateProps {
  readonly message: string
}

export const BirdMapEmptyState: FC<BirdMapEmptyStateProps> = ({ message }) => {
  return (
    <div className="bird-map-state bird-map-state--empty">
      <Card className="bird-map-empty-card">
        <p className="bird-map-empty-text">{message}</p>
      </Card>
    </div>
  )
}
