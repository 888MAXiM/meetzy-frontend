import type { ReactNode } from 'react'
import { useAppSelector } from '../redux/hooks'
import useAwayDetector from '../hooks/useAwayDetector'
import useNotifications from '../hooks/useNotifications'
import NotificationProvider from './NotificationProvider'

interface WebLayoutProps {
  children: ReactNode
}

const WebLayout = ({ children }: WebLayoutProps) => {
  const { user } = useAppSelector((state) => state.auth)

  useNotifications()
  useAwayDetector(user?.id ?? null)

  return <NotificationProvider>{children}</NotificationProvider>
}

export default WebLayout

