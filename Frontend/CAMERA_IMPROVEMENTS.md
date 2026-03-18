# 🐦 Mejoras de Integración de Modelos de Python

## Descripción General

El componente **CameraDetailPage** se ha mejorado significativamente para aprovechar al máximo los modelos de Machine Learning de Python disponibles:

- **YOLO (Detector)**: Detecta objetos de la clase "ave" en tiempo real
- **ResNet18 (Clasificador)**: Clasifica la especie entre 100 clases de aves colombianas
- **WebSocket**: Comunicación en tiempo real entre Frontend y Backend de Python

## Características Nuevas

### 1. **AnalysisService** (`src/features/home/services/analysis.service.ts`)
Servicio profesional que maneja la comunicación WebSocket con el backend de Python:

```typescript
// Conectar y escuchar detecciones
analysisService.connect(cameraId, (result) => {
  console.log(`Detectadas ${result.aves_encontradas} aves`);
});

// Enviar un frame de video
const blob = canvas.toBlob(...);
analysisService.sendFrame(blob);

// Monitorear estado de conexión
analysisService.onStatusChange((status) => {
  console.log(`Conexión: ${status}`); // 'connected' | 'disconnected' | 'error'
});

// Auto-reconexión automática en caso de desconexión
```

### 2. **BirdDetectionCard Component**
Tarjeta visual mejorada que muestra cada detección de ave:

- 📊 Tres métricas de confianza separadas:
  - Confianza del Clasificador ResNet18 (0-100%)
  - Confianza del Detector YOLO (0-100%)
  - Score final combinado (65% YOLO + 35% ResNet18)
  
- 🎨 Código de color dinámico según confianza:
  - Verde (≥80%): Alta confianza
  - Azul (60-80%): Confianza media-alta
  - Naranja (40-60%): Confianza media
  - Rojo (<40%): Baja confianza

- 📍 Muestra coordenadas exactas de detección
- 🖼️ Imagen recortada de la detección (foto_base64 de Python)
- ✨ Efecto de glassmorphism moderno

### 3. **DetectionStats Component**
Panel de estadísticas en tiempo real:

- 📈 Total de detecciones
- 🦅 Cantidad de especies únicas detectadas
- 📊 Confianza promedio de todas las detecciones
- 🏆 Top 3 especies más detectadas
- ⭐ Ave con mayor confianza

## Configuración

### Variables de Entorno
Crear un archivo `.env` en la carpeta Frontend:

```env
# URL del servicio de Python (ajustar según tu setup)
VITE_PYTHON_SERVICE_URL=localhost:8000

# Para producción (si está en un servidor diferente):
# VITE_PYTHON_SERVICE_URL=api.example.com:8000
```

Si no se define, por defecto intenta conectar a `localhost:8000`.

## Flujo de Funcionamiento

```
Cliente (React)                           Servidor (Python)
    │                                         │
    ├─ 1. Solicita permisos de cámara       │
    │                                         │
    ├─ 2. Inicia stream de video             │
    │     (getUserMedia)                      │
    │                                         │
    ├─ 3. Conecta WebSocket ────────────────→ /ws/video_stream
    │                                         │
    ├─ 4. Captura frames cada N ms           ├─ YOLO: Detecta aves
    ├─ 5. Convierte a JPEG (70% calidad)    ├─ ResNet18: Clasifica
    ├─ 6. Envía blob a través de WS ───────→ │
    │                                         ├─ Procesa frame
    │                                         ├─ Retorna JSON con:
    │                                         │  - aves_encontradas
    │                                         │  - especie
    │                                         │  - confianza_detector
    │                                         │  - confianza (clasificador)
    │                                         │  - score_final
    │                                         │  - coordenadas
    │                                         │  - foto_base64
    │← ───────────── Mensajes WebSocket ────┤
    │                                         │
    ├─ 7. Renderiza detecciones              │
    ├─ 8. Dibuja cajas en el video           │
    └─ 9. Actualiza estadísticas             │
```

## Controles Disponibles

### Selector de Cámara
- Permite elegir entre varias cámaras conectadas
- Se desactiva mientras está en transmisión

### Control FPS
- Rango: 1 a 30 FPS
- Controla la velocidad de envío de frames
- **Recomendado**: 4-8 FPS (balance rendimiento/detección)
- Se desactiva mientras no hay transmisión

### Botón Iniciar/Detener
- **Iniciar**: Abre cámara y conecta a Python
- **Detener**: Cierra todo e limpia recursos

## Estadísticas en Vivo

El panel de la derecha muestra:

1. **Indicador de Conexión**
   - 🔗 Conectado
   - 🔌 Desconectado
   - ❌ Error

2. **Métricas Rápidas**
   - Total de aves detectadas
   - Especies diferentes encontradas
   - Confianza promedio (%)

3. **Top Especies**
   - Ranking de especies más detectadas
   - Contador de detecciones por especie

4. **Mejor Detección**
   - Muestra la ave detectada con mayor confianza
   - Imagen en miniatura
   - Porcentaje de confianza

## Descarga de Detecciones

Cada detección en la lista del panel lateral es clickeable:
- Click: Abre preview de la imagen
- Descarga automática de `bird-detection-{index}-{especie}.jpg`

## Indicadores Visuales

### En el Video
- **Caja de detección**: Borde coloreado según confianza
- **Etiqueta**: Especie + número de detección
- **Badge de confianza**: % en esquina inferior derecha
- **Indicador en vivo**: "N aves detectadas" (arriba a la izquierda)

### En las Tarjetas
- Tres barras de progreso para las métricas de confianza
- Colores dinámicos que reaccionan a los valores
- Animaciones smooth al actualizar

## Manejo de Errores

El servicio maneja automáticamente:

1. **Permiso de cámara denegado**
   - Muestra mensaje de error específico

2. **Conexión a Python perdida**
   - Intenta reconectarse hasta 5 veces
   - Delay creciente entre intentos
   - Notifica al usuario del estado

3. **Servidor de Python no disponible**
   - Muestra error descriptivo
   - Sugiere verificar que Python está ejecutándose

4. **Problemas de frame**
   - Ignora frames inválidos silenciosamente
   - Continúa con los siguiente

## Tips de Optimización

### Para Mejor Rendimiento
- Reducir FPS a 4 en máquinas lenta s
- Usar cámaras USB de menor resolución
- Asegurar buena conexión a servidor Python

### Para Mejor Detección
- Usar FPS más alto (8-15)
- Mejorar iluminación del área
- Aumentar resolución de cámara
- Entrenar modelos con más datos

### Para Mejor UX
- El combo de confianza (65% YOLO + 35% ResNet) es más robusto
- Las coordenadas se normalizan automáticamente a la resolución actual
- Las transiciones CSS suavizan la experiencia visual

## Tipos y Interfaces

```typescript
// Resultado de detección
interface AnalysisResult {
  timestamp: string
  aves_encontradas: number
  detalles: BirdDetection[]
}

// Detección individual
interface BirdDetection {
  especie: string
  confianza: number (0-100)
  confianza_detector: number (0-100)
  score_final: number (0-100)
  coordenadas: [x1, y1, x2, y2]
  foto_base64: string
  detalles: Record<string, unknown>[]
}

// Estadísticas
interface DetectionStats {
  totalDetections: number
  speciesCount: Map<string, number>
  averageConfidence: number (0-100)
  highestConfidence: BirdDetection | null
  lastDetectionTime: Date | null
}
```

## Troubleshooting

### No conecta a Python
```
1. Verifica que Python está corriendo en puerto 8000
2. Revisa VITE_PYTHON_SERVICE_URL en .env
3. Abre DevTools y verifica erro res en Networks/Console
```

### Detecciones vacías
```
1. Prueba con aves reales en cámara
2. Verifica iluminación
3. Aumenta FPS para más intentos
4. Revisa logs de Python para errores de YOLO
```

### Bajo rendimiento
```
1. Reduce FPS de envío
2. Comprueba CPU/GPU disponible
3. Usa cámara de menor resolución
4. Cierra otras aplicaciones
```

## Compatibilidad

- ✅ Chrome/Edge (WebSocket HTTP)
- ✅ Firefox (WebSocket HTTP)
- ⚠️ HTTPS requiere WSS (WebSocket Secure)
- ✅ Responsive: Desktop, Tablet, Mobile

## Próximas Mejoras Posibles

- [ ] Grabación de video con detecciones
- [ ] Exportar report de estadísticas
- [ ] Filtrar detecciones por confianza mínima
- [ ] Historial persistente de detecciones
- [ ] Multi-cámara simultáneamente
- [ ] Alerts personalizados por especie
- [ ] Integración con Google Maps para ubicación
