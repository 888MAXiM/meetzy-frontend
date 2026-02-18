import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Provider, useDispatch } from 'react-redux'
import { ToastContainer } from 'react-toastify'
import { queries } from './api'
import ImpersonationBanner from './components/ImpersonationBanner'
import { ImageBaseUrl } from './constants'
import i18n from './i18n'
import SocketProvider from './layout/components/SocketProvider'
import MaintenancePage from './pages/Maintenance'
import InternetConnectionWrapper from './pages/PageLoader'
import { useAppSelector } from './redux/hooks'
import { loginSuccess, setIsAuthenticated } from './redux/reducers/authSlice'
import { resetChatState } from './redux/reducers/messenger/chatSlice'
import { openCloseSidebar } from './redux/reducers/messenger/messengerSlice'
import { setSetting } from './redux/reducers/settingSlice'
import { setTemplateLayoutData } from './redux/reducers/templateCustomizerSlice'
import Store from './redux/store'
import Routers from './routers/Routers'
import NotificationService from './services/notification-service'
import { getTokenFromUrl } from './utils'
import { loadTranslationsFromBackend } from './utils/i18n-loader'
import { useDynamicFavicon } from './utils/useDynamicFavicon'
import { useDynamicMeta } from './utils/useDynamicMeta'

function AppContent() {
  const dispatch = useDispatch()
  const { sidebarToggle, profileSidebarWidth } = useAppSelector((state) => state.messenger)
  const { token } = useAppSelector((state) => state.auth)
  const { data: publicSettingData } = queries.useGetPublicSettings()
  const { data: settingData } = queries.useGetSettings(token)
  const { layoutType } = useAppSelector((state) => state.templateCustomizer)
  const { favicon_url, app_name, app_description, maintenance_mode, default_language } = useAppSelector(
    (state) => state.settings,
  )
  const { data } = queries.useGetChatWallpapers({ enabled: !!token })
  const isDefaultItem = data?.wallpapers.filter((item) => item.is_default) || []

  const { data: translationData, isLoading: isLoadingTranslation } = queries.useGetTranslation(
    default_language || '',
    !!default_language,
  )

  const impersonationTokenFromUrl = getTokenFromUrl()

  const isImpersonation =
    typeof sessionStorage !== 'undefined' &&
    (sessionStorage.getItem('isImpersonation') === 'true' || !!impersonationTokenFromUrl)

  const { data: userData } = queries.useGetUserDetails({
    enabled: !!token,
    retry: isImpersonation ? 3 : 1,
    retryDelay: isImpersonation ? 1000 : 0,
  })

  useEffect(() => {
    if (impersonationTokenFromUrl) {
      sessionStorage.setItem('isImpersonation', 'true')
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.substring(1))
        hashParams.delete('token')
        if (hashParams.toString()) {
          url.hash = hashParams.toString()
        } else {
          url.hash = ''
        }
      }
      window.history.replaceState({}, '', url.toString())
      dispatch(setIsAuthenticated({ isAuthenticated: true, token: impersonationTokenFromUrl }))
    }
  }, [impersonationTokenFromUrl, dispatch])

  useEffect(() => {
    if (userData) {
      const currentUser = Store.getState().auth.user
      const newUserId = userData?.user?.id
      const currentUserId = currentUser?.id

      if (currentUserId && newUserId && String(currentUserId) !== String(newUserId)) {
        dispatch(resetChatState())
      }

      dispatch(loginSuccess({ token: token!, user: userData?.user }))
    }
  }, [userData, dispatch])

  useEffect(() => {
    if (publicSettingData && !token) {
      dispatch(setSetting(publicSettingData))
    }
  }, [publicSettingData, token, dispatch])

  useEffect(() => {
    const fullUrl =
      isDefaultItem && isDefaultItem.length > 0
        ? isDefaultItem?.[0]?.wallpaper?.startsWith('http')
          ? isDefaultItem?.[0].wallpaper
          : `${ImageBaseUrl}${isDefaultItem?.[0].wallpaper}`
        : ''
    if (isDefaultItem.length > 0) {
      document.documentElement.style.setProperty(
        '--chat-wallpaper',
        `url("${isDefaultItem ? fullUrl : '../../images/wallpaper/1.png'}")`,
      )
    }
  }, [data])

  useEffect(() => {
    if (layoutType) {
      document.body.classList.add('rtl')
      document.querySelector('.rtl-setting')?.classList.add('rtl')
    } else {
      document.body.classList.remove('rtl')
      document.querySelector('.rtl-setting')?.classList.remove('rtl')
    }
  }, [layoutType])

  useEffect(() => {
    if (settingData && token) {
      dispatch(setSetting(settingData))
    }
  }, [settingData, token, dispatch])

  useEffect(() => {
    if (default_language) {
      if (default_language === 'en') {
        if (default_language !== i18n.language) {
          i18n.changeLanguage(default_language)
        }
      } else if (!isLoadingTranslation && translationData?.translation?.translation_json) {
        try {
          loadTranslationsFromBackend(default_language, translationData.translation.translation_json)
          if (default_language !== i18n.language) {
            i18n.changeLanguage(default_language).then(() => {
              i18n.reloadResources(default_language, 'translations')
            })
          }
        } catch (error) {
          console.error('Failed to load translations:', error)
        }
      }
    }
  }, [default_language, translationData, isLoadingTranslation])

  const completeFaviconUrl = favicon_url ? `${ImageBaseUrl}${favicon_url}` : undefined
  useDynamicFavicon(completeFaviconUrl)
  useDynamicMeta({ title: app_name, description: app_description })

  useEffect(() => {
    const savedLayout = localStorage.getItem('templateLayout')
    if (savedLayout) {
      try {
        const parsed = JSON.parse(savedLayout)
        if (parsed.layoutValue) {
          dispatch(setTemplateLayoutData(parsed.layoutValue))
        }
      } catch (error) {
        console.error('Failed to parse saved layout:', error)
      }
    }
  }, [dispatch])

  useEffect(() => {
    NotificationService.initialize()
  }, [])

  const onToolSidebarToggle = () => {
    dispatch(openCloseSidebar())
  }

  if (maintenance_mode) {
    return (
      <InternetConnectionWrapper>
        <SocketProvider>
          <MaintenancePage />
        </SocketProvider>
      </InternetConnectionWrapper>
    )
  }

  return (
    <>
      {profileSidebarWidth <= 800 && (
        <div onClick={onToolSidebarToggle} className={`bg-overlay ${sidebarToggle ? 'show' : ''}`} />
      )}
      <Routers />
      <ToastContainer position="top-center" hideProgressBar theme="dark" />
      <ImpersonationBanner />
    </>
  )
}

function App() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={Store}>
        <InternetConnectionWrapper>
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </InternetConnectionWrapper>
      </Provider>
    </QueryClientProvider>
  )
}

export default App
