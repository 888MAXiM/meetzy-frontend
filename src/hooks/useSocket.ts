import { useEffect, useCallback } from 'react'
import { useAppSelector } from '../redux/hooks'
import { socket } from '../services/socket-setup'
import { SOCKET } from '../constants/socket'

export const useSocket = () => {
  const { user } = useAppSelector((store) => store.auth)

  const emit = useCallback((event: string, data?: unknown) => {
    if (socket.connected) {
      socket.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit event:', event)
    }
  }, [])

  const joinRoom = useCallback((userId: number) => {
    if (socket.connected) {
      socket.emit(SOCKET.Emitters.Join_Room, userId)
    } else {
      console.warn('Socket not connected, cannot join room')
    }
  }, [])

  const isConnected = socket.connected

  return {
    socket,
    emit,
    joinRoom,
    isConnected,
    userId: user?.id,
  }
}

export const useSocketListener = <T = unknown>(
  event: string,
  handler: (data: T) => void,
  deps: unknown[] = []
) => {
  useEffect(() => {
    socket.on(event, handler)

    return () => {
      socket.off(event, handler)
    }
  }, [event, ...deps])
}

export const useUserStatus = (userId: number) => {
  const userStatus = useAppSelector((store) => store.userStatus.userStatuses[userId])
  
  return userStatus || {
    userId,
    status: 'offline' as const,
    lastSeen: null,
  }
}


