import { useEffect } from 'react'
import { Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap'
import { queries } from '../../../../../api'
import { getPrivateChatData } from '../../../../../data/messenger'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { setRecentChats, setRecentChatsLoading } from '../../../../../redux/reducers/messenger/chatSlice'
import { setSubRecentActiveTab } from '../../../../../redux/reducers/messenger/messengerSlice'
import { setMyStatuses, setStatuses } from '../../../../../redux/reducers/messenger/statusSlice'
import Contacts from './Contacts'
import GroupChat from './Group'
import PrivateChat from './Recent'
import { useTranslation } from 'react-i18next'

const ChatTab = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { subChatActiveTab, subRecentActiveTab } = useAppSelector((state) => state.messenger)
  const { recentChats, selectedUser } = useAppSelector((state) => state.chat)
  const isLockedChat = recentChats.filter((item) => item.isLocked)
  const PrivateChatData = getPrivateChatData(isLockedChat.length)
  const {
    data: recentChatsData,
    isLoading: isLoadingRecentChats,
    isFetching: isFetchingRecentChats,
  } = queries.useGetRecentChats()

  const { data: currentUserData } = queries.useGetUserDetails()
  const { data: statusData } = queries.useGetStatusFeed()

  useEffect(() => {
    if (statusData?.data) {
      const myStatuses = statusData?.data?.find((feed) => feed.user.id === currentUserData?.user?.id)
      dispatch(setStatuses(statusData.data))
      dispatch(setMyStatuses(myStatuses))
    }
  }, [statusData])

  useEffect(() => {
    dispatch(setRecentChatsLoading(isLoadingRecentChats || isFetchingRecentChats))
  }, [dispatch, isFetchingRecentChats, isLoadingRecentChats])

  useEffect(() => {
    if (!recentChatsData) return
    dispatch(setRecentChats(recentChatsData.chats ?? []))
  }, [dispatch, recentChatsData])

  useEffect(() => {
    if (selectedUser?.isLocked) {
      dispatch(setSubRecentActiveTab('lock_chat'))
    }
  }, [dispatch, selectedUser?.isLocked])

  const onRecentTabClick = (item: string) => {
    dispatch(setSubRecentActiveTab(item))
  }

  return (
    <div className="template-tab">
      <TabContent className="messages-scroll-box" activeTab={subChatActiveTab}>
        <TabPane tabId="direct" className="custom-scroll">
          <Nav tabs className="custom-scrollbar">
            {PrivateChatData.map((item, index) => (
              <NavItem key={index}>
                <NavLink
                  className={`button-effect ${subRecentActiveTab === item.type ? 'active' : ''}`}
                  onClick={() => onRecentTabClick(item.type)}
                >
                  {t(item.title)}
                </NavLink>
              </NavItem>
            ))}
          </Nav>
          <PrivateChat />
        </TabPane>
        <TabPane tabId="contact" className="custom-scroll">
          <Contacts />
        </TabPane>
        <TabPane tabId="group" className="custom-scroll">
          <GroupChat />
        </TabPane>
      </TabContent>
    </div>
  )
}

export default ChatTab
