import { useEffect } from 'react'
import { NotificationService, NotificationServiceClass } from '../services/notification-service'

const useAwayDetector = (userId: number | string | null) => {
  useEffect(() => {
    if (!userId) return

    const handleVisibility = () => {
      if (typeof document === 'undefined') return
      if (!document.hidden) {
        NotificationServiceClass.stopTabHighlight()
        NotificationService.stopCallRingtone()
      }
    }

    const handleBeforeUnload = () => {
      NotificationService.stopAllSounds()
    }

    window.addEventListener('focus', handleVisibility)
    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('focus', handleVisibility)
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [userId])
}

export default useAwayDetector
