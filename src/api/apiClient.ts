import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { jwtDecode } from 'jwt-decode'
import type { ErrorResponseData } from '../types/api'
import { getToken } from '../utils'
import { toaster } from '../utils/custom-functions'
import { ROUTES } from '../constants/route'
import Store from '../redux/store'
import { logout } from '../redux/reducers/authSlice'
import { resetChatState } from '../redux/reducers/messenger/chatSlice'

const bypassMiddlewareEndpoints = ['/settings', '/maintenance'] as const

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

const middleware = (config: AxiosRequestConfig): boolean => {
  if (bypassMiddlewareEndpoints.some((endpoint) => config.url?.includes(endpoint))) {
    return true
  }
  return true
}

/**
 * Check if JWT token is expired
 */
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<{ exp?: number }>(token)
    const currentTime = Date.now() / 1000

    return decoded.exp ? decoded.exp < currentTime : true
  } catch (error) {
    return true
  }
}

const isTokenOrSessionExpired = (message: string): boolean => {
  const expirationMessages = [
    'Session expired or logged out',
    'Token is invalid or expired',
    'Session expired',
    'Token expired',
    'Please log in again',
  ]

  return expirationMessages.some((expMsg) => message.toLowerCase().includes(expMsg.toLowerCase()))
}

apiClient.interceptors.request.use(
  (config) => {
    try {
      middleware(config)
    } catch (error) {
      return Promise.reject(error)
    }

    const token = getToken()
    
    if (token && isTokenExpired(token)) {
      Store.dispatch(resetChatState())
      Store.dispatch(logout())
      window.location.href = ROUTES.Login
      toaster('error', 'Your session has expired. Please log in again.')
      return Promise.reject(new Error('Token expired'))
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }

    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<ErrorResponseData>) => {
    const message =
      error.response?.data?.error || error.response?.data?.message || error.message || 'Something went wrong'

    const isImpersonation = sessionStorage.getItem('isImpersonation') === 'true'

    if (isTokenOrSessionExpired(message)) {
      if (isImpersonation && error.response?.status === 401) {
        const token = getToken()
        if (token && !isTokenExpired(token)) {
          toaster('error', 'Authentication error. Please try again.')
          return Promise.reject(new Error(message))
        }
      }

      Store.dispatch(resetChatState())
      Store.dispatch(logout())
      sessionStorage.removeItem('isImpersonation')
      window.location.href = ROUTES.Login
      toaster('error', 'Your session has expired. Please log in again.')
      return Promise.reject(new Error('Session expired'))
    }

    toaster('error', message)

    return Promise.reject(new Error(message))
  },
)

export default apiClient
