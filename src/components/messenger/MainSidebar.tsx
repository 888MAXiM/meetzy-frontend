import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Nav } from 'reactstrap'
import { ImageBaseUrl, ImagePath } from '../../constants'
import { SIDEBAR_TOOLTIP_LABELS } from '../../constants/hints'
import { ROUTES } from '../../constants/route'
import { TAB_TO_SCREEN_MAP } from '../../data/components'
import { mainSidebarListData } from '../../data/messenger'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import {
  closeLeftSide,
  setMainSidebarActiveTab,
  setMainSidebarWidth,
} from '../../redux/reducers/messenger/mainSidebarSlice'
import { openCloseSidebar } from '../../redux/reducers/messenger/messengerSlice'
import { setScreen } from '../../redux/reducers/messenger/screenSlice'
import { SvgIcon } from '../../shared/icons'
import { Image } from '../../shared/image'
import { Hint } from '../../shared/tooltip'
import { Screen, SidebarTab } from '../../types/components/chat'
import { useTranslation } from 'react-i18next'
import { queries } from '../../api'

const MainSidebar = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { mainSidebarActiveTab } = useAppSelector((state) => state.mainSidebar)
  const screen = useAppSelector((state) => state.screen.screen)
  const { sidebar_logo_url, allow_status, svg_color, allow_archive_chat,audio_calls_enabled,video_calls_enabled } = useAppSelector((state) => state.settings)
  const { sidebarToggle, profileSidebarWidth } = useAppSelector((state) => state.messenger)
  const svgStyle = svg_color ? { color: svg_color, fill: svg_color, stroke: svg_color } : {}
  const { data: unreadCountData } = queries.useGetNotificationUnreadCount()
  const unreadCount = unreadCountData?.count || 0

  const handleTabClick = (tabType: SidebarTab) => {
    if (tabType === SidebarTab.CHATS) {
      dispatch(setScreen(Screen.CHATS))
      dispatch(closeLeftSide())
      if (profileSidebarWidth <= 800) {
        dispatch(openCloseSidebar())
      }
      return
    }

    dispatch(setMainSidebarActiveTab(tabType))
    const screen = TAB_TO_SCREEN_MAP[tabType]
    if (screen) {
      dispatch(setScreen(screen))
    }
    if (profileSidebarWidth <= 800) {
      dispatch(openCloseSidebar())
    }
  }

  useEffect(() => {
    const updateSize = () => dispatch(setMainSidebarWidth(window.innerWidth))
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [dispatch])

  return (
    <>
      <Nav className={`main-nav custom-scroll ${sidebarToggle ? 'on' : ''}`}>
        <div className="logo-wrapper">
          <Link to={ROUTES.Messenger}>
            <Image
              className="img-fluid inner2"
              src={`${sidebar_logo_url ? ImageBaseUrl + sidebar_logo_url : `${ImagePath}/logo/logo-2.svg`}`}
              alt="footer-back-img"
            />
          </Link>
        </div>
        <div className="sidebar-main">
          <ul className="sidebar-top">
            {mainSidebarListData.map((item, index) => {
              if (item.type === SidebarTab.STATUS && !allow_status) return
              if (item.type === SidebarTab.CALL && !audio_calls_enabled && !video_calls_enabled) return
              if (item.type === SidebarTab.ARCHIVE && !allow_archive_chat) return
              const isNotificationTab = item.type === SidebarTab.NOTIFICATION
              return (
                <li key={index} onClick={() => handleTabClick(item.type)}>
                  <Hint label={t(SIDEBAR_TOOLTIP_LABELS[item.type])} placement="right">
                    <a
                      className={`header-icon button-effect ${item.class} ${
                        (item.type === SidebarTab.CHATS && screen === Screen.CHATS) ||
                        (item.type !== SidebarTab.CHATS && mainSidebarActiveTab === item.type)
                          ? 'active'
                          : ''
                      }`}
                    >
                      <SvgIcon className="header-stroke-icon" iconId={item.icon} style={svgStyle} />
                      <SvgIcon className="header-fill-icon" iconId={`fill-${item.icon}`} style={svgStyle} />
                      {isNotificationTab && unreadCount > 0 && (
                        <Badge color="danger" className="notification-badge">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </a>
                  </Hint>
                </li>
              )
            })}
          </ul>
          <ul className="sidebar-bottom">
            <li>
              <Hint label={t(SIDEBAR_TOOLTIP_LABELS.help)} placement="right">
                <a className="header-icon" href="/help" target="_blank" rel="noopener noreferrer">
                  <SvgIcon className="header-stroke-icon" iconId="confirmation" style={svgStyle} />
                  <SvgIcon className="header-fill-icon" iconId="confirmation" style={svgStyle} />
                </a>
              </Hint>
            </li>
          </ul>
        </div>
      </Nav>
    </>
  )
}

export default MainSidebar
