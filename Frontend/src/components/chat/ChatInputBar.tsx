import { type ChangeEvent, type ComponentProps, type FC, useRef, useMemo, useEffect, useState } from 'react'
import { SendHorizontal, Paperclip, X, Camera, Image as ImageIcon } from 'lucide-react'

import { labels } from '@/constants/labels'
import { Button } from '@/shared/ui/button/Button'
import { CameraModal } from './CameraModal'

interface ChatInputBarProps {
  readonly value: string
  readonly disabled: boolean
  readonly selectedImage: File | null
  readonly onChange: (value: string) => void
  readonly onImageChange: (image: File | null) => void
  readonly onSubmit: () => Promise<void>
}

export const ChatInputBar: FC<ChatInputBarProps> = ({
  value,
  disabled,
  selectedImage,
  onChange,
  onImageChange,
  onSubmit
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  const previewUrl = useMemo(() => {
    return selectedImage ? URL.createObjectURL(selectedImage) : null
  }, [selectedImage])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAttachMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSubmit: NonNullable<ComponentProps<'form'>['onSubmit']> = (event): void => {
    event.preventDefault()
    void onSubmit()
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value)
  }

  const handleAttachClick = (): void => {
    setIsAttachMenuOpen(!isAttachMenuOpen)
  }

  const handleGalleryClick = (): void => {
    setIsAttachMenuOpen(false)
    fileInputRef.current?.click()
  }

  const handleCameraClick = (): void => {
    setIsAttachMenuOpen(false)
    setIsCameraOpen(true)
  }

  const handlePhotoCapture = (file: File): void => {
    onImageChange(file)
    setIsCameraOpen(false)
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      onImageChange(file)
    }
    // Reset input to allow selecting the same file again
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleRemoveImage = (): void => {
    onImageChange(null)
  }

  const hasContent = value.trim() || selectedImage

  return (
    <>
      <form className="bird-chat-input-bar" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {selectedImage && (
        <div className="bird-chat-image-preview">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Vista previa"
              className="bird-chat-image-thumbnail"
            />
          )}
          <span className="bird-chat-image-name">{selectedImage.name}</span>
          <button
            type="button"
            className="bird-chat-remove-image"
            onClick={handleRemoveImage}
            disabled={disabled}
            aria-label="Remover imagen"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="bird-chat-input-container">
        <div className="bird-chat-attach-wrapper" ref={menuRef}>
          <Button
            type="button"
            className="bird-chat-attach-button"
            variant="ghost"
            disabled={disabled}
            onClick={handleAttachClick}
            aria-label="Opciones de adjunto"
          >
            <Paperclip className="bird-chat-attach-icon" aria-hidden="true" />
          </Button>

          {isAttachMenuOpen && (
            <div className="bird-chat-attach-menu">
              <button 
                type="button" 
                className="bird-chat-attach-menu-item" 
                onClick={handleGalleryClick}
              >
                <ImageIcon size={18} />
                <span>Galería</span>
              </button>
              <button 
                type="button" 
                className="bird-chat-attach-menu-item" 
                onClick={handleCameraClick}
              >
                <Camera size={18} />
                <span>Cámara</span>
              </button>
            </div>
          )}
        </div>

        <input
          id="bird-chat-composer"
          type="text"
          className="bird-chat-input"
          value={value}
          placeholder={labels.chatInputPlaceholder}
          aria-label={labels.chatInputLabel}
          disabled={disabled}
          onChange={handleChange}
        />

          <Button
            type="submit"
            className="bird-chat-send-button"
            variant="primary"
            disabled={disabled || !hasContent}
          >
            <SendHorizontal className="bird-chat-send-icon" aria-hidden="true" />
            <span className="sr-only">{labels.chatSendButton}</span>
          </Button>
        </div>
      </form>
      
      {isCameraOpen && (
        <CameraModal 
          onCapture={handlePhotoCapture} 
          onClose={() => setIsCameraOpen(false)} 
        />
      )}
    </>
  )
}
