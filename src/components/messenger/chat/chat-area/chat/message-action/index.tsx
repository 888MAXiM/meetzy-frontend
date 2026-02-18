import { useState } from 'react'
import { mutations } from '../../../../../../api'
import { useAppSelector } from '../../../../../../redux/hooks'
import { SvgIcon } from '../../../../../../shared/icons'
import { Message } from '../../../../../../types/api'
import EmojiWrapper from '../../message-input/EmojiWrapper'

const DEFAULT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢']

const MessageActions = ({ message }: { message: Message }) => {
  const { user } = useAppSelector((store) => store.auth)
  const { mutate: toggleReaction } = mutations.useToogleReaction()
  const [showAllEmojis, setShowAllEmojis] = useState(false)

  const handleQuickReaction = (emoji: string) => {
    toggleReaction({ messageId: message.id, emoji: { emoji } })
  }

  const handleEmojiPickerSelect = (emoji: { emoji: string }) => {
    const emojiString = emoji.emoji
    toggleReaction({ messageId: message.id, emoji: { emoji: emojiString } })
  }

  return (
    <div
      className="quick-reactions-container"
      onMouseEnter={() => setShowAllEmojis(true)}
      onMouseLeave={() => setShowAllEmojis(false)}
    >
      <EmojiWrapper
        position={message.sender_id === user?.id ? 'left' : 'right'}
        id={`emoji-reaction-${message.id}`}
        onEmojiSelect={handleEmojiPickerSelect}
        className="popover-trigger"
      >
        <button className="quick-reaction-btn plus-btn" type="button">
          <SvgIcon className={showAllEmojis ? 'plus-icon' : 'smile-icon'} iconId={showAllEmojis ? 'plus' : 'smile-2'} />
        </button>
      </EmojiWrapper>
      <div className={`emoji-slider ${showAllEmojis ? 'show' : ''}`}>
        {DEFAULT_EMOJIS.map((emoji, index) => (
          <button
            key={index}
            className="quick-reaction-btn"
            onClick={() => handleQuickReaction(emoji)}
            type="button"
            style={{ transitionDelay: `${index * 30}ms` }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export default MessageActions
