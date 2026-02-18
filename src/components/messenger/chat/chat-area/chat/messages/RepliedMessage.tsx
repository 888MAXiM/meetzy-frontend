//@ts-nocheck
import { FC } from 'react'
import { Image } from '../../../../../../shared/image'
import { SvgIcon } from '../../../../../../shared/icons'
import { extractTextWithMentions, getFileName, getPlainTextFromMessage } from '../../../../../../utils'
import { useAppSelector } from '../../../../../../redux/hooks'
import { MessageTypes } from '../../../../../../types/store'
import DecryptedMessage from './DecryptedMessage'

const RepliedMessage = ({ parentMessage, onClick, message, isLastMessage }) => {
  const { user } = useAppSelector((store) => store.auth)
  if (!parentMessage) return null

  const isReplyingToSelf = parentMessage.sender_id === user?.id
  const parentSenderName = parentMessage.sender?.name || (isReplyingToSelf ? 'You' : 'Unknown')
  const replyLabel = isReplyingToSelf ? 'Replying to yourself' : `Replying to ${parentSenderName}`

  const renderPreviewContent = () => {
    const messageType = parentMessage.message_type as MessageTypes
    const fileName = getFileName(parentMessage)

    const hasContent = typeof parentMessage.content === 'string' && parentMessage.content.trim().length > 0

    switch (messageType) {
      case 'text':
        if (hasContent) {
          return (
            <DecryptedMessage message={parentMessage}>
              {(decryptedContent) => {
                try {
                  const textWithMentions = extractTextWithMentions(decryptedContent)
                  if (textWithMentions && textWithMentions !== decryptedContent) {
                    return <span className="reply-text">{textWithMentions}</span>
                  }

                  const plainText = getPlainTextFromMessage(decryptedContent)
                  return <span className="reply-text">{plainText}</span>
                } catch (error) {
                  console.error('Error extracting preview text:', error)
                  return <span className="reply-text">Message</span>
                }
              }}
            </DecryptedMessage>
          )
        }
        break

      case 'image':
        return (
          <div className="media-preview image-preview">
            {fileName && <div className="file-name-header">{fileName as string}</div>}
            <div className="image-preview-content">
              <Image
                height={50}
                src={parentMessage.file_url || ''}
                alt="Image preview"
                className="thumbnail-img"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
              <div className="fallback-icon hidden">
                <SvgIcon iconId="image" className="common-svg-md" />
              </div>
            </div>
          </div>
        )

      case 'video':
        return (
          <div className="media-preview video-preview">
            {fileName && <div className="file-name-header">{fileName as string}</div>}
            <div className="video-preview-content">
              <div className="video-thumbnail">
                <SvgIcon iconId="play" className="common-svg-md play-icon" />
                {parentMessage.file_url && (
                  <Image
                    src={parentMessage.file_url || ''}
                    alt="Video preview"
                    className="thumbnail-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )

      case 'audio':
      case 'voice':
        return (
          <div className="media-preview audio-preview">
            {fileName && <div className="file-name-header">{fileName as string}</div>}
          </div>
        )

      case 'system':
        return (
          <div className="media-preview system-preview">
            <div className="system-preview-content">
              <SvgIcon iconId="system" className="common-svg-md system-icon" />
            </div>
          </div>
        )

      case 'call':
        return (
          <div className="media-preview call-preview">
            <div className="call-preview-content">
              <SvgIcon iconId="call" className="common-svg-md call-icon" />
            </div>
          </div>
        )

      case 'link':
        return (
          <div className="media-preview link-preview">
            <div className="link-preview-content">
              <SvgIcon iconId="link" className="common-svg-md link-icon" />
            </div>
          </div>
        )

      case 'reminder':
        return (
          <div className="media-preview reminder-preview">
            <div className="reminder-preview-content">
              <SvgIcon iconId="reminder" className="common-svg-md reminder-icon" />
            </div>
          </div>
        )

      default:
        if (hasContent) {
          return (
            <DecryptedMessage message={parentMessage}>
              {(decryptedContent) => {
                try {
                  const textWithMentions = extractTextWithMentions(decryptedContent)
                  if (textWithMentions && textWithMentions !== decryptedContent) {
                    return <span className="reply-text">{textWithMentions}</span>
                  }

                  const plainText = getPlainTextFromMessage(decryptedContent)
                  return <span className="reply-text">{plainText}</span>
                } catch (error) {
                  console.error('Error extracting preview text:', error)
                  return <span className="reply-text">Message</span>
                }
              }}
            </DecryptedMessage>
          )
        }
        return (
          <div className="media-preview default-preview">
            {fileName && <div className="file-name-header">{fileName as string}</div>}
            <div className="default-preview-content">
              <SvgIcon iconId="file" className="common-svg-md default-icon" />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="reply-preview" onClick={onClick}>
      <div className="reply-content">
        {replyLabel && (
          <div className="reply-header">
            <span className="reply-sender">{replyLabel}</span>
          </div>
        )}
        <div className="flex-between">
          <div className="common-flex">{renderPreviewContent()}</div>
          {message?.isFavorite && <div className="common-flex gap-2"></div>}
        </div>
      </div>
    </div>
  )
}

export default RepliedMessage
