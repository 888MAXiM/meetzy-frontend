import { FC, useCallback, useEffect, useState } from 'react'
import { Modal, ModalBody, ModalHeader } from 'reactstrap'
import { mutations } from '../../../../../../api'
import { useAppSelector } from '../../../../../../redux/hooks'
import ChatAvatar from '../../../../../../shared/image/ChatAvatar'
import { MessageReactionProps } from '../../../../../../types/components/chat'

const MessageReactions: FC<MessageReactionProps> = ({ message }) => {
  const { user } = useAppSelector((store) => store.auth)
  const { mutate: toggleReaction } = mutations.useToogleReaction()
  const [firstTwoEmojis, setFirstTwoEmojis] = useState<string[]>([])
  const [openReactionBox, setOpenReactionBox] = useState(false)

  useEffect(() => {
    if (message?.reactions) {
      const emojis = message.reactions.slice(0, 1).map((react) => react.emoji)
      setFirstTwoEmojis(emojis)
    }
  }, [message?.reactions])

  const openModal = () => {
    setOpenReactionBox((pre) => !pre)
  }

  const handleEmojiReaction = useCallback(
    (emoji: string) => {
      if (!message) return
      toggleReaction({ messageId: message.id, emoji: { emoji } })
      openModal()
    },
    [message, user?.id],
  )

  return (
    <>
      {message.reactions && message.reactions?.length > 0 && (
        <span className="emoji" onClick={openModal}>
          {firstTwoEmojis}
          {message.reactions && message.reactions?.length > 1 ? '+' + (message.reactions?.length - 1) : ''}
        </span>
      )}
      <Modal className="message-reactions-modal" isOpen={openReactionBox} centered toggle={openModal}>
        <ModalHeader toggle={openModal}>Reaction {message.reactions?.length}</ModalHeader>
        <ModalBody>
          {message?.reactions?.flatMap((react) =>
            [...react.users]
              .sort((a, b) => (a.id === user?.id ? -1 : b.id === user?.id ? 1 : 0))
              .map((u) => {
                const isYou = u.id === user?.id

                return (
                  <div
                    key={u.id + react.emoji}
                    className="reaction-row"
                    onClick={() => handleEmojiReaction(react.emoji)}
                  >
                    <ChatAvatar data={{ avatar: u.avatar }} name={{ name: u.name }} />
                    <span className="reaction-user">{isYou ? 'You' : u.name}</span>
                    <span className="reaction-emoji">{react.emoji}</span>
                  </div>
                )
              }),
          )}
        </ModalBody>
      </Modal>
    </>
  )
}

export default MessageReactions
