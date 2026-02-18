import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from 'reactstrap'
import { mutations } from '../../../../../api'
import { SvgIcon } from '../../../../../shared/icons'
import EmojiWrapper from '../../../chat/chat-area/message-input/EmojiWrapper'

interface StatusReplyInputProps {
  statusId: string
  onReplySent?: () => void
  onFocus?: () => void
  onBlur?: () => void
  onSend?: () => void
}

const StatusReplyInput: React.FC<StatusReplyInputProps> = ({
  statusId,
  onReplySent,
  onFocus,
  onBlur,
  onSend,
}) => {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { mutate: replyStatus, isPending } = mutations.useReplyStatus()

  const handleEmojiSelect = useCallback((emoji: { emoji?: string }) => {
    const emojiChar = emoji?.emoji ?? ''
    if (!emojiChar) return

    setMessage((prev) => {
      if (!inputRef.current) {
        return `${prev}${emojiChar}`
      }

      const input = inputRef.current
      const selectionStart = input.selectionStart ?? prev.length
      const selectionEnd = input.selectionEnd ?? prev.length
      const newValue = `${prev.slice(0, selectionStart)}${emojiChar}${prev.slice(selectionEnd)}`

      requestAnimationFrame(() => {
        const cursorPosition = selectionStart + emojiChar.length
        input.focus()
        input.setSelectionRange(cursorPosition, cursorPosition)
      })

      return newValue
    })
  }, [])

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim()
    if (!trimmedMessage || isPending) return

    replyStatus(
      {
        status_id: statusId,
        message: trimmedMessage,
      },
      {
        onSuccess: () => {
          setMessage('')
          if (onSend) {
            onSend()
          }
          if (onReplySent) {
            onReplySent()
          }
        },
        onError: (error) => {
          console.error('Error sending status reply:', error)
        },
      },
    )
  }, [message, statusId, isPending, replyStatus, onReplySent, onSend])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  return (
    <div className="status-reply-input-container">
      <div className="status-reply-input-wrapper">
        <EmojiWrapper
          position="top"
          id={`status-reply-emoji-${statusId}`}
          onEmojiSelect={handleEmojiSelect}
          className="status-reply-emoji-wrapper"
          theme="dark"
        >
          <button
            type="button"
            className="status-reply-emoji-btn"
            disabled={isPending}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault()
              inputRef.current?.focus()
            }}
          >
            <SvgIcon className="smile-icon" iconId="smile-2" />
          </button>
        </EmojiWrapper>
        <Input
          innerRef={inputRef}
          type="text"
          className="status-reply-input"
          placeholder={t('type_a_reply_status')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={onFocus}
          onBlur={onBlur}
          disabled={isPending}
        />
        {(message.trim() || isPending) && (
          <div className="status-reply-actions">
            <Button className="status-reply-send-btn" onClick={handleSend} color="primary">
              <SvgIcon iconId="send" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default StatusReplyInput
