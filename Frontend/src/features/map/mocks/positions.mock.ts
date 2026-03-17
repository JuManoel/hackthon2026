import type { CameraPosition } from '@/features/map/types/map.types'

export const POSITIONS_MOCK: CameraPosition[] = [
  {
    id: 'pos-1',
    cameraId: 'cam-1',
    region: 'Manizales',
    direction: 'Bosque Nuboso Norte',
    lat: 5.0822,
    lng: -75.5174,
  },
  {
    id: 'pos-2',
    cameraId: 'cam-2',
    region: 'Villamaria',
    direction: 'Sendero Alto',
    lat: 5.0125,
    lng: -75.4361,
  },
  {
    id: 'pos-3',
    cameraId: 'cam-3',
    region: 'Neira',
    direction: 'Reserva Oriental',
    lat: 5.1756,
    lng: -75.5202,
  },
]
