import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Plus } from 'react-feather'
import { Badge, Button } from 'reactstrap'
import { mutations, queries } from '../../../../../api'
import { ImagePath } from '../../../../../constants'
import { KEYS } from '../../../../../constants/keys'
import { TAB_TO_SCREEN_MAP } from '../../../../../data/components'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import {
  selectChat,
  setSelectedChatMessages,
  setSelectedUser,
  togglePinChat,
} from '../../../../../redux/reducers/messenger/chatSlice'
import { setMainSidebarActiveTab } from '../../../../../redux/reducers/messenger/mainSidebarSlice'
import { openCloseSidebar, setMobileMenu } from '../../../../../redux/reducers/messenger/messengerSlice'
import { setScreen } from '../../../../../redux/reducers/messenger/screenSlice'
import { setChatPinVerified } from '../../../../../redux/reducers/userSettingSlice'
import { SvgIcon } from '../../../../../shared/icons'
import { Image } from '../../../../../shared/image'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { RecentChat, RecentChatsProps } from '../../../../../types/components/chat'
import { formatTime } from '../../../../../utils'
import { useDebounce } from '../../../../../utils/useDebounce'
import LockChatModal from '../../../chat/chat-area/chat-header/contact/LockChatModal'
import DecryptedMessagePreview from './DecryptedMessagePreview'
import RecentQuickAction from './RecentQuickAction'

const RecentChats: React.FC<RecentChatsProps> = ({ onChatSelect, localSearch }) => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const [lockOpen, setLockOpen] = useState(false)
  const { selectedChat, selectedUser, recentChats, recentChatsLoading } = useAppSelector((state) => state.chat)
  const { subRecentActiveTab } = useAppSelector((state) => state.messenger)
  const { profileSidebarWidth, globalSearchTerm, subChatActiveTab } = useAppSelector(
    (state) => state.messenger,
  )
  const { time_format } = useAppSelector((state) => state.settings)
  const use12HourFormat = time_format === '12h'
  const { app_name } = useAppSelector((state) => state.settings)
  const { chatPinVerified } = useAppSelector((state) => state.userSettings)
  const debouncedSearch = useDebounce(globalSearchTerm, 500)
  const { userStatuses } = useAppSelector((state) => state.userStatus)
  const [, setPinedMenu] = useState<{ [key: number | string]: boolean }>({})
  const [activeDropdown, setActiveDropdown] = useState<RecentChat | null>(null)
  const { data: currentUserData } = queries.useGetUserDetails()
  const { data: searchRecent } = queries.useSearchRecent(debouncedSearch, subChatActiveTab)

  const filterByTab = (chats?: RecentChat[]) => {
    if (!chats) return []

    switch (subRecentActiveTab) {
      case 'all':
        return chats.filter((contact) => !contact.isArchived && !contact.isLocked)

      case 'unread':
        return chats.filter((contact) => !contact.isArchived && contact.unreadCount > 0)

      case 'favourite':
        return chats.filter((contact) => !contact.isArchived && contact.isFavorite)

      case 'group':
        return chats.filter((contact) => contact.chat_type == 'group')

      case 'lock_chat':
        return chats.filter((contact) => contact.isLocked)

      default:
        return chats.filter((contact) => !contact.isArchived)
    }
  }

  const visibleRecentChats = filterByTab(recentChats)
  let displayData = visibleRecentChats
  if (localSearch) {
    displayData =
      visibleRecentChats?.filter((contact) => contact.name?.toLowerCase().includes(localSearch.toLowerCase())) || []
  } else if (searchRecent && subChatActiveTab === 'direct') {
    displayData =
      searchRecent && globalSearchTerm && subChatActiveTab === 'direct'
        ? filterByTab(searchRecent?.chats)
        : visibleRecentChats
  }

  const currentUser = currentUserData?.user
  const activeChat = selectedChat?.id || null
  const togglePinConversation = mutations.useTogglePinConversation()

  const handlePined = async (user: RecentChat, e: React.MouseEvent) => {
    e.stopPropagation()
    togglePinConversation.mutate(
      { targetId: user.chat_id, type: user.isAnnouncement ? 'announcement' : user.chat_type },
      {
        onSuccess: (data) => {
          dispatch(
            togglePinChat({
              id: user.chat_id,
              type: user.chat_type,
              pinned: Boolean(data?.pinned),
              pinned_at: data?.pinned_at ?? null,
            }),
          )
        },
      },
    )
    setPinedMenu((prev) => ({
      ...prev,
      [user.chat_id]: !prev[user.chat_id],
    }))
  }

  const changeChatClick = (contact: RecentChat) => {
    dispatch(
      selectChat({
        id: contact.chat_id,
        type: contact.chat_type,
        pinned: contact.isPinned,
      }),
    )

    dispatch(setSelectedUser(contact))
    dispatch(setMobileMenu())
    // if (profileSidebarWidth <= 800) {
    //   dispatch(openCloseSidebar(true))
    // } else {
    //   if (!sidebarToggle) {
    //     dispatch(openCloseSidebar(false))
    //   }
    // }
    onChatSelect?.()

    if (
      (selectedUser?.chat_id !== contact.chat_id ||
        selectedUser?.chat_type !== contact.chat_type ||
        !chatPinVerified) &&
      contact.isLocked
    ) {
      dispatch(setSelectedChatMessages([]))
      dispatch(setChatPinVerified(null))
      queryClient.removeQueries({
        queryKey: [KEYS.GET_MESSAGES, contact.chat_id, contact.chat_type],
      })
      setLockOpen(true)
    }
  }

  if (recentChatsLoading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  const handleAddFriend = () => {
    dispatch(setMainSidebarActiveTab('friend-suggestions'))
    const screen = TAB_TO_SCREEN_MAP['friend-suggestions']
    if (screen) {
      dispatch(setScreen(screen))
    }
    if (profileSidebarWidth <= 800) {
      dispatch(openCloseSidebar())
    }
  }

  const getEmptyStateMessage = () => {
    if (localSearch) {
      return {
        title: 'No matching contacts',
        description: 'Try a different search term',
      }
    }

    switch (subRecentActiveTab) {
      case 'unread':
        return {
          title: 'No unread messages',
          description: 'All caught up! You have no unread conversations.',
        }
      case 'favourite':
        return {
          title: 'No favorite contacts',
          description: 'Mark contacts as favorite to see them here',
        }
      case 'group':
        return {
          title: 'No groups chats',
          description: 'Group conversations will appear here',
        }
      default:
        return {
          title: 'No contacts yet',
          description: 'Add friends to start chatting',
        }
    }
  }

  if (displayData?.length === 0) {
    const emptyState = getEmptyStateMessage()
    return (
      <div className="empty-state recent-chat-empty text-center">
        <div className="mb-3">
          <Image src={`${ImagePath}/gif/download.gif`} />
        </div>
        <h5>{emptyState.title}</h5>
        <p className="text-muted">{emptyState.description}</p>
        {subRecentActiveTab === 'direct' && !localSearch && (
          <Button color="primary" className="d-flex mx-auto px-3 py-2" onClick={handleAddFriend}>
            <Plus />
            Add Friends
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <ul className="chat-main custom-scroll">
        {displayData?.map((contact, index) => {
          return (
            <li
              className={`${
                activeChat === contact.chat_id && selectedChat?.type === contact.chat_type ? 'active' : ''
              } ${contact?.isPinned ? 'pined' : ''}`}
              key={index}
              onClick={() => changeChatClick(contact)}
            >
              <div className="chat-box">
                {!contact.isBroadcast ? (
                  <div
                    className={`profile ${
                      contact.chat_type !== 'group' && !contact.isAnnouncement
                        ? userStatuses[contact?.chat_id]?.status || 'offline'
                        : ''
                    }`}
                  >
                    <ChatAvatar
                      data={contact}
                      name={{ name: contact.isAnnouncement ? app_name : contact.name }}
                      customClass="user-info avatar-sm"
                    />
                  </div>
                ) : (
                  <div
                    className={`profile chatavtar-div d-flex justify-content-center align-items-center main-broadcast`}
                  >
                    <SvgIcon iconId="broadcast" />
                  </div>
                )}
                <div className="details">
                  <div className="d-flex">
                    <h6>{contact.isAnnouncement ? app_name : contact.name || 'Unknown User'}</h6>
                    {(contact.isAnnouncement ||
                      (contact.chat_type !== 'group' &&
                        (contact.is_verified || Boolean(contact?.sender?.is_verified)))) && (
                      <SvgIcon iconId="blue-tick" className="ms-1" />
                    )}
                  </div>
                  <p className={contact.unreadCount > 0 && contact.chat_id !== currentUser?.id ? 'font-primary' : ''}>
                    {contact.lastMessage &&
                      !contact.isBroadcast &&
                      contact.lastMessage.sender_id === currentUser?.id &&
                      contact.lastMessage.message_type !== 'system' &&
                      (() => {
                        const isGroup = contact.chat_type === 'group'
                        let statuses: any[] = []
                        const rawStatuses = contact.lastMessage.statuses

                        if (rawStatuses) {
                          if (Array.isArray(rawStatuses)) {
                            statuses = rawStatuses
                          } else if (typeof rawStatuses === 'string') {
                            try {
                              const parsed = JSON.parse(rawStatuses)
                              statuses = Array.isArray(parsed) ? parsed : parsed ? [parsed] : []
                            } catch {
                              statuses = []
                            }
                          } else if (typeof rawStatuses === 'object' && rawStatuses !== null) {
                            statuses = [rawStatuses]
                          }
                        }

                        if (statuses.length === 0) {
                          return <SvgIcon className="sent" iconId="right" />
                        }

                        if (!isGroup) {
                          const hasSeen = statuses.some((s) => s?.status === 'seen' || s?.status === 'read')
                          const hasDelivered = hasSeen || statuses.some((s) => s?.status === 'delivered')

                          if (hasSeen) return <SvgIcon className="seen" iconId="right-2" />
                          if (hasDelivered) return <SvgIcon className="delivered" iconId="right-2" />
                          return <SvgIcon className="sent" iconId="right" />
                        }

                        const allSeen = statuses.every((s) => s?.status === 'seen' || s?.status === 'read')
                        const allDelivered =
                          allSeen || statuses.every((s) => ['delivered', 'seen', 'read'].includes(s?.status))

                        if (allSeen) return <SvgIcon className="seen" iconId="right-2" />
                        if (allDelivered) return <SvgIcon className="delivered" iconId="right-2" />
                        return <SvgIcon className="sent" iconId="right" />
                      })()}{' '}
                    <DecryptedMessagePreview
                      className={`recent-chat-content ${contact.unreadCount > 0 ? 'unread-last-message' : ''}`}
                      message={contact.lastMessage}
                      fallback={contact?.lastMessage?.metadata?.default_content || 'No messages yet'}
                      maxLength={35}
                    />
                  </p>
                </div>
                <div className="date-status">
                  <div className="badge-aligns">
                    {contact.isPinned && (
                      <i className="ti-pin2 pinned-icon" onClick={(e) => handlePined(contact, e)}></i>
                    )}
                    {contact.isMuted && (
                      <span className="badge-aligns-content" title="Muted">
                        <SvgIcon className="stroke-primary muted-icon" iconId="muted-volume" />
                      </span>
                    )}
                    {contact.unreadCount > 0 && (
                      <Badge color={contact.is_unread_mentions ? 'danger' : 'primary'} className="sm">
                        {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                      </Badge>
                    )}
                    <RecentQuickAction
                      contact={contact}
                      isDropdownOpen={
                        activeDropdown?.chat_id === contact.chat_id && activeDropdown?.chat_type === contact.chat_type
                      }
                      onToggleDropdown={(isOpen) => setActiveDropdown(isOpen ? contact : null)}
                      onPinToggle={(e) => handlePined(contact, e)}
                      activeDropdown={activeDropdown}
                    />
                  </div>
                  {contact?.lastMessage?.created_at && (
                    <p> {formatTime(contact?.lastMessage?.created_at, { hour12: use12HourFormat })}</p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <LockChatModal
        isOpen={lockOpen}
        onClose={() => {
          setLockOpen(false)
        }}
        actionType="PinVerified"
      />
    </>
  )
}

export default RecentChats
