import { io, type Socket } from 'socket.io-client'
import { getToken } from '../utils'

export const socket: Socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
  autoConnect: false,
  transports: ['polling', 'websocket'], // Allow both polling and websocket
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  forceNew: false,
  upgrade: true,
  rememberUpgrade: true,
  auth: (cb) => {
    const token = getToken()
    cb({ token })
  },
})