import React, { Fragment, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mutations, queries } from '../../../../api'
import { useQueryClient } from '@tanstack/react-query'
import { SolidButton } from '../../../../shared/button'
import { toaster } from '../../../../utils/custom-functions'
import { KEYS } from '../../../../constants/keys'
import ChatAvatar from '../../../../shared/image/ChatAvatar'
import { Check, Trash2, UserX } from 'react-feather'
import type { Notification } from '../../../../types/api'
import { Image } from '../../../../shared/image'
import { ImagePath } from '../../../../constants'
import { formatDate } from '../../../../utils'

const Notifications = () => {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const { data, isLoading, refetch } = queries.useGetNotifications(page, 20)

  const notifications = data?.notifications || []
  const hasMore = data?.hasMore || false

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  return (
    <Fragment>
      <div className="template-title">
        <div className="d-flex align-items-center">
          <div>
            <h5>{t('notifications')}</h5>
            <p className="mb-0">{t('manage_your_notifications')}</p>
          </div>
        </div>
      </div>

      <div className="notification-container">
        {isLoading ? (
          <div className="text-center p-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state text-center">
            <div className="mb-3">
              <Image src={`${ImagePath}/gif/download.gif`} />
            </div>
            <h5>{t('no_notifications')}</h5>
            <p className="text-muted">{t('no_notifications_desc')}</p>
          </div>
        ) : (
          <>
            <NotificationList notifications={notifications} refetch={refetch} />

            {hasMore && (
              <div className="text-center p-3">
                <SolidButton color="primary" onClick={handleLoadMore} className="load-more-btn">
                  {t('load_more')}
                </SolidButton>
              </div>
            )}
          </>
        )}
      </div>
    </Fragment>
  )
}

export default Notifications

interface NotificationListProps {
  notifications: Notification[]
  refetch: () => void
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, refetch }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [actionLoading, setActionLoading] = useState<{ [key: string]: string | null }>({})

  const respondToRequest = mutations.useRespondToFriendRequest()
  const deleteNotification = mutations.useDeleteNotification()

  const handleRespond = async (notification: Notification, action: 'accept' | 'reject') => {
    setActionLoading((prev) => ({ ...prev, [notification.from_user_id.id]: action }))

    try {
      await respondToRequest.mutateAsync({
        requestId: notification.from_user_id.id,
        action,
      })

      toaster('success', action === 'accept' ? t('friend_request_accepted') : t('friend_request_rejected'))

      queryClient.invalidateQueries({ queryKey: [KEYS.NOTIFICATIONS] })
      queryClient.invalidateQueries({ queryKey: [KEYS.PENDING_FRIEND_REQUESTS] })
      queryClient.invalidateQueries({ queryKey: [KEYS.GET_CHAT] })

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

            <button
              className="notification-delete light-icon-box"
              onClick={() => handleDelete(notification.id)}
              title={t('delete_notification')}
            >
              <Trash2 size={18} />
            </button>
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
                    <span className="spinner-border spinner-border-sm me-2"></span>
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
