import { JSX, useEffect, useState } from 'react'
import { STORAGE_KEYS } from '../../../constants/storageKeys'
import WebLayout from '../../../layout/WebLayout'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'
import { setMainSidebarActiveTab } from '../../../redux/reducers/messenger/mainSidebarSlice'
import { setScreen, type Screen } from '../../../redux/reducers/messenger/screenSlice'
import { getStorage } from '../../../utils'
import ArchiveUsers from './main-sidebar-tab/archive'
import BlockedUsers from './main-sidebar-tab/blocked-friends'
import Document from './main-sidebar-tab/Document'
import Favorite from './main-sidebar-tab/favorite'
import Friends from './main-sidebar-tab/friends'
import Notifications from './main-sidebar-tab/notifications'
import Settings from './main-sidebar-tab/settings'
import Status from './main-sidebar-tab/status'
import RecentSection from './recent-section'
import CallTab from './chat-section/call'

const screenToTabMap: Partial<Record<Screen, string>> = {
  chat: '',
  call: 'call',
  favorites: 'favorite',
  documents: 'document',
  friends: 'friend-suggestions',
  archive: 'archive',
  'blocked-users': 'blockicon',
  status: 'status',
  notifications: 'notification',
  settings: 'settings',
}

const ScreenNavigation = () => {
  const dispatch = useAppDispatch()
  const screen = useAppSelector((store) => store.screen.screen)
  const [isScreenLoaded, setIsScreenLoaded] = useState(false)
  const storage = getStorage()

  useEffect(() => {
    const savedScreen = storage.getItem(STORAGE_KEYS.CURRENT_SCREEN) as Screen | null
    const validScreens: Screen[] = [
      'chat',
      'call',
      'favorites',
      'documents',
      'friends',
      'archive',
      'blocked-users',
      'status',
      'notifications',
      'settings',
    ]

    if (savedScreen && validScreens.includes(savedScreen) && savedScreen !== 'chat') {
      dispatch(setScreen(savedScreen))
      const tabId = screenToTabMap[savedScreen]
      if (tabId) {
        dispatch(setMainSidebarActiveTab(tabId))
      } else {
        dispatch(setMainSidebarActiveTab(''))
      }
    } else {
      // Default to chat if nothing saved (e.g., first load after login)
      dispatch(setScreen('chat'))
      dispatch(setMainSidebarActiveTab(''))
    }

    setIsScreenLoaded(true)
  }, [])

  useEffect(() => {
    if (!isScreenLoaded) return

    if (screen) {
      storage.setItem(STORAGE_KEYS.CURRENT_SCREEN, screen)
      const tabId = screenToTabMap[screen]
      if (tabId) {
        dispatch(setMainSidebarActiveTab(tabId))
      } else {
        dispatch(setMainSidebarActiveTab(''))
      }
    }
  }, [screen, dispatch, storage, isScreenLoaded])

  if (!isScreenLoaded) return null

  let content: JSX.Element | null = null

  switch (screen) {
    case 'chat':
      content = <RecentSection />
      break
    case 'call':
      content = <CallTab />
      break
    case 'favorites':
      content = <Favorite />
      break
    case 'documents':
      content = <Document />
      break
    case 'friends':
      content = <Friends />
      break
    case 'archive':
      content = <ArchiveUsers />
      break
    case 'blocked-users':
      content = <BlockedUsers />
      break
    case 'status':
      content = <Status />
      break
    case 'notifications':
      content = <Notifications />
      break
    case 'settings':
      content = <Settings />
      break
    default:
      content = null
  }

  if (!content) {
    return null
  }

  return <WebLayout>{content}</WebLayout>
}

export default ScreenNavigation
