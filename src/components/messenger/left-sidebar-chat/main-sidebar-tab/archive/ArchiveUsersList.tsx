import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mutations } from '../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { selectChat, setSelectedUser, toggleArchiveChat } from '../../../../../redux/reducers/messenger/chatSlice'
import { openCloseSidebar, setMobileMenu } from '../../../../../redux/reducers/messenger/messengerSlice'
import { SolidButton } from '../../../../../shared/button'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import type { ArchiveUsersListProps, ChatItem } from '../../../../../types/components/chat'
import { toaster } from '../../../../../utils/custom-functions'
import { ChatType } from '../../../../../constants'
import { SvgIcon } from '../../../../../shared/icons'
import DecryptedMessage from '../../../chat/chat-area/chat/messages/DecryptedMessage'

const ArchiveUsersList: React.FC<ArchiveUsersListProps> = ({ archiveUsers, searchTerm, refetch }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [actionLoading, setActionLoading] = useState<{ [key: number | string]: boolean }>({})
  const unblockUser = mutations.useUnArchiveUser()
  const { selectedUser } = useAppSelector((state) => state.chat)
  const { profileSidebarWidth, sidebarToggle } = useAppSelector((state) => state.messenger)

  const handleUnblock = async (targetId: number | string, targetType: string) => {
    setActionLoading((prev) => ({ ...prev, [targetId]: true }))
    try {
      await unblockUser.mutateAsync({ targetId, targetType })
      toaster('success', t('user_unarchive_successfully'))
      const chatType = targetType === 'group' ? 'group' : targetType ? 'announcement' : 'direct'
      if (selectedUser?.chat_id === targetId && selectedUser?.chat_type === chatType) {
        dispatch(setSelectedUser({ ...selectedUser, isArchived: false }))
      }
      dispatch(
        toggleArchiveChat({
          chatId: targetId,
          chatType,
          isArchived: false,
        }),
      )
      refetch()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || t('unarchive_failed')
      toaster('error', errorMessage)
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }))
    }
  }

  const changeChatClick = (contact: ChatItem) => {
    dispatch(
      selectChat({
        id: contact.chat_id,
        type: contact.chat_type,
        pinned: contact.isPinned,
      }),
    )

    dispatch(setSelectedUser(contact))
    dispatch(setMobileMenu())
    if (profileSidebarWidth <= 800) {
      dispatch(openCloseSidebar(true))
    } else {
      if (!sidebarToggle) {
        dispatch(openCloseSidebar(false))
      }
    }
  }

  return (
    <ul className="notification-list">
      {archiveUsers.length > 0 ? (
        archiveUsers.map((archive) => {
          const type =
            archive.chat_type === ChatType.group
              ? 'group'
              : archive.isBroadcast
              ? 'broadcast'
              : archive?.isAnnouncement
              ? 'announcement'
              : 'user'
          return (
            <li key={archive.chat_id} className="notification-item d-flex justify-content-between p-0">
              <div className="notification-content flex-grow-1" onClick={() => changeChatClick(archive)}>
                <div className="notification-avatar">
                  <ChatAvatar
                    data={{ avatar: archive.avatar }}
                    name={{ name: archive.name }}
                    customClass="user-info avatar-md"
                  />
                </div>

                <div className="notification-body">
                  <div className="notification-header">
                    <h6 className="notification-title">{archive.name}</h6>
                    {archive?.lastMessage && (
                      <DecryptedMessage message={archive?.lastMessage}>
                        {(decryptedContent) => <p className="notification-time">{decryptedContent}</p>}
                      </DecryptedMessage>
                    )}
                  </div>
                </div>
              </div>
              <SolidButton
                color="primary"
                onClick={() => handleUnblock(archive.chat_id, type)}
                disabled={actionLoading[archive.chat_id]}
                className="p-2"
              >
                {actionLoading[archive.chat_id] ? (
                  <span className="spinner-border spinner-border-sm me-1"></span>
                ) : (
                  <>
                    <SvgIcon iconId="archive" className="unarchive-icon" />
                  </>
                )}
              </SolidButton>
            </li>
          )
        })
      ) : (
        <div className="text-center p-4 text-muted">
          {searchTerm ? 'No archive user found matching your search.' : 'No archive user available.'}
        </div>
      )}
    </ul>
  )
}
export default ArchiveUsersList
