import { MAP_LABELS } from '../constants/map.labels'

export function getLatestIsoDate(dateValues: string[]): string | null {
  if (dateValues.length === 0) {
    return null
  }

  let latest = new Date(dateValues[0]).getTime()
  let latestIso = dateValues[0]

  for (const dateValue of dateValues) {
    const dateTime = new Date(dateValue).getTime()

    if (dateTime > latest) {
      latest = dateTime
      latestIso = dateValue
    }
  }

  return latestIso
}

export function formatRelativeDetection(dateValue: string | null, now: Date = new Date()): string {
  if (!dateValue) {
    return MAP_LABELS.unknownDate
  }

  const date = new Date(dateValue)
  const differenceMs = now.getTime() - date.getTime()

  if (differenceMs < 0) {
    return MAP_LABELS.unknownDate
  }

  const minutes = Math.floor(differenceMs / (1000 * 60))

  if (minutes < 1) {
    return MAP_LABELS.relativeLessThanMinute
  }

  if (minutes < 60) {
    return `hace ${minutes} ${MAP_LABELS.relativeMinutesSuffix}`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `hace ${hours} ${MAP_LABELS.relativeHoursSuffix}`
  }

  const days = Math.floor(hours / 24)

  return `hace ${days} ${MAP_LABELS.relativeDaysSuffix}`
}
