import { TabContent, TabPane } from 'reactstrap'
import { useAppSelector } from '../../../../redux/hooks'
import ChatTitle from './ChatTitle'
import CallTab from './call'
import ChatTab from './chat'

const ChatSection = () => {
  const { messengerActiveTab } = useAppSelector((state) => state.messenger)
  const { allow_status } = useAppSelector((state) => state.settings)

  return (
    <div className={`chat custom-scroll ${!allow_status ? 'no-status' : ''}`}>
      <ChatTitle />
      <div className="template-tab tab-sm chat-tabs">
        <TabContent activeTab={messengerActiveTab}>
          <TabPane tabId="chat">
            <ChatTab />
          </TabPane>
          <TabPane tabId="call">
            <CallTab />
          </TabPane>
        </TabContent>
      </div>
    </div>
  )
}

export default ChatSection
