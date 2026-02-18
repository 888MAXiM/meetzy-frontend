import { useEffect } from 'react'
import { NotificationServiceClass } from '../../services/notification-service'

export const useTabVisibility = () => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        NotificationServiceClass.stopTabHighlight()
      }
    }

    const handleFocus = () => {
      NotificationServiceClass.stopTabHighlight()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])
}
