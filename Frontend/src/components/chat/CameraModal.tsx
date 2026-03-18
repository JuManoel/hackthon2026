import { type FC, useEffect, useRef, useState } from 'react'
import { Camera, X, RefreshCw } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import './camera-modal.css'

interface CameraModalProps {
  readonly onCapture: (file: File) => void
  readonly onClose: () => void
}

export const CameraModal: FC<CameraModalProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const startCamera = async (): Promise<void> => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
      } catch (err) {
        setError('No se pudo acceder a la cámara. Por favor, concede permisos.')
        console.error('Error accessing camera:', err)
      }
    }

    void startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop()
        })
      }
    }
  }, []) // Empty deps for one-time initialization

  const handleCapture = (): void => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const context = canvas.getContext('2d')
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
            onCapture(file)
            
            // Stop tracks before closing
            if (stream) {
              stream.getTracks().forEach(track => {
                track.stop()
              })
            }
          }
        }, 'image/jpeg', 0.9)
      }
    }
  }

  const handleClose = (): void => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop()
      })
    }
    onClose()
  }

  return (
    <div className="bird-camera-modal-overlay">
      <div className="bird-camera-modal-content">
        <div className="bird-camera-modal-header">
          <h3 className="bird-camera-modal-title">Tomar Foto</h3>
          <button type="button" className="bird-camera-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="bird-camera-modal-body">
          {error ? (
            <div className="bird-camera-error">
              <p>{error}</p>
            </div>
          ) : (
            <div className="bird-camera-viewfinder">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="bird-camera-video"
              />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}
        </div>
        
        <div className="bird-camera-modal-footer">
          <Button 
            type="button" 
            variant="primary" 
            className="bird-camera-capture-btn"
            onClick={handleCapture}
            disabled={!!error}
          >
            <Camera size={24} />
          </Button>
        </div>
      </div>
    </div>
  )
}
