import { FC, memo, useMemo, useState, useEffect } from 'react'
import { Button } from 'reactstrap'
import { SvgIcon } from '../../../../../../shared/icons'
import { Message } from '../../../../../../types/api'
import { decryptMessageIfNeeded } from '../../../../../../utils/e2e-helpers'
import { queries } from '../../../../../../api'

interface LocationMessageProps {
  message: Message
  hideIcon?: boolean
  findMessageById?: any
}

const LocationMessage: FC<LocationMessageProps> = memo((props) => {
  const { message } = props
  const { data: currentUserData } = queries.useGetUserDetails()
  const currentUser = currentUserData?.user
  const isSent = !!currentUser?.id && (message.sender?.id === currentUser.id || message.sender_id === currentUser.id)
  const [decryptedContent, setDecryptedContent] = useState<string>('')

  useEffect(() => {
    const decryptContent = async () => {
      if (!message.content) {
        setDecryptedContent('')
        return
      }

      let isEncrypted = message.is_encrypted === true || message.is_encrypted === 1 || message.is_encrypted === 'true' || message.is_encrypted === '1'
      
      if (!isEncrypted && message.content) {
        if (message.content.startsWith('U2FsdGVk')) {
          isEncrypted = true
        } else {
          try {
            const parsed = JSON.parse(message.content)
            if (parsed && typeof parsed === 'object' && 
              (('encryptedKey' in parsed && 'iv' in parsed && 'encryptedData' in parsed) ||
               ('sender' in parsed && 'recipient' in parsed) ||
               ('sender' in parsed && 'members' in parsed && typeof parsed.members === 'object'))) {
              isEncrypted = true
            }
          } catch {}
        }
      }
      
      if (isEncrypted) {
        try {
          const decrypted = await decryptMessageIfNeeded(
            message.content,
            true,
            isSent,
            message.sender?.id || message.sender_id,
            message.isForwarded,
            currentUser?.id
          )
          setDecryptedContent(decrypted)
        } catch (error) {
          console.error('Error decrypting location message content:', error)
          setDecryptedContent(message.content) // Fallback to original content
        }
      } else {
        setDecryptedContent(message.content)
      }
    }

    decryptContent()
  }, [message.content, message.is_encrypted, message.id, isSent, message.sender?.id, message.sender_id])

  const locationData = useMemo(() => {
    if (!message.metadata) return null

    try {
      let metadata = message.metadata

      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata)
      }

      if (metadata && typeof metadata === 'object') {
        const hasLocationData = metadata.latitude !== undefined && metadata.longitude !== undefined

        if (hasLocationData) {
          return {
            latitude: Number(metadata.latitude),
            longitude: Number(metadata.longitude),
            address: metadata.address || decryptedContent || 'Location',
          }
        }
      }

      return null
    } catch (e) {
      console.error('Failed to parse location metadata:', e)
      return null
    }
  }, [message.metadata, decryptedContent])

  const handleOpenInMaps = () => {
    if (!locationData || typeof locationData.latitude !== 'number' || typeof locationData.longitude !== 'number') return

    const { latitude, longitude } = locationData
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())

    if (isMobile) {
      if (/iphone|ipad|ipod/i.test(userAgent)) {
        window.open(`maps://maps.apple.com/?q=${latitude},${longitude}&ll=${latitude},${longitude}`)
      } else if (/android/i.test(userAgent)) {
        window.open(`geo:${latitude},${longitude}?q=${latitude},${longitude}`)
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)
      }
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`, '_blank')
    }
  }

  if (!locationData) {
    return (
      <div className="location-message-simple">
        <span className="location-icon">
          <SvgIcon iconId="location-2" />
        </span>
        <span>Location data unavailable</span>
      </div>
    )
  }

  return (
    <div className="location-message-simple">
      <div className="location-content">
        <SvgIcon iconId="location-2" className="location-icon" />
        <p>{String(locationData.address || 'Location')}</p>
      </div>
      <Button color="primary" className="location-open-btn" onClick={handleOpenInMaps}>
        Open in Map
      </Button>
    </div>
  )
})

LocationMessage.displayName = 'LocationMessage'

export default LocationMessage
