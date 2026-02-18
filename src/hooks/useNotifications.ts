import { useEffect, useState } from 'react'
import { NotificationService } from '../services/notification-service'

export const useNotifications = () => {
  const [status, setStatus] = useState(NotificationService.getStatus())

  useEffect(() => {
    let isMounted = true

    NotificationService.initialize()
      .then(() => {
        if (isMounted) {
          setStatus(NotificationService.getStatus())
        }
      })
      .catch((error) => {
        console.warn('Notification initialization error:', error)
      })

    const updateStatus = () => {
      if (isMounted) {
        setStatus(NotificationService.getStatus())
      }
    }

    window.addEventListener('focus', updateStatus)
    document.addEventListener('visibilitychange', updateStatus)

    return () => {
      isMounted = false
      window.removeEventListener('focus', updateStatus)
      document.removeEventListener('visibilitychange', updateStatus)
    }
  }, [])

  return status
}

export default useNotifications

