import { TabContent, TabPane } from 'reactstrap'
import { useAppDispatch, useAppSelector } from '../../../redux/hooks'
import RecentSection from './recent-section'
import ChatSection from './chat-section'
import ScreenNavigation from './ScreenNavigation'
import { setScreen } from '../../../redux/reducers/messenger/screenSlice'
import { closeLeftSide } from '../../../redux/reducers/messenger/mainSidebarSlice'

const LeftSidebarChat = () => {
  const dispatch = useAppDispatch()
  const { mainSidebarActiveTab } = useAppSelector((state) => state.mainSidebar)
  const screen = useAppSelector((state) => state.screen.screen)

  const handleChatSectionClick = () => {
    if (screen !== 'chat') {
      dispatch(setScreen('chat'))
      dispatch(closeLeftSide())
    }
  }

  const showChatSection = screen === 'chat' && !mainSidebarActiveTab

  return (
    <div className="meetzy-left-sidebar left-disp">
      {showChatSection && (
        <div className={`recent-default dynamic-sidebar cursor-pointer active`} onClick={handleChatSectionClick}>
          <RecentSection />
          <ChatSection />
        </div>
      )}
      <TabContent activeTab={mainSidebarActiveTab}>
        <TabPane tabId="status" className="status-tab custom-scroll dynamic-sidebar">
          <ScreenNavigation />
        </TabPane>
        <TabPane tabId="call" className="status-tab custom-scroll dynamic-sidebar">
          <ScreenNavigation />
        </TabPane>
        <TabPane tabId="archive" className="contact-list-tab dynamic-sidebar custom-scroll">
          <ScreenNavigation />
        </TabPane>
        <TabPane tabId="notification" className="notification-tab dynamic-sidebar custom-scroll">
          <ScreenNavigation />
        </TabPane>
        <TabPane tabId="document" className="document-tab custom-scroll dynamic-sidebar">
          <ScreenNavigation />
        </TabPane>
        <TabPane tabId="friend-suggestions" className="contact-list-tab dynamic-sidebar custom-scroll">
          <ScreenNavigation />
        </TabPane>
        <TabPane tabId="blockicon" className="contact-list-tab dynamic-sidebar custom-scroll">
          <ScreenNavigation />
        </TabPane>
        <TabPane tabId="favorite" className="favorite-tab custom-scroll dynamic-sidebar">
          <ScreenNavigation />
        </TabPane>
        <TabPane tabId="settings" className="settings-tab dynamic-sidebar custom-scroll">
          <ScreenNavigation />
        </TabPane>
      </TabContent>
    </div>
  )
}

export default LeftSidebarChat
