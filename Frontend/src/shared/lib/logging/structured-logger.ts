type LogLevel = 'info' | 'warn' | 'error'

interface StructuredLog {
  readonly level: LogLevel
  readonly context: string
  readonly event: string
  readonly timestamp: string
  readonly metadata?: Record<string, unknown>
}

function writeLog(entry: StructuredLog): void {
  const serialized = JSON.stringify(entry)

  if (entry.level === 'error') {
    console.error(serialized)
    return
  }

  if (entry.level === 'warn') {
    console.warn(serialized)
    return
  }

  console.info(serialized)
}

export function logInfo(context: string, event: string, metadata?: Record<string, unknown>): void {
  writeLog({
    level: 'info',
    context,
    event,
    timestamp: new Date().toISOString(),
    metadata,
  })
}

export function logWarn(context: string, event: string, metadata?: Record<string, unknown>): void {
  writeLog({
    level: 'warn',
    context,
    event,
    timestamp: new Date().toISOString(),
    metadata,
  })
}

export function logError(context: string, event: string, metadata?: Record<string, unknown>): void {
  writeLog({
    level: 'error',
    context,
    event,
    timestamp: new Date().toISOString(),
    metadata,
  })
}
