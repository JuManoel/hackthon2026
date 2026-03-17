import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs'

import { TypedEventEmitter } from '@/shared/lib/events/typed-event-emitter'
import { logError, logInfo, logWarn } from '@/shared/lib/logging/structured-logger'
import { buildJavaSocketUrl, REALTIME_CONSTANTS } from '@/features/realtime/adapters/realtime.constants'
import type { AdapterLifecycle } from '@/features/realtime/types/realtime.types'

type StompAdapterEvents<TPayload> = {
  lifecycle: AdapterLifecycle
  message: TPayload
  error: string
}

export abstract class StompSocketAdapter<TPayload> {
  protected readonly emitter = new TypedEventEmitter<StompAdapterEvents<TPayload>>()
  private client: Client | null = null
  private subscription: StompSubscription | null = null
  private retryAttempt = 0

  protected constructor(private readonly context: string, private readonly topic: string) {}

  onLifecycle(listener: (event: AdapterLifecycle) => void): () => void {
    return this.emitter.on('lifecycle', listener)
  }

  onMessage(listener: (payload: TPayload) => void): () => void {
    return this.emitter.on('message', listener)
  }

  onError(listener: (message: string) => void): () => void {
    return this.emitter.on('error', listener)
  }

  connect(): void {
    if (this.client?.active) {
      return
    }

    const brokerURL = buildJavaSocketUrl()
    this.client = new Client({
      brokerURL,
      reconnectDelay: REALTIME_CONSTANTS.retryDelayMs,
      connectionTimeout: 10000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {
        // Debug de STOMP desactivado para evitar ruido en consola.
      },
    })

    this.client.onConnect = () => {
      this.retryAttempt = 0
      logInfo(this.context, 'connected', { topic: this.topic })
      this.emitter.emit('lifecycle', { state: 'connected' })
      this.subscription = this.client?.subscribe(this.topic, (message) => {
        this.handleMessage(message)
      }) ?? null
    }

    this.client.onWebSocketClose = () => {
      logWarn(this.context, 'disconnected', { topic: this.topic })
      this.retryAttempt += 1
      this.emitter.emit('lifecycle', {
        state: 'retrying',
        attempt: this.retryAttempt,
      })
    }

    this.client.onWebSocketError = () => {
      const errorMessage = 'SOCKET_TRANSPORT_ERROR'
      logError(this.context, 'error', {
        topic: this.topic,
        error: errorMessage,
      })
      this.emitter.emit('error', errorMessage)
    }

    this.client.onStompError = (frame) => {
      const errorMessage = frame.body || 'SOCKET_PROTOCOL_ERROR'
      logError(this.context, 'error', {
        topic: this.topic,
        error: errorMessage,
      })
      this.emitter.emit('error', errorMessage)
    }

    logInfo(this.context, 'connecting', { topic: this.topic, brokerURL })
    this.client.activate()
  }

  disconnect(): void {
    this.subscription?.unsubscribe()
    this.subscription = null

    if (this.client?.active) {
      this.client.deactivate()
    }

    this.client = null
    this.retryAttempt = 0
    this.emitter.emit('lifecycle', { state: 'disconnected' })
    logInfo(this.context, 'disconnected', { topic: this.topic })
  }

  protected emitPayload(payload: TPayload): void {
    this.emitter.emit('message', payload)
  }

  private handleMessage(message: IMessage): void {
    try {
      const parsed = JSON.parse(message.body) as unknown
      const normalized = this.normalizePayload(parsed)

      if (!normalized) {
        return
      }

      this.emitPayload(normalized)
    } catch {
      const errorMessage = 'SOCKET_INVALID_PAYLOAD'
      this.emitter.emit('error', errorMessage)
      logError(this.context, 'invalid_payload', {
        topic: this.topic,
      })
    }
  }

  protected abstract normalizePayload(payload: unknown): TPayload | null
}
