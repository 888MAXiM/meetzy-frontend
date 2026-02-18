import { useEffect, type ReactNode } from 'react'
import { SOCKET } from '../../constants/socket'
import { useAppSelector } from '../../redux/hooks'
import { socket } from '../../services/socket-setup'
import { useSocketHandler } from '../hooks/useSocketHandler'
interface SocketProviderProps {
  children: ReactNode
}

const SocketProvider = ({ children }: SocketProviderProps) => {
  const { user, token } = useAppSelector((store) => store.auth)
  useEffect(() => {
    if (user && token) {
      if (!socket.connected) {
        socket.connect()
      }

      const handleConnect = () => {
        socket.emit(SOCKET.Emitters.Join_Room, user.id)
        socket.emit(SOCKET.Emitters.Set_Online)
        socket.emit(SOCKET.Emitters.Request_Status_Update)
      }

      const handleConnectError = (error: Error) => {
        console.error('Socket connection failed:', error)
      }

      const handleDisconnect = (reason: string) => {
        console.log('Socket disconnected:', reason)
      }

      socket.on('connect', handleConnect)
      socket.on('connect_error', handleConnectError)
      socket.on('disconnect', handleDisconnect)

      if (socket.connected) {
        socket.emit(SOCKET.Emitters.Join_Room, user.id)
        socket.emit(SOCKET.Emitters.Set_Online)
        socket.emit(SOCKET.Emitters.Request_Status_Update)
      }

      return () => {
        socket.off('connect', handleConnect)
        socket.off('connect_error', handleConnectError)
        socket.off('disconnect', handleDisconnect)
      }
    } else {
      if (socket.connected) {
        socket.disconnect()
      }
    }
  }, [user, user?.id, token])

  useSocketHandler()

  return <>{children}</>
}

export default SocketProvider
