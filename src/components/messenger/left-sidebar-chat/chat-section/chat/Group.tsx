import { queries } from '../../../../../api'
import { ChatType } from '../../../../../constants'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { selectChat, setSelectedUser } from '../../../../../redux/reducers/messenger/chatSlice'
import { setMobileMenu } from '../../../../../redux/reducers/messenger/messengerSlice'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { SvgIcon } from '../../../../../shared/icons'
import { SingleGroup } from '../../../../../types/components/chat'
import { useDebounce } from '../../../../../utils/useDebounce'

const GroupChats = () => {
  const dispatch = useAppDispatch()
  const { selectedUser, recentChatsLoading, recentChats } = useAppSelector((state) => state.chat)
  const { globalSearchTerm, subChatActiveTab } = useAppSelector((state) => state.messenger)
  const debouncedSearch = useDebounce(globalSearchTerm, 500)
  const { data: userGroupsData, isLoading: isLoadingGroups } = queries.useGetUserGroups()
  const { data: searchGroups } = queries.useSearchGroup(debouncedSearch, subChatActiveTab)
  const groups = userGroupsData?.groups || []
  const activeGroupId = selectedUser?.chat_type === ChatType.group ? selectedUser.id : 0
  const displayData = searchGroups && globalSearchTerm && subChatActiveTab === 'group' ? searchGroups?.groups : groups

  const handleGroupSelect = (group: SingleGroup) => {
    dispatch(setSelectedUser({ ...group, chat_type: ChatType.group, chat_id: group.id }))
    dispatch(
      selectChat({
        id: group.id,
        type: ChatType.group,
      }),
    )
    dispatch(setMobileMenu())
  }

  if (isLoadingGroups || recentChatsLoading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading groups...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      {displayData?.length === 0 ? (
        <div className="empty-state text-center p-4">
          <h5>No groups found</h5>
          <p className="text-muted">Join or create a group to start chatting</p>
        </div>
      ) : (
        <ul className="chat-main">
          {displayData?.map((group) => (
            <li
              className={`${activeGroupId === group.id ? 'active' : ''}`}
              key={group.id}
              onClick={() => handleGroupSelect(group)}
            >
              <div className="chat-box">
                <div className="profile">
                  <ChatAvatar data={{ avatar: group?.avatar }} name={{ name: group.name }} customClass="avatar-sm" />
                </div>
                <div className="details">
                  <h6>{group.name}</h6>
                  <p>{group.description}</p>
                </div>
                {(() => {
                  const recentChat = recentChats.find((chat) => chat.chat_id === group.id && chat.chat_type === 'group')
                  return recentChat?.isMuted ? (
                    <div className="date-status">
                      <div className="badge-aligns">
                        <span title="Muted">
                          <SvgIcon className="stroke-primary muted-icon" iconId="muted-volume" />
                        </span>
                      </div>
                    </div>
                  ) : null
                })()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default GroupChats
