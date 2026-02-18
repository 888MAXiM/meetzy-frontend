import { queries } from '../../../../../api'
import { ChatType } from '../../../../../constants'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { selectChat, setSelectedUser } from '../../../../../redux/reducers/messenger/chatSlice'
import { openCloseSidebar, setMobileMenu } from '../../../../../redux/reducers/messenger/messengerSlice'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { Contact, RecentChatsProps } from '../../../../../types/components/chat'
import { ChatMembersType } from '../../../../../types/store'
import { useDebounce } from '../../../../../utils/useDebounce'

const Contacts: React.FC<RecentChatsProps> = ({ onChatSelect, localSearch }) => {
  const dispatch = useAppDispatch()
  const { userStatuses } = useAppSelector((state) => state.userStatus)
  const { selectedUser, allMembers } = useAppSelector((state) => state.chat)
  const { profileSidebarWidth, sidebarToggle } = useAppSelector((state) => state.messenger)
  const debouncedSearch = useDebounce(localSearch, 500)
  const activeContactId = selectedUser?.chat_type === ChatType.DM ? selectedUser.id : 0
  const { data: searchData } = queries.useSearchContact(debouncedSearch)
  const displayData = searchData && localSearch ? searchData?.contacts : allMembers

  const changeChatClick = (contact: Contact | ChatMembersType) => {
    dispatch(
      selectChat({
        id: contact.chat_id,
        type: contact.chat_type,
        pinned: contact.isPinned,
      }),
    )

    dispatch(setSelectedUser(contact))
    dispatch(setMobileMenu())
    if (profileSidebarWidth <= 800) {
      dispatch(openCloseSidebar(true))
    } else {
      if (!sidebarToggle) {
        dispatch(openCloseSidebar(false))
      }
    }
    onChatSelect?.()
  }

  return (
    <>
      {displayData?.length === 0 ? (
        <div className="empty-state text-center p-4">
          <h5>No Contacts found</h5>
          <p className="text-muted">Join or create a Contact to start chatting</p>
        </div>
      ) : (
        <ul className="chat-main">
          {displayData?.map((chat) => (
            <li
              className={`${activeContactId === chat.chat_id ? 'active' : ''}`}
              key={chat?.chat_id}
              onClick={() => changeChatClick(chat)}
            >
              <div className="chat-box">
                <div className={`profile ${userStatuses[chat?.chat_id]?.status || 'offline'}`}>
                  <ChatAvatar data={{ avatar: chat?.avatar }} name={{ name: chat.name }} customClass="avatar-sm" />
                </div>
                <div className="details">
                  <h6>{chat.name}</h6>
                  <p>{chat.bio}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default Contacts
