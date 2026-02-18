import { type ReactNode, useEffect } from 'react'
import { ImageBaseUrl } from '../constants'
import { useAppSelector } from '../redux/hooks'
import { NotificationService, NotificationServiceClass } from '../services/notification-service'

interface NotificationProviderProps {
  children: ReactNode
}

const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { favicon_url, favicon_notification_logo } = useAppSelector((state) => state.settings)

  useEffect(() => {
    NotificationService.initialize().catch((error) => {
      console.warn('Notification service initialization error:', error)
    })
  }, [])

  useEffect(() => {
    const completeFaviconUrl = favicon_url ? `${ImageBaseUrl}${favicon_url}` : undefined
    const completeFaviconNotiUrl = favicon_notification_logo ? `${ImageBaseUrl}${favicon_notification_logo}` : undefined

    if (completeFaviconUrl) {
      NotificationServiceClass.updateOriginalFavicon(completeFaviconUrl)
    }

    if (completeFaviconNotiUrl) {
      NotificationServiceClass.updateNotificationFavicon(completeFaviconNotiUrl)
    }
  }, [favicon_url, favicon_notification_logo])

  return <>{children}</>
}

export default NotificationProvider
