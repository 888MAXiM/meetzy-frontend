import { Badge, Collapse } from 'reactstrap'
import { useState } from 'react'
import { useAppSelector } from '../../../../redux/hooks'
import ChatAvatar from '../../../../shared/image/ChatAvatar'
import { formatDate } from '../../../../utils'
import DecryptedMessage from '../../chat/chat-area/chat/messages/DecryptedMessage'
import { Message, StarredMessage } from '../../../../types/api'

const Messages = () => {
  const [messages, setMessages] = useState(true)
  const { selectedUserProfile } = useAppSelector((state) => state.chat)

  const convertToMessage = (starredMessage: StarredMessage): Message => {
    return {
      id: String(starredMessage.id),
      content: starredMessage.content,
      sender_id: starredMessage.sender.id,
      recipient_id: 0,
      message_type: 'text',
      created_at: starredMessage.date,
      updated_at: starredMessage.date,
      sender: {
        id: starredMessage.sender.id,
        name: starredMessage.sender.name,
        avatar: starredMessage.sender.avatar,
      } as any,
      is_encrypted: true,
      isForwarded: false,
      isStarred: true,
    } as Message
  }

  return (
    <div className="status">
      <div className="collapse-block profile-collapse-block open">
        <h5 className="block-title" onClick={() => setMessages(!messages)}>
          Starred Messages
          <Badge className="badge-outline-dark sm">{selectedUserProfile?.starred_messages.length}</Badge>
        </h5>
        <Collapse isOpen={messages} className="block-content">
          <div className="contact-chat p-0 m-0 h-auto">
            <ul className="str-msg custom-scrollbar">
              {selectedUserProfile?.starred_messages && selectedUserProfile?.starred_messages.length > 0 ? (
                selectedUserProfile?.starred_messages.slice(0, 3).map((item, index) => {
                  const messageData = convertToMessage(item)
                  return (
                    <li key={index}>
                      <div className="d-flex gap-2">
                        <div className="profile">
                          <ChatAvatar data={{ avatar: item.sender.avatar }} name={{ name: item.sender.name }} />
                        </div>
                        <div className="flex-grow-1">
                          <div className="contact-name">
                            <h5>{item.sender.name}</h5>
                            <h6>{formatDate(item.date)}</h6>
                          </div>
                          <ul className="msg-box">
                            <li>
                              <DecryptedMessage message={messageData}>
                                {(decryptedContent) => <h5>{decryptedContent}</h5>}
                              </DecryptedMessage>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                  )
                })
              ) : (
                <p>No Starred Messages</p>
              )}
            </ul>
          </div>
        </Collapse>
      </div>
    </div>
  )
}

export default Messages
