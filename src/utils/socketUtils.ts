import { socket } from '../services/socket-setup'
import { SOCKET } from '../constants/socket'

/**
 * Utility functions for socket operations
 */

/**
 * Emit join-room event
 * @param userId - The user ID to join the room for
 */
export const joinRoom = (userId: number): void => {
  if (socket.connected) {
    socket.emit(SOCKET.Emitters.Join_Room, userId)
  } else {
    console.warn('Socket not connected, cannot join room')
  }
}

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socket.connected
}

/**
 * Disconnect socket
 */
export const disconnectSocket = (): void => {
  if (socket.connected) {
    socket.disconnect()
  }
}

/**
 * Connect socket
 */
export const connectSocket = (): void => {
  if (!socket.connected) {
    socket.connect()
  }
}

/**
 * Emit a generic socket event
 * @param event - Event name
 * @param data - Data to send
 */
export const emitSocketEvent = (event: string, data?: unknown): void => {
  if (socket.connected) {
    socket.emit(event, data)
  } else {
    console.warn(`Socket not connected, cannot emit event: ${event}`)
  }
}


