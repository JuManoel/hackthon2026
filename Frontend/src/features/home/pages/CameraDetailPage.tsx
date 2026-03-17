import { useEffect, useRef, useState, type FC } from 'react'
import { useParams } from 'react-router-dom'

import { labels } from '@/constants/labels'
import { HomeShell } from '@/features/home/components/HomeShell'
import { Button } from '../../../shared/ui/button/Button'

interface CameraDetailPageProps {
  readonly __noProps?: never
}

export const CameraDetailPage: FC<CameraDetailPageProps> = () => {
  const { cameraId } = useParams<{ cameraId: string }>()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  
  const [isStreaming, setIsStreaming] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [streamError, setStreamError] = useState<string>('')
  const [detections, setDetections] = useState<any[]>([])
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    document.title = labels.cameraDetailPageTitle
    
    // Obtener lista de cámaras disponibles
    navigator.mediaDevices.enumerateDevices().then(deviceInfos => {
      const videoDevices = deviceInfos.filter(d => d.kind === 'videoinput')
      setDevices(videoDevices)
      if (videoDevices.length > 0) {
        setSelectedDeviceId(videoDevices[0].deviceId)
      }
    }).catch(err => {
      console.error('Error listando dispositivos:', err)
      setStreamError('No se pudieron obtener las cámaras web.')
    })

    return () => {
      stopStreaming() // Limpieza al desmontar
    }
  }, [])

  const startStreaming = async () => {
    try {
      setStreamError('')
      
      // 1. Iniciar cámara física
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      // 2. Conectar WebSocket a Python
      // Nota: asumo que Python corre en el puerto 8000 (ajustar si es necesario)
      const wsUrl = `ws://localhost:8000/ws/video_stream?id_dispositivo=${cameraId}&camera_id=${cameraId}`
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        console.log('Felicidades: WebSocket conectado al modelo de Python.')
        setIsStreaming(true)
        captureAndSendFrame()
      }
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.alerta && data.detecciones) {
             setDetections(data.detecciones)
          } else {
             setDetections([])
          }
        } catch (e) {
          console.error("No se pudo parsear el mensaje del WS", e)
        }
      }
      
      wsRef.current.onerror = (error) => {
        console.error('Error en WebSocket:', error)
        setStreamError('Error conectando con el servidor de análisis (Python). Confirma que esté encendido.')
        stopStreaming()
      }
      
      wsRef.current.onclose = () => {
        console.log('WebSocket cerrado')
        setIsStreaming(false)
      }
      
    } catch (err) {
      console.error('Error accediendo a la cámara:', err)
      setStreamError('Permiso denegado o cámara en uso por otra app.')
    }
  }

  const stopStreaming = () => {
    // Apagar la cámara física
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    // Cerrar el websocket hacia Python
    if (wsRef.current) {
       wsRef.current.close()
       wsRef.current = null
    }
    
    setIsStreaming(false)
    setDetections([])
  }

  const captureAndSendFrame = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (context && video.videoWidth > 0 && video.videoHeight > 0) {
      // Ajustar tamaño del canvas a la resolución real del video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      // Dibujar frame en el canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convertir el canvas a binario (JPEG comprimido al 70%)
      canvas.toBlob((blob) => {
        if (blob && wsRef.current?.readyState === WebSocket.OPEN) {
           wsRef.current.send(blob)
        }
      }, 'image/jpeg', 0.7)
    }

    // Volver a llamar a esta misma función para transmitir otro frame
    // Aquí puedes controlar los FPS del envío (ej: cada 250ms = 4 FPS)
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
         requestAnimationFrame(captureAndSendFrame)
      }
    }, 250)
  }

  return (
    <HomeShell activeTab="cameras">
      <div className="home-camera-detail-placeholder" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h2 className="home-camera-detail-title">{labels.cameraDetailPlaceholderTitle || 'Vista en Vivo de Cámara'}</h2>
          <p className="home-camera-detail-subtitle">{`${labels.cameraDetailPlaceholderPrefix || 'ID:'} ${cameraId ?? labels.cameraDetailUnknownCamera}`}</p>
        </div>

        {streamError && <p style={{ color: 'red', fontWeight: 'bold' }}>{streamError}</p>}
        
        {devices.length > 0 && !isStreaming && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label>Seleccionar cámara:</label>
            <select 
              value={selectedDeviceId} 
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="auth-input-control"
              style={{ width: 'auto'}}
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Cámara ${device.deviceId.substring(0,5)}...`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          {!isStreaming ? (
            <Button variant="primary" onClick={startStreaming}>
              Conectar y Analizar Video
            </Button>
          ) : (
            <Button variant="primary" onClick={stopStreaming}>
              Detener Transmisión
            </Button>
          )}
        </div>
        
        {/* El contendor del video */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          maxWidth: '640px', 
          aspectRatio: '16/9', 
          backgroundColor: '#000', 
          borderRadius: '8px', 
          overflow: 'hidden' 
        }}>
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted
             onLoadedMetadata={(e) => {
               const video = e.target as HTMLVideoElement
               setVideoDimensions({ width: video.videoWidth, height: video.videoHeight })
             }}
             style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
           />
           
           {/* Info del análisis superpuesta (Python) */}
           {detections.length > 0 && (
             <div style={{ position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(255,0,0,0.7)', color: 'white', padding: '5px 10px', borderRadius: '4px', zIndex: 10 }}>
                ¡Ave detectada! ({detections.length})
             </div>
           )}

           {/* Cajas de detección de YOLO */}
           {videoDimensions.width > 0 && detections.map((det, index) => {
             // asumiendo coordenadas: [x1, y1, x2, y2] enviadas por python
             const [x1, y1, x2, y2] = det.coordenadas
             // Calcular el porcentaje basado en las resoluciones originales del video
             const left = (x1 / videoDimensions.width) * 100
             const top = (y1 / videoDimensions.height) * 100
             const width = ((x2 - x1) / videoDimensions.width) * 100
             const height = ((y2 - y1) / videoDimensions.height) * 100

             return (
               <div
                 key={index}
                 style={{
                   position: 'absolute',
                   border: '2px solid #00FF00',
                   left: `${left}%`,
                   top: `${top}%`,
                   width: `${width}%`,
                   height: `${height}%`,
                   zIndex: 5,
                   pointerEvents: 'none'
                 }}
               >
                 <div style={{
                   position: 'absolute',
                   top: '-25px',
                   left: '-2px',
                   backgroundColor: '#00FF00',
                   color: '#000',
                   padding: '2px 6px',
                   fontSize: '12px',
                   fontWeight: 'bold',
                   whiteSpace: 'nowrap',
                   borderRadius: '4px 4px 4px 0'
                 }}>
                   {det.especie} ({(det.score_final).toFixed(1)}%)
                 </div>
               </div>
             )
           })}
        </div>
        
        {/* Usamos este canvas en memoria (invisible) para sacar las fotos del video */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

      </div>
    </HomeShell>
  )
}
