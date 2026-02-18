import { useEffect, useState } from 'react'
import { SvgIcon } from '../../../../../../shared/icons'
import { Message } from '../../../../../../types/api'
import { mutations } from '../../../../../../api'
import { useQueryClient } from '@tanstack/react-query'
import { KEYS } from '../../../../../../constants/keys'
import { toast } from 'react-toastify'
import { Hint } from '../../../../../../shared/tooltip'
import DecryptedMessage from '../messages/DecryptedMessage'

interface PinnedMessagesBarProps {
  messages: Message[]
  onMessageClick: (messageId: number | string) => void
  onClose?: () => void
}

const PinnedMessagesBar = ({ messages, onMessageClick }: PinnedMessagesBarProps) => {
  const queryClient = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const pinMessageMutation = mutations.useTogglePinMessage()
  const pinnedMessages = messages.filter((msg) => msg.isPinned && !msg.isDeleted && !msg.isDeletedForEveryone)

  useEffect(() => {
    setCurrentIndex(0)
  }, [pinnedMessages.length])

  if (pinnedMessages.length === 0) {
    return null
  }

  const currentMessage = pinnedMessages[currentIndex]

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length)
  }

  const getMessagePreview = (message: Message) => {
    if (message.message_type === 'text') {
      return (
        <DecryptedMessage message={message}>
          {(decryptedContent) => {
            const preview = decryptedContent.length > 60 ? decryptedContent.substring(0, 60) + '...' : decryptedContent
            return preview
          }}
        </DecryptedMessage>
      )
    }

    const typeIcons: Record<string, string> = {
      image: '📷 Photo',
      video: '🎥 Video',
      audio: '🎵 Audio',
      file: '📎 File',
      document: '📄 Document',
      sticker: '🎨 Sticker',
      location: '📍 location',
    }

    return typeIcons[message.message_type] || 'Message'
  }

  const getSenderName = (message: Message) => {
    return message.sender?.name || message.sender?.email || 'Unknown'
  }

  const handlePin = async () => {
    try {
      await pinMessageMutation.mutateAsync({
        messageId: currentMessage?.id,
      })
      queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES], exact: false })
    } catch {
      toast.error('Failed to update pin status')
    }
  }

  return (
    <div className="pinned-messages-bar">
      <div className="pinned-content">
        <div>
          {pinnedMessages.length > 1 &&
            pinnedMessages.map((item, index) => (
              <span
                key={index}
                onClick={() => {
                  onMessageClick(item?.id)
                  setCurrentIndex(index)
                }}
                className={`pinned-line ${currentMessage?.id === item.id ? 'active' : ''}`}
              ></span>
            ))}
        </div>
        <Hint label="Unpin" placement="top">
          <div className="pinned-icon" onClick={handlePin}>
            <SvgIcon className="fill-secondary" iconId="stroke-pin" />
          </div>
        </Hint>

        <div
          className="pinned-message-content"
          onClick={() => {
            onMessageClick(currentMessage?.id)
            handleNext()
          }}
        >
          <div className="pinned-header">
            {pinnedMessages.length > 1 && (
              <span className="pinned-count">
                {currentIndex + 1} of {pinnedMessages.length}
              </span>
            )}
          </div>
          <div className="pinned-text">
            <span className="sender-name">{getSenderName(currentMessage)}</span>
            <span className="message-preview">{getMessagePreview(currentMessage)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PinnedMessagesBar
