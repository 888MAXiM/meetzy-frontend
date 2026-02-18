import { useAppSelector } from "../../redux/hooks"

export const useUserStatus = (userId: number | undefined) => {
  const userStatuses = useAppSelector((store) => store.userStatus.userStatuses)
  
  if (!userId) {
    return {
      userId: 0,
      status: 'offline' as const,
      lastSeen: null,
      isOnline: false,
      formatLastSeen: () => 'Offline',
    }
  }

  const userStatus = userStatuses[userId]
  const isOnline = userStatus?.status === 'online'
  const lastSeen = userStatus?.lastSeen

  const formatLastSeen = (): string => {
    if (isOnline) return 'Online'
    if (!lastSeen) return 'Last seen recently'
    
    const date = new Date(lastSeen)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Last seen just now'
    if (diffMins < 60) return `Last seen ${diffMins}m ago`
    if (diffHours < 24) return `Last seen ${diffHours}h ago`
    if (diffDays < 7) return `Last seen ${diffDays}d ago`
    
    return `Last seen ${date.toLocaleDateString()}`
  }
  
  return {
    userId,
    status: userStatus?.status || 'offline',
    lastSeen,
    isOnline,
    formatLastSeen,
  }
}
