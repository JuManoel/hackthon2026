import { CameraSocketAdapter } from '@/features/realtime/adapters/CameraSocketAdapter'
import { DetectionSocketAdapter } from '@/features/realtime/adapters/DetectionSocketAdapter'

export const cameraSocketAdapter = new CameraSocketAdapter()
export const detectionSocketAdapter = new DetectionSocketAdapter()
