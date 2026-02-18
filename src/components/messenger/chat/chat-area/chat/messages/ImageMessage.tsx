import { useCallback, useEffect, useMemo, useState } from 'react'
import { Image } from '../../../../../../shared/image'
import { ImageGallery } from '../../../../../../shared/swiper'
import { Message } from '../../../../../../types/api'
import { GalleryMedia } from '../../../../../../types/shared'
import { SvgIcon } from '../../../../../../shared/icons'
import { downloadFile } from '../../../../../../utils/custom-functions/useFilePreview'
import { useMessageSelection } from '../message-action/useMessageSelection'
import DecryptedMessage from './DecryptedMessage'
import { useTranslation } from 'react-i18next'
import { TAB_TO_SCREEN_MAP } from '../../../../../../data/components'
import { setScreen } from '../../../../../../redux/reducers/messenger/screenSlice'
import { useAppDispatch } from '../../../../../../redux/hooks'

const ImageMessage = ({ message, allMessages }: { message: Message; allMessages: Message[] }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [showModal, setShowModal] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const { isSelectionMode } = useMessageSelection()

  const handleKey = () => {
    if (message?.metadata?.announcement_type === 'get_started') {
      const redirectTab = message.metadata.redirect_url
      if (!redirectTab) return
      const screen = TAB_TO_SCREEN_MAP[redirectTab]
      if (screen) {
        dispatch(setScreen(screen))
      }
    } else if (message?.metadata?.announcement_type === 'learn_more') {
      const url = message?.metadata?.action_link
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  useEffect(() => {
    setShowDownload(false)
  }, [message.id])

  const galleryImages = useMemo(() => {
    if (!message) return []
    const images: GalleryMedia[] = []

    allMessages.forEach((msg) => {
      if (msg.message_type === 'image' && msg.file_url) {
        const imageSrc = msg.file_url
        if (msg.isDeleted) {
          return
        }
        images.push({
          src: imageSrc,
          alt: msg.file_type || 'image',
          messageId: msg.id,
          fileName: msg.file_type || 'image',
          type: 'image',
          isDeleted: msg.isDeleted,
        })
      }
    })

    return images
  }, [allMessages])

  const initialImageIndex = useMemo(() => {
    return galleryImages.findIndex((img) => img.messageId === message.id && img.isDeleted === message.isDeleted)
  }, [galleryImages, message.id])

  const handleImageClick = () => {
    if (isSelectionMode) {
      setShowModal(false)
    } else {
      setShowModal(true)
    }
  }

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const fileNameOriginal = message.metadata?.original_filename || 'file.jpg'

  const handleDownload = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation() // Prevent triggering other click events

      if (!message?.file_url) {
        console.error('No file URL available for download')
        return
      }

      try {
        // Get the actual file name
        const fileName = message.metadata?.original_filename || fileNameOriginal || `image_${message.id}.jpg`

        await downloadFile(message.file_url, fileName)
      } catch (error) {
        console.error('Failed to download image:', error)
        // You might want to add user notification here
      }
    },
    [message.file_url, message.id, message.metadata?.original_filename, fileNameOriginal],
  )

  return (
    <>
      {!message.isAnnouncement ? (
        <div
          className="gallery-img"
          onMouseEnter={() => setShowDownload(true)}
          onMouseLeave={() => setShowDownload(false)}
        >
          <div className="image-wrapper">
            <Image src={message.file_url} alt="message image" className="img-fluid" onClick={handleImageClick} />
            {showDownload && <SvgIcon iconId="download" onClick={handleDownload} className="image-download-icon" />}
          </div>
          {message.content && (
            <h5>
              <DecryptedMessage message={message}>{(decryptedContent) => decryptedContent}</DecryptedMessage>
            </h5>
          )}
        </div>
      ) : (
        <div
          className="announce-preview-card"
          onMouseEnter={() => setShowDownload(true)}
          onMouseLeave={() => setShowDownload(false)}
        >
          <div className="announce-preview-card-inner">
            {message.file_url && (
              <div className="announce-preview-content">
                <Image
                  src={message.file_url || '/card-bg.png'}
                  alt="Status preview"
                  className="announce-preview-image"
                  onClick={handleImageClick}
                />
                {showDownload && <SvgIcon iconId="download" onClick={handleDownload} className="image-download-icon" />}
              </div>
            )}
            {message?.metadata?.title && <div className="announce-preview-card-title">{message?.metadata?.title}</div>}
            {message.content && <div className="announce-preview-card-desc">{message.content}</div>}
            {message?.metadata?.announcement_type && message?.metadata?.announcement_type !== 'none' && (
              <>
                <hr />
                <div className="d-flex justify-content-center" onClick={handleKey}>
                  <button className="announce-preview-card-btn">{t(message?.metadata?.announcement_type)}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showModal && (
        <ImageGallery
          images={galleryImages}
          initialIndex={initialImageIndex}
          className="image-overlay-modal"
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}

export default ImageMessage
