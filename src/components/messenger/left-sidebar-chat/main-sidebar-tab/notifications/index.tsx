import { Fragment, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mutations, queries } from '../../../../../api'
import { Image } from '../../../../../shared/image'
import { ImagePath } from '../../../../../constants'
import { SolidButton } from '../../../../../shared/button'
import NotificationList from './NotificationsList'
import CommonLeftHeading from '../common/CommonLeftHeading'
import { useQueryClient } from '@tanstack/react-query'
import { KEYS } from '../../../../../constants/keys'

const Notifications = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const { data, isLoading, refetch } = queries.useGetNotifications(page, 20)
  const markAllAsRead = mutations.useMarkAllNotificationsAsRead()

  const notifications = data?.notifications || []
  const hasMore = data?.hasMore || false

  useEffect(() => {
    const markAsRead = async () => {
      try {
        await markAllAsRead.mutateAsync()
        queryClient.invalidateQueries({ queryKey: [KEYS.NOTIFICATION_UNREAD_COUNT] })
        queryClient.invalidateQueries({ queryKey: [KEYS.NOTIFICATIONS] })
      } catch (error) {
        console.error('Failed to mark notifications as read:', error)
      }
    }

    markAsRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  return (
    <Fragment>
      <CommonLeftHeading title={'notifications'} subTitle={'manage_your_notifications'} />

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
