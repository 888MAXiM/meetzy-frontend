
import { useEffect, useState } from 'react'

interface UseInternetConnectionReturn {
  isOnline: boolean
  isChecking: boolean
  retry: () => void
}

const useInternetConnection = (): UseInternetConnectionReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine) 
  const [isChecking, setIsChecking] = useState(true)

  const checkConnection = async () => {
    setIsChecking(true)
    
    try {
      const endpoints = [
        'https://www.google.com/favicon.ico',
        'https://httpbin.org/status/200',
        '/favicon.ico' 
      ]
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      
      let success = false
      for (const endpoint of endpoints) {
        try {
          await fetch(endpoint, { 
            method: 'HEAD',
            cache: 'no-cache',
            mode: 'no-cors',
            signal: controller.signal
          })
          success = true
          break
        } catch (e) {
          continue
        }
      }
      
      clearTimeout(timeoutId)
      
      if (success) {
        setIsOnline(true)
      } else {
        setIsOnline(false)
      }
    } catch (error) {
      setIsOnline(false)
    } finally {
      setIsChecking(false)
    }
  }

  const retry = () => {
    checkConnection()
  }

  useEffect(() => {
    const handleOnline = () => {
      checkConnection()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsChecking(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const initialCheck = setTimeout(() => {
      checkConnection()
    }, 100)

    return () => {
      clearTimeout(initialCheck)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return {
    isOnline,
    isChecking,
    retry
  }
}

export default useInternetConnection