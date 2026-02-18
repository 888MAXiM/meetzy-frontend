import { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation } from 'react-feather'
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap'
import { ContactPollData } from '../../../../../data/messenger'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { toggleVisibility } from '../../../../../redux/reducers/messenger/messengerSlice'
import { SvgIcon } from '../../../../../shared/icons'
import { ContactPollProps } from '../../../../../types/components/chat'
import useOutside from '../../../../../utils/useOutside'
import CameraCaptureModal from './CameraCaptureModal'
import CameraNotFoundModal from './CameraNotFoundModal'
import EmojiWrapper from './EmojiWrapper'

interface ExtendedContactPollProps extends ContactPollProps {
  onLocationSelected?: (location: { latitude: number; longitude: number; address: string }) => void
}

const ContactPoll: React.FC<ExtendedContactPollProps> = ({
  isEmojisVisible,
  setIsEmojisVisible,
  onEmojiSelect,
  onEmojiPickerToggle,
  onFilesSelected,
  onLocationSelected,
  innerRef,
}) => {
  const dispatch = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { allow_media_send } = useAppSelector((state) => state.settings)
  const { ref, isComponentVisible, setIsComponentVisible } = useOutside(false)
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [isCameraNotFoundModalOpen, setIsCameraNotFoundModalOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [address, setAddress] = useState<string>('')
  const [isFetchingAddress, setIsFetchingAddress] = useState(false)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesSelected(files)
      setTimeout(() => {
        if (innerRef && 'current' in innerRef) {
          innerRef.current?.focus()
        }
      }, 100)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleMediaClick = async (type: string) => {
    if (!fileInputRef.current) return

    switch (type) {
      case 'Gallery':
        fileInputRef.current.accept = 'image/*'
        break
      case 'Camera':
        // Check if camera is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsCameraNotFoundModalOpen(true)
          setIsComponentVisible(false)
          return
        }

        try {
          // First, try to enumerate devices to check if camera exists
          // This doesn't require permission
          const devices = await navigator.mediaDevices.enumerateDevices()
          const hasCamera = devices.some((device) => device.kind === 'videoinput')

          if (!hasCamera) {
            // If enumerateDevices doesn't find camera, try getUserMedia as fallback
            // This will request permission and check if camera actually exists
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true })
              // If we get here, camera exists, so stop the stream
              stream.getTracks().forEach((track) => track.stop())
              // Open camera modal (it will request permission again, but that's okay)
              setIsCameraModalOpen(true)
              setIsComponentVisible(false)
            } catch (getUserMediaError) {
              setIsCameraNotFoundModalOpen(true)
              setIsComponentVisible(false)
              return
            }
          } else {
            // Camera found via enumeration, open camera modal
            // The modal will request permission when it opens
            setIsCameraModalOpen(true)
            setIsComponentVisible(false)
          }
        } catch (error) {
          // If enumerateDevices fails (might need permission), try getUserMedia as fallback
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            // If we get here, camera exists, so stop the stream
            stream.getTracks().forEach((track) => track.stop())
            // Open camera modal
            setIsCameraModalOpen(true)
            setIsComponentVisible(false)
          } catch (getUserMediaError) {
            setIsCameraNotFoundModalOpen(true)
            setIsComponentVisible(false)
            return
          }
        }
        return // Don't proceed with file input
      case 'Video':
        fileInputRef.current.accept = 'video/*'
        break
      case 'Audio':
        fileInputRef.current.accept = 'audio/*'
        break
      case 'Doc':
        fileInputRef.current.accept = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json'
        break
      case 'Location':
        setIsLocationModalOpen(true)
        setIsComponentVisible(false)
        return // Don't proceed with file input
      default:
        fileInputRef.current.accept =
          'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip,.rar,.7z'
    }

    fileInputRef.current.click()
    setTimeout(() => {
      if (fileInputRef.current && fileInputRef.current.hasAttribute('capture')) {
        fileInputRef.current.removeAttribute('capture')
      }
    }, 100)
    setIsComponentVisible(false)
  }

  const toggleLocationModal = () => {
    setIsLocationModalOpen(!isLocationModalOpen)
    if (!isLocationModalOpen) {
      setSelectedPosition(null)
      setAddress('')
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }

    setIsLocationLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        let locationAddress = ''
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'Chat Application',
              },
            },
          )
          const data = await response.json()
          locationAddress = data.display_name || `${latitude}, ${longitude}`
        } catch (error) {
          console.error('Failed to get address:', error)
          locationAddress = `${latitude}, ${longitude}`
        }

        const locationData = {
          latitude,
          longitude,
          address: locationAddress || `${latitude}, ${longitude}`,
        }

        if (onLocationSelected) {
          onLocationSelected(locationData)
        }
        setIsLocationLoading(false)
        setIsLocationModalOpen(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        let errorMessage = 'Failed to get your location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
        }
        alert(errorMessage)
        setIsLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    )
  }

  const fetchAddress = async (lat: number, lng: number) => {
    setIsFetchingAddress(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Chat Application',
          },
        },
      )
      const data = await response.json()
      const fetchedAddress = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      setAddress(fetchedAddress)
    } catch (error) {
      console.error('Failed to get address:', error)
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    } finally {
      setIsFetchingAddress(false)
    }
  }

  const initializeMap = () => {
    if (!window.L || !document.getElementById('location-map')) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        createMap(latitude, longitude)
      },
      () => {
        createMap(40.7128, -74.006)
      },
    )
  }

  const createMap = (lat: number, lng: number) => {
    if (mapRef.current) {
      mapRef.current.remove()
    }

    const map = window.L.map('location-map').setView([lat, lng], 13)
    mapRef.current = map

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Add marker
    const marker = window.L.marker([lat, lng], {
      draggable: true,
      icon: window.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).addTo(map)

    markerRef.current = marker

    setSelectedPosition({ lat, lng })
    fetchAddress(lat, lng)

    marker.on('dragend', () => {
      const position = marker.getLatLng()
      setSelectedPosition({ lat: position.lat, lng: position.lng })
      fetchAddress(position.lat, position.lng)
    })

    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      setSelectedPosition({ lat, lng })
      fetchAddress(lat, lng)
    })
  }

  const handleShareCustomLocation = () => {
    if (!selectedPosition) return

    const locationData = {
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
      address: address || `${selectedPosition.lat.toFixed(6)}, ${selectedPosition.lng.toFixed(6)}`,
    }

    if (onLocationSelected) {
      onLocationSelected(locationData)
    }
    setIsLocationModalOpen(false)
  }

  const handleCameraCapture = (file: File) => {
    onFilesSelected([file])
    setTimeout(() => {
      if (innerRef && 'current' in innerRef) {
        innerRef.current?.focus()
      }
    }, 100)
  }

  useEffect(() => {
    if (isLocationModalOpen) {
      const cssLink = document.createElement('link')
      cssLink.rel = 'stylesheet'
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(cssLink)

      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.async = true
      script.onload = () => {
        setTimeout(initializeMap, 100)
      }
      document.head.appendChild(script)

      return () => {
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
      }
    }
  }, [isLocationModalOpen])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json,.zip,.rar,.7z"
        onChange={handleFileChange}
      />

      {!!allow_media_send && (
        <div ref={ref} className="contact-poll">
          <a
            className="icon-btn btn-outline-primary outside"
            onClick={(e) => {
              e.preventDefault()
              setIsComponentVisible(!isComponentVisible)
            }}
          >
            <SvgIcon iconId="plus" />
          </a>
          <div className={`contact-poll-content ${isComponentVisible ? 'd-block' : 'd-none'}`}>
            {ContactPollData.map((item, index) => (
              <ul className={item.mainClass} key={index}>
                {item.contactPoll.map((pollItem, pollIndex) => (
                  <li key={pollIndex} onClick={() => handleMediaClick(pollItem.title)} className='cursor-pointer'>
                    <div className={pollItem.class}>
                      <SvgIcon iconId={pollItem.icon} />
                    </div>
                    <span>{pollItem.title}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      <div className="toggle-sticker">
        <a
          className="icon-btn btn-outline-primary button-effect outside"
          onClick={(e) => {
            e.preventDefault()
            dispatch(toggleVisibility('sticker'))
            setIsEmojisVisible(!isEmojisVisible)
          }}
        >
          <SvgIcon iconId="smile" />
        </a>
      </div>

      <EmojiWrapper
        id="message-input-emoji-trigger"
        onEmojiSelect={onEmojiSelect}
        onPickerStateChange={(isOpen) => {
          onEmojiPickerToggle?.(isOpen)
          if (isOpen) {
            setIsEmojisVisible(false)
          }
        }}
      >
        <a
          id="message-input-emoji-trigger"
          className="icon-btn btn-outline-primary button-effect toggle-emoji"
          onClick={(event) => {
            event.preventDefault()
          }}
        >
          <SvgIcon iconId="smile-2" />
        </a>
      </EmojiWrapper>

      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />

      <CameraNotFoundModal isOpen={isCameraNotFoundModalOpen} onClose={() => setIsCameraNotFoundModalOpen(false)} />

      <Modal isOpen={isLocationModalOpen} toggle={toggleLocationModal} size="lg" centered>
        <ModalHeader toggle={toggleLocationModal}>
          <div className="d-flex justify-content-center align-items-center">
            <SvgIcon iconId="location-2" className="location-icon-text me-2" />
            Share Location
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="main-map-box">
            <div id="location-map" className="custom-map"></div>
          </div>
          <div className="location-info">
            <p className="mb-1 text-muted small">Selected Location:</p>
            {isFetchingAddress ? (
              <div className="d-flex align-items-center">
                <span className="text-muted">Fetching address...</span>
              </div>
            ) : (
              <>
                <p className="mb-1 fw-semibold">{address || 'Select a location on the map'}</p>
                {selectedPosition && (
                  <p className="mb-0 text-muted small font-monospace">
                    {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="d-flex flex-column gap-3 mb-3">
            <Button
              color="primary"
              onClick={getCurrentLocation}
              disabled={isLocationLoading}
              className="d-flex align-items-center justify-content-center px-3 py-2 mt-2"
            >
              <Navigation size={16} className="me-2" />
              {isLocationLoading ? 'Getting location...' : 'Send Live Location'}
            </Button>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleLocationModal}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleShareCustomLocation} disabled={!selectedPosition || isFetchingAddress}>
            <div className="d-flex justify-content-center align-items-center">
              <MapPin size={16} className="me-1" />
              Share Location
            </div>
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

// Extend Window interface for Leaflet
declare global {
  interface Window {
    L: any
  }
}

export default ContactPoll
