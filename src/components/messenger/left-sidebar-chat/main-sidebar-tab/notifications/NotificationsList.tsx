import { Check, Trash2, UserX } from 'react-feather'
import { SolidButton } from '../../../../../shared/button'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { formatDate } from '../../../../../utils'
import { toaster } from '../../../../../utils/custom-functions'
import { KEYS } from '../../../../../constants/keys'
import { mutations } from '../../../../../api'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { NotificationListProps } from '../../../../../types/components/chat'
import type { Notification } from '../../../../../types/api'

const NotificationList: React.FC<NotificationListProps> = ({ notifications, refetch }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string | null }>({})
  const respondToRequest = mutations.useRespondToFriendRequest()
  const deleteNotification = mutations.useDeleteNotification()

  const handleRespond = async (notification: Notification, action: 'accept' | 'reject') => {
    setActionLoading((prev) => ({ ...prev, [notification.from_user_id.id]: action }))
    try {
      await respondToRequest.mutateAsync({ requestId: notification.from_user_id.id, action })
      toaster('success', action === 'accept' ? t('friend_request_accepted') : t('friend_request_rejected'))

      queryClient.invalidateQueries({ queryKey: [KEYS.NOTIFICATIONS] })
      queryClient.invalidateQueries({ queryKey: [KEYS.NOTIFICATION_UNREAD_COUNT] })
      queryClient.invalidateQueries({ queryKey: [KEYS.PENDING_FRIEND_REQUESTS] })
      queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey as any[]
          return queryKey[0] === KEYS.GET_CHAT
        },
      })
      queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })

      refetch()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || t('action_failed')
      toaster('error', errorMessage)
    } finally {
      setActionLoading((prev) => ({ ...prev, [notification.from_user_id.id]: null }))
    }
  }

  const handleDelete = async (notificationId: number | string) => {
    try {
      await deleteNotification.mutateAsync({ notificationId })
      toaster('success', t('notification_deleted'))
      queryClient.invalidateQueries({ queryKey: [KEYS.NOTIFICATIONS] })
      queryClient.invalidateQueries({ queryKey: [KEYS.NOTIFICATION_UNREAD_COUNT] })
      refetch()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || t('delete_failed')
      toaster('error', errorMessage)
    }
  }

  return (
    <ul className="notification-list">
      {notifications.map((notification) => (
        <li
          key={`${notification.from_user_id}-${notification.created_at}`}
          className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
        >
          <div className="notification-content">
            <div className="notification-avatar">
              <ChatAvatar
                data={notification.from_user}
                name={notification.from_user}
                customClass="user-info avatar-md"
              />
            </div>

            <div className="notification-body">
              <div className="notification-header">
                <h6 className="notification-title">{notification.title}</h6>
                <span className="notification-time">{formatDate(notification.created_at)}</span>
              </div>
            </div>

            {notification.type !== 'friend_request' && (
              <button
                className="notification-delete light-icon-box"
                onClick={() => handleDelete(notification.id)}
                title={t('delete_notification')}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
          <p className="notification-message">{notification.message}</p>

          {notification.type === 'friend_request' && (
            <div className="notification-actions">
              <SolidButton
                color="success"
                onClick={() => handleRespond(notification, 'accept')}
                disabled={!!actionLoading[notification.from_user_id.id]}
              >
                {actionLoading[notification.from_user_id.id] === 'accept' ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    {t('accepting')}
                  </>
                ) : (
                  <>
                    <Check size={16} className="me-1" />
                    {t('accept')}
                  </>
                )}
              </SolidButton>

              <SolidButton
                color="danger"
                onClick={() => handleRespond(notification, 'reject')}
                disabled={!!actionLoading[notification.from_user_id.id]}
              >
                {actionLoading[notification.from_user_id.id] === 'reject' ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    {t('rejecting')}
                  </>
                ) : (
                  <>
                    <UserX size={16} className="me-1" />
                    {t('reject')}
                  </>
                )}
              </SolidButton>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export default NotificationList
