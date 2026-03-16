export interface CameraLocationDto {
  readonly region: string
  readonly address: string
  readonly latitude: number
  readonly longitude: number
  readonly height: number
}

export interface CameraDto {
  readonly id: string
  readonly name: string
  readonly angleXY: number
  readonly angleXZ: number
  readonly location: CameraLocationDto
}

export interface CameraUpsertPayload {
  readonly name: string
  readonly angleXY: number
  readonly angleXZ: number
  readonly location: CameraLocationDto
}

export interface CameraListItem {
  readonly id: string
  readonly name: string
  readonly region: string
  readonly address: string
  readonly previewUrl?: string | null
}
