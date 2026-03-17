# Implementacion actual de sockets y logs (Frontend + Python + Java)

## 1) Arquitectura
El sistema usa dos canales en paralelo:

1. **Streaming de video (WebSocket directo Frontend <-> Python)**
   - Endpoint principal: `/ws/video_stream`
   - Endpoint diagnostico: `/ws/video_stream/diagnostic`
   - Modos:
     - `publisher`: envia frames en binario (`Blob JPEG`)
     - `viewer`: recibe JSON con `frameBase64` + `detecciones`
   - Identificador canonico: `camera_id`

2. **Eventos de monitoreo/alertas (STOMP Frontend <-> Java)**
   - Endpoint STOMP: `/ws`
   - Topics:
     - `/topic/camera/monitoring/recent`
     - `/topic/alerts`

---

## 2) Frontend: Socket de streaming a Python

Archivo: `Frontend/src/features/realtime/adapters/StreamingSocketAdapter.ts`

### 2.1 Contrato de conexion
```ts
const query = new URLSearchParams({
  camera_id: cameraId,
  mode: options.mode,
})
const socketUrl =
  `${buildStreamingSocketBaseUrl()}${REALTIME_CONSTANTS.streamingSocketPath}?${query.toString()}`
```

- `id_dispositivo` ya no hace parte del contrato WS.
- `connect()` bloquea conexiones duplicadas y evita intentos simultaneos para la misma intencion.

### 2.2 URL de Python obligatoria (sin fallback silencioso)
Archivo: `Frontend/src/features/realtime/adapters/realtime.constants.ts`

`buildStreamingSocketBaseUrl()` ahora:
- exige `VITE_PYTHON_SERVICE_URL`;
- acepta solo:
  - `ws://...`
  - `wss://...`
  - `http://...` (se convierte a `ws://`)
  - `https://...` (se convierte a `wss://`)
- lanza error si la variable falta o tiene formato invalido.

### 2.3 Ack gating de viewer
- El socket viewer no se considera estable hasta recibir `type = viewer_connected`.
- Timeout de ack: `REALTIME_CONSTANTS.viewerAckTimeoutMs` (`5000 ms`).
- Si no llega ack en el tiempo esperado:
  - emite `STREAMING_SOCKET_ACK_TIMEOUT`;
  - cierra el socket de forma controlada;
  - entra al flujo de reconnect.

### 2.4 Reconnect robusto
- La reconexion usa guard de intencion activa (`desiredCameraId`, `desiredMode`).
- Si el usuario cambia de camara o llama `disconnect()`, se cancelan retries pendientes.
- No se reconecta una conexion vieja cuando ya existe una intencion mas nueva.

### 2.5 Errores tipados de streaming
El adapter emite errores operacionales diferenciados:
- `STREAMING_SOCKET_CONFIG_ERROR`
- `STREAMING_SOCKET_UNREACHABLE`
- `STREAMING_SOCKET_CLOSED_BEFORE_ACK`
- `STREAMING_SOCKET_ACK_TIMEOUT`
- `STREAMING_SOCKET_INVALID_PAYLOAD`
- `STREAMING_SOCKET_VIEWER_REJECTED`

### 2.6 Logs estructurados de transporte
`onclose` ahora registra:
- `code`
- `reason`
- `wasClean`
- `readyState`
- `url`

`onerror` ahora registra:
- `readyState`
- `url`
- estado de handshake (`established`, `ackReceived`)

---

## 3) Backend Python: WebSocket `/ws/video_stream`

Archivo: `Backend/Python/app/routes/analysis_router.py`

### 3.1 Validacion temprana de contrato
El endpoint valida antes de entrar a rama de negocio:
- `mode` obligatorio en `{publisher, viewer}`
- `camera_id` obligatorio

Si falla la validacion, cierra con codigo y razon explicita:
- `4400 invalid_mode`
- `4401 missing_camera_id`

### 3.2 Logging de entrada por capa
Al inicio de cada conexion se registra:
- `path`
- `mode`
- `camera_id`
- `client`
- `query` raw

Luego se registra la rama elegida (`viewer` o `publisher`).

### 3.3 Rama viewer persistente con heartbeat explicito
Flujo viewer:
1. Registrar viewer en `camera_viewers[camera_id]`.
2. Enviar ack de aplicacion (`viewer_connected`).
3. Mantener coroutine viva con `receive_text()`.
4. Tratar `ping` como heartbeat.
5. Limpiar viewer en `finally` con log `before/after`.

### 3.4 Rama publisher
Flujo publisher:
1. Recibe bytes con `receive_bytes()`.
2. Procesa YOLO con `procesar_frame(bytes_data, camera_id, "ubicacion_ws")`.
3. Hace broadcast por `camera_id` a viewers registrados.
4. Reenvia detecciones a Java (`/bird/photo_bird`).

### 3.5 Ruta diagnostica dedicada
Nuevo endpoint:
- `/ws/video_stream/diagnostic?camera_id=<id>`

Comportamiento:
1. valida `camera_id`;
2. envia `viewer_connected` inmediato (ack);
3. envia payload dummy periodico con:
   - `timestamp`
   - `frameBase64` (imagen minima)
   - `detecciones: []`
   - `diagnostic: true`

Objetivo: aislar problemas de infraestructura WS sin depender de YOLO ni de Java.

---

## 4) Backend Java: STOMP para monitoreo/alertas

Sin cambios funcionales en esta iteracion.

Se mantiene:
- `CameraSocketAdapter` -> `/topic/camera/monitoring/recent`
- `DetectionSocketAdapter` -> `/topic/alerts`

---

## 5) Variables de entorno y formato valido

Frontend:
- `VITE_API_BASE_URL`
- `VITE_PYTHON_SERVICE_URL` (obligatoria para streaming)

Python:
- `JAVA_SERVICE_URL`

Formato valido para `VITE_PYTHON_SERVICE_URL`:
- `ws://host:port`
- `wss://host:port`
- `http://host:port`
- `https://host:port`

Formato invalido (falla explicita):
- `localhost:8000` (sin esquema)
- string vacio
- valor ausente

---

## 6) Resumen tecnico
La implementacion separa:
- **Video en vivo** por WebSocket contra Python.
- **Monitoreo y alertas globales** por STOMP contra Java.

El canal viewer queda endurecido con:
- contrato explicito (`camera_id`, `mode`);
- handshake con ack obligatorio;
- timeout de ack;
- reconnect con guard de intencion;
- observabilidad de transporte suficiente para diferenciar fallas de red, handshake y backend.
