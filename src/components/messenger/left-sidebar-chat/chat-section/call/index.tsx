import { useState } from 'react'
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap'
import { CallFilter } from '../../../../../constants'
import { callTabData } from '../../../../../data/messenger'
import AllCall from './AllCalls'
import CommonLeftHeading from '../../main-sidebar-tab/common/CommonLeftHeading'
import { useAppSelector } from '../../../../../redux/hooks'
import { useDispatch } from 'react-redux'
import { setScreen } from '../../../../../redux/reducers/messenger/screenSlice'
import { Screen } from '../../../../../types/components/chat'

const CallTab = () => {
  const dispatch = useDispatch()
  const [callSubTab, setCallSubTab] = useState<CallFilter>(CallFilter.All)
  const { audio_calls_enabled, video_calls_enabled } = useAppSelector((state) => state.settings)

  if (!audio_calls_enabled && !video_calls_enabled) {
    dispatch(setScreen(Screen.CHATS))
    return
  }

  return (
    <div className="template-tab tab-icon">
      <CommonLeftHeading title={'call'} subTitle={'call_messages'} />
      <Nav tabs className="mt-3">
        {callTabData.map((item) => (
          <NavItem key={item.type}>
            <NavLink className={callSubTab === item.type ? 'active' : ''} onClick={() => setCallSubTab(item.type)}>
              {item.title ?? item.icon}
            </NavLink>
          </NavItem>
        ))}
      </Nav>

      <TabContent activeTab={callSubTab}>
        {callTabData.map(({ type }) => (
          <TabPane key={type} tabId={type}>
            <AllCall filter={type} />
          </TabPane>
        ))}
      </TabContent>
    </div>
  )
}

export default CallTab
