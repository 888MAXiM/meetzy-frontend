import { FC } from 'react'
import { MessageReadByModalProps } from '../../../../../../types/shared'
import { useAppSelector } from '../../../../../../redux/hooks'
import { queries } from '../../../../../../api'
import { ChatType } from '../../../../../../constants'
import { Status } from '../../../../../../types/api'
import SimpleModal from '../../../../../../shared/modal/SimpleModal'
import UserItem from '../../../../../../shared/UserItem'
import { getChatId } from '../../../../../../utils'

const MessageReadByModal: FC<MessageReadByModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null

  const { selectedUser } = useAppSelector((store) => store.chat)
  const { user } = useAppSelector((store) => store.auth)
  const isGroupChat = selectedUser?.chat_type === 'group'
  const chatId = getChatId(selectedUser)

  const { data: groupData } = queries.useGetGroupMembers(
    isGroupChat ? chatId : undefined,
    { page: 1, limit: 100 },
    { enabled: isGroupChat && !!chatId },
  )
  const getStatusForUser = (userId: string | number): string => {
    const status = message.statuses?.find((s: Status) => {
      return s.user_id == userId
    })
    if (status) {
      return status.status === 'read' || status.status === 'seen' ? 'seen' : status.status
    }
    return 'pending'
  }

  let members: any[] = []
  if (selectedUser?.chat_type === ChatType.group) {
    const rawMembers = groupData?.members || selectedUser.members || []
    members = rawMembers
      .filter((m: any) => {
        const memberId = m.user_id || m.id || m.User?.id
        const currentUserId = user?.id || user?.chat_id
        return memberId !== currentUserId
      })
      .map((m: any) => {
        const userId = m.user_id || m.id || m.User?.id
        return {
          id: userId,
          name: m.User?.name || m.name,
          avatar: m.User?.avatar || m.avatar || '/default-avatar.png',
          last_active: m.User?.last_active || m.last_active,
        }
      })
  } else if (selectedUser?.chat_type === ChatType.DM) {
    members = [
      {
        id: Number(selectedUser?.chat_id || selectedUser?.id),
        name: selectedUser.name,
        last_active: selectedUser.chatStatus,
        avatar: selectedUser.avatar || '/default-avatar.png',
      },
    ]
  }

  const seenUsers = members.filter((m) => {
    const status = getStatusForUser(m.id)
    return status === 'seen' || status === 'read'
  })

  const yetToReadUsers = members.filter((m) => {
    const status = getStatusForUser(m.id)
    return status !== 'seen' && status !== 'read' && status !== 'pending'
  })
  const pendingUsers = members.filter((m) => getStatusForUser(m.id) === 'pending')

  return (
    <SimpleModal isOpen={isOpen} onClose={onClose} title="Read By">
      {selectedUser?.chat_type === ChatType.group && members.length === 0 && (
        <section className="read-by-message">
          <p>No one has read this message yet.</p>
        </section>
      )}
      {selectedUser?.chat_type === ChatType.group && members.length > 0 && (
        <>
          <p className="read-message-title">
            Message read by {seenUsers.length} of {members.length} members
          </p>
          <section className="read-by-message">
            {seenUsers.length === 0 ? (
              <p>No one has read this message yet.</p>
            ) : (
              <>
                <p className="read-message-subtitle mb-2">Read by:</p>
                {seenUsers.map((u) => {
                  const status = message.statuses?.find((s: Status) => s.user_id === u.id)
                  const readTime = status?.updated_at ? new Date(status.updated_at).toLocaleString() : ''
                  return (
                    <UserItem
                      key={u.id}
                      chat={{
                        type: ChatType.DM,
                        id: u.id,
                        name: u.name,
                        avatar: u.avatar,
                        profile_color: u.profile_color,
                        latest_message_at: null,
                        pinned: false,
                      }}
                      last_active={readTime || u.last_active}
                      hideDot={true}
                    />
                  )
                })}
              </>
            )}
          </section>
          {yetToReadUsers.length > 0 && (
            <section className="read-by-message mt-3">
              <p className="read-message-subtitle mb-2">Delivered but not read by {yetToReadUsers.length} member(s):</p>
              {yetToReadUsers.map((u) => (
                <UserItem
                  key={u.id}
                  chat={{
                    type: ChatType.DM,
                    id: u.id,
                    name: u.name,
                    avatar: u.avatar,
                    profile_color: u.profile_color,
                    latest_message_at: null,
                    pinned: false,
                  }}
                  last_active={u.last_active}
                  hideDot={true}
                />
              ))}
            </section>
          )}
          {pendingUsers.length > 0 && (
            <section className="read-by-message mt-3">
              <p className="read-message-subtitle mb-2">Not delivered to {pendingUsers.length} member(s):</p>
              {pendingUsers.map((u, index) => (
                <UserItem
                  key={index}
                  chat={{
                    type: ChatType.DM,
                    id: u.id,
                    name: u.name,
                    avatar: u.avatar,
                    profile_color: u.profile_color,
                    latest_message_at: null,
                    pinned: false,
                  }}
                  last_active={u.last_active}
                  hideDot={true}
                />
              ))}
            </section>
          )}
          {seenUsers.length > 0 && yetToReadUsers.length === 0 && pendingUsers.length === 0 && (
            <section className="read-by-message mt-3">
              <p className="read-msg-heading">All members have read this message.</p>
            </section>
          )}
        </>
      )}
      {selectedUser?.chat_type === ChatType.DM && (
        <section className="read-by-message">
          {seenUsers.length === 0 ? (
            <>
              <p>This message hasn't been read yet.</p>
              {yetToReadUsers.length > 0 && (
                <>
                  <p className="read-message-subtitle mt-2 mb-2">Delivered but not read:</p>
                  {yetToReadUsers.map((u) => (
                    <UserItem
                      key={u.id}
                      chat={{
                        type: ChatType.DM,
                        id: u.id,
                        name: u.name,
                        avatar: u.avatar,
                        profile_color: u.profile_color,
                        latest_message_at: null,
                        pinned: false,
                      }}
                      last_active={u.last_active}
                      hideDot={true}
                    />
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              <p className="read-message-subtitle mb-2">Read by:</p>
              {seenUsers.map((u) => {
                const status = message.statuses?.find((s: Status) => s.user_id === u.id)
                const readTime = status?.updated_at ? new Date(status.updated_at).toLocaleString() : ''
                return (
                  <UserItem
                    key={u.id}
                    chat={{
                      type: ChatType.DM,
                      id: u.id,
                      name: u.name,
                      avatar: u.avatar,
                      profile_color: u.profile_color,
                      latest_message_at: null,
                      pinned: false,
                    }}
                    last_active={readTime || u.last_active}
                    hideDot={true}
                  />
                )
              })}
            </>
          )}
        </section>
      )}
    </SimpleModal>
  )
}

export default MessageReadByModal
