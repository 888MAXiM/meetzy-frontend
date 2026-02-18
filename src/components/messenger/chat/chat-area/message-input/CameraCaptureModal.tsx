import { useEffect, useRef, useState } from 'react'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { SvgIcon } from '../../../../../shared/icons'

interface CameraCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onCapture: (file: File) => void
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setIsLoading(false)
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Failed to access camera. Please check permissions.')
      setIsLoading(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw the current video frame to canvas
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert canvas to blob, then to File
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `camera-photo-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            })
            onCapture(file)
            stopCamera()
            onClose()
          }
        },
        'image/jpeg',
        0.9
      )
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} toggle={handleClose} centered size="lg" className="camera-capture-modal">
      <ModalHeader toggle={handleClose}>Take Photo</ModalHeader>
      <ModalBody>
        {error ? (
          <div className="text-center p-4">
            <p className="text-danger">{error}</p>
            <Button color="primary" onClick={startCamera}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="camera-preview-container position-relative">
            {isLoading && (
              <div className="position-absolute top-50 start-50 translate-middle">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading camera...</span>
                </div>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-100"
              style={{
                display: isLoading ? 'none' : 'block',
              }}
            />
            <canvas ref={canvasRef} className='d-none' />
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose}>
          Cancel
        </Button>
        {!error && !isLoading && (
          <Button color="primary camera-aligns-btn" onClick={capturePhoto}>
            <SvgIcon iconId="camera" className="me-2" />
            Capture Photo
          </Button>
        )}
      </ModalFooter>
    </Modal>
  )
}

export default CameraCaptureModal
