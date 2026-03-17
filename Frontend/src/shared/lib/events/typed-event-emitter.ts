export type EventListener<TPayload> = (payload: TPayload) => void

export class TypedEventEmitter<TEvents extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof TEvents, Set<EventListener<TEvents[keyof TEvents]>>>()

  on<TKey extends keyof TEvents>(event: TKey, listener: EventListener<TEvents[TKey]>): () => void {
    const listenersForEvent = this.listeners.get(event) ?? new Set()
    listenersForEvent.add(listener as EventListener<TEvents[keyof TEvents]>)
    this.listeners.set(event, listenersForEvent)

    return () => {
      listenersForEvent.delete(listener as EventListener<TEvents[keyof TEvents]>)
      if (listenersForEvent.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void {
    const listenersForEvent = this.listeners.get(event)
    if (!listenersForEvent) {
      return
    }

    listenersForEvent.forEach((listener) => {
      listener(payload)
    })
  }

  clear(): void {
    this.listeners.clear()
  }
}
