import { memo } from 'react'
import { ChatType } from '../constants'
import { useAppSelector } from '../redux/hooks'
import { User } from '../types/api'
import ChatAvatar from './image/ChatAvatar'

const UserItem = memo(
  ({
    chat,
    onSelect,
    hideDot,
  }: {
    chat: User
    isActive?: boolean
    onSelect?: () => void
    onPin?: (e: any) => void
    last_active?: string
    hideDot?: boolean
  }) => {
    const { userStatuses } = useAppSelector((state) => state.userStatus)
    const userStatusData = chat?.id ? userStatuses[chat.id] : { status: 'offline', lastSeen: null }
    const status = userStatusData?.status
    const { user } = useAppSelector((store) => store.auth)

    const isMe = user?.chat_id == chat.id
    return (
      <div className="chat-item" onClick={onSelect}>
        <div className="custom-avatar-img avatar-container">
          <div className="custom-avatar-img-container">
            <div className={`profile ${userStatuses[chat.id]?.status || 'offline'}`}>
              <ChatAvatar data={chat} name={chat} customClass="avtar-sm" />
            </div>
            {chat.onlineStatus !== ChatType.group && user?.id != chat.id && !hideDot && (
              <span className={`status-dot ${status || 'offline'}`} />
            )}
          </div>
            <div className="chat-name">{`${chat.name} ${isMe ? '(ME)' : ''}`}</div>
        </div>
      </div>
    )
  },
)

export default UserItem
