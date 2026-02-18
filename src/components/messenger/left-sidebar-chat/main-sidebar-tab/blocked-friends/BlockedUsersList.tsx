import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { UserX } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { mutations } from '../../../../../api'
import { KEYS } from '../../../../../constants/keys'
import { SolidButton } from '../../../../../shared/button'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import type { BlockedUsersListProps } from '../../../../../types/components/chat'
import { formatDate } from '../../../../../utils'
import { toaster } from '../../../../../utils/custom-functions'
import { useDispatch } from 'react-redux'
import { setRecentChatBlockedStatus, setSelectedUser } from '../../../../../redux/reducers/messenger/chatSlice'
import { useAppSelector } from '../../../../../redux/hooks'

const BlockedUsersList: React.FC<BlockedUsersListProps> = ({ blockedUsers, refetch, searchTerm }) => {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [actionLoading, setActionLoading] = useState<{ [key: number | string]: boolean }>({})
  const unblockUser = mutations.useUnblockUser()
  const { selectedUser } = useAppSelector((state) => state.chat)

  const handleUnblock = async (targetId: number | string) => {
    setActionLoading((prev) => ({ ...prev, [targetId]: true }))

    try {
      await unblockUser.mutateAsync({ targetId })
      toaster('success', t('user_unblocked_successfully'))

      if (selectedUser?.chat_id === targetId) {
        dispatch(setSelectedUser({ ...selectedUser, isBlocked: false }))
      }

      dispatch(
        setRecentChatBlockedStatus({
          chatId: targetId,
          isBlocked: false,
        }),
      )

      queryClient.invalidateQueries({ queryKey: [KEYS.BLOCKED_USERS] })
      refetch()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || t('unblock_failed')
      toaster('error', errorMessage)
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }))
    }
  }

  return (
    <ul className="notification-list">
      {blockedUsers.length > 0 ? (
        blockedUsers.map((block) => (
          <li key={block?.id} className="notification-item">
            <div className="notification-content">
              <div className="notification-avatar">
                <ChatAvatar
                  data={block.user || block.group}
                  name={block.user || block.group}
                  customClass="user-info avatar-md"
                />
              </div>

              <div className="notification-body">
                <div className="notification-header">
                  <h6 className="notification-title">{block.user?.name || block.group?.name}</h6>
                  <p className="notification-time">{formatDate(block.created_at)}</p>
                </div>
              </div>
            </div>

            <div className="notification-actions">
              <SolidButton
                color="primary"
                onClick={() => handleUnblock(block.user?.id || block.group?.id)}
                disabled={actionLoading[block.user?.id || block.group?.id]}
              >
                {actionLoading[block.user?.id || block.group?.id] ? (
                  <>{t('unblocking')}</>
                ) : (
                  <>
                    <UserX size={16} className="me-1" />
                    {t('unblock')}
                  </>
                )}
              </SolidButton>
            </div>
          </li>
        ))
      ) : (
        <div className="text-center p-4 text-muted">
          {searchTerm ? 'No blocked user found matching your search.' : 'No blocked user available.'}
        </div>
      )}
    </ul>
  )
}
export default BlockedUsersList
