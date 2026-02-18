import { useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { queries } from '../../../../../api'
import { ChatType } from '../../../../../constants'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { selSelectedUserProfile } from '../../../../../redux/reducers/messenger/chatSlice'
import {
  setMobileMenu,
  setProfileSidebarWidth,
  setProfileToggle,
} from '../../../../../redux/reducers/messenger/messengerSlice'
import { SvgIcon } from '../../../../../shared/icons'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { getChatId } from '../../../../../utils'
import { useProfileSidebarEffect } from '../../../../../utils/useSidebarEffects'
import BroadcastInfoModal from './broadcast/BroadcastInfoModal'
import Contact from './contact'
import GroupInfoModal from './group/InfoModal'
import Search from './Search'

const ChatHeader = () => {
  const [search, setSearch] = useState(false)
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false)
  const dispatch = useAppDispatch()
  const { selectedUser, selectedUserProfile } = useAppSelector((state) => state.chat)
  const { app_name } = useAppSelector((state) => state.settings)
  const { profileToggle, profileSidebarWidth } = useAppSelector((state) => state.messenger)
  const { userStatuses } = useAppSelector((state) => state.userStatus)
  const isGroupChat = selectedUser?.chat_type === 'group'
  const isBroadcastChat = selectedUser?.chat_type === 'broadcast' || selectedUser?.isBroadcast
  const [broadcastMember, setBroadcastMember] = useState<string[]>([])
  const chatId = getChatId(selectedUser)

  const { data: membersData } = queries.useGetGroupMembers(
    isGroupChat ? chatId : undefined,
    { page: 1, limit: 1 },
    { enabled: isGroupChat && !!chatId },
  )

  const { data: userProfile } = queries.useGetUserProfile(isGroupChat ? undefined : chatId, {
    enabled:
      !!chatId && !selectedUser?.isBroadcast && !selectedUser?.isGroup && selectedUser?.chat_type !== ChatType.group,
  })

  useEffect(() => {
    const list = selectedUser?.recipients?.map((item) => item.name)
    setBroadcastMember(list?.slice(0, 3) || [])
  }, [selectedUser])

  useEffect(() => {
    dispatch(selSelectedUserProfile(userProfile))
  }, [userProfile])

  const userStatus = chatId && !isGroupChat ? userStatuses[chatId] : null
  const isOnline = userStatus?.status === 'online'
  const lastSeen = userStatus?.lastSeen ?? null
  const memberCount = membersData?.total_members || selectedUser?.memberCount || 0

  useEffect(() => {
    const updateSize = () => dispatch(setProfileSidebarWidth(window.innerWidth))
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [dispatch])

  useProfileSidebarEffect(profileToggle, profileSidebarWidth)

  const handleProfileToggle = () => {
    dispatch(setProfileToggle(!profileToggle))
  }

  const handleMobileMenu = () => {
    dispatch(setMobileMenu(false))
  }

  const formatLastSeen = (lastSeenDate: string | null): string => {
    if (!lastSeenDate) return 'Offline'

    const date = new Date(lastSeenDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Last seen just now'
    if (diffMins < 60) return `Last seen ${diffMins}m ago`
    if (diffHours < 24) return `Last seen ${diffHours}h ago`
    if (diffDays < 7) return `Last seen ${diffDays}d ago`

    return `Last seen ${date.toLocaleDateString()}`
  }

  const userSettingForLastSeen = userProfile?.userSetting || selectedUser?.userSetting
  const shouldShowLastSeen = userSettingForLastSeen?.last_seen !== false
  const displayLastSeen = shouldShowLastSeen ? lastSeen : null

  const memberSubtitle = isGroupChat
    ? `${memberCount} member${memberCount === 1 ? '' : 's'}`
    : isOnline
    ? 'Online'
    : shouldShowLastSeen
    ? formatLastSeen(displayLastSeen)
    : 'Offline'

  const broadcastSubtitle = () => {
    if (!broadcastMember || broadcastMember.length === 0) return 'No recipients'

    const names = broadcastMember.join(', ')
    const hasMore = selectedUser?.recipients && selectedUser.recipients.length > 3

    return hasMore ? `${names}...` : names
  }

  const handleGroupHeaderClick = () => {
    if (isGroupChat) {
      setGroupModalOpen(true)
    } else if (isBroadcastChat) {
      setBroadcastModalOpen(true)
    } else {
      handleProfileToggle()
    }
  }

  if (!selectedUser) {
    return null
  }

  return (
    <div className="contact-details d-flex justify-content-between">
      <Search search={search} setSearch={setSearch} />
      <div>
        <div className="d-flex left gap-2">
          <div className="media-right">
            <ul>
              <li>
                <button
                  className="icon-btn bg-light-primary button-effect mobile-sidebar"
                  onClick={handleMobileMenu}
                  type="button"
                >
                  <ChevronLeft />
                </button>
              </li>
            </ul>
          </div>
          <div className="media-left cursor-pointer" onClick={handleGroupHeaderClick}>
            {!selectedUser.isBroadcast ? (
              <div
                className={`profile ${
                  !selectedUser.isAnnouncement && (isGroupChat ? 'group' : isOnline ? 'online' : 'offline')
                } menu-trigger`}
              >
                <ChatAvatar
                  data={{
                    avatar: isGroupChat ? selectedUser?.avatar : userProfile?.avatar || selectedUser?.avatar,
                  }}
                  name={{ name: selectedUser.isAnnouncement ? app_name : selectedUser.name }}
                  customClass="user-info avatar-sm"
                />
              </div>
            ) : (
              <div className={`profile chatavtar-div d-flex justify-content-center align-items-center main-broadcast`}>
                <SvgIcon iconId="broadcast" />
              </div>
            )}
          </div>
          <div className="flex-grow-1 cursor-pointer" onClick={handleGroupHeaderClick}>
            <div className="d-flex">
              <h5>{selectedUser.isAnnouncement ? app_name : selectedUser?.name || 'Friend'}</h5>
              {(selectedUser.isAnnouncement ||
                (!isGroupChat && (selectedUser?.is_verified || userProfile?.is_verified))) && (
                <SvgIcon iconId="blue-tick" className="ms-1" />
              )}
            </div>
            <p>
              {selectedUser.isBroadcast
                ? broadcastSubtitle()
                : selectedUser.isAnnouncement
                ? selectedUserProfile?.bio || 'Announce'
                : memberSubtitle}
            </p>
          </div>
        </div>
      </div>
      <Contact search={search} setSearch={setSearch} />
      {isGroupChat && (
        <GroupInfoModal
          isOpen={groupModalOpen}
          groupId={selectedUser?.id || selectedUser.chat_id}
          onClose={() => setGroupModalOpen(false)}
        />
      )}
      {isBroadcastChat && (
        <BroadcastInfoModal
          isOpen={broadcastModalOpen}
          broadcastId={selectedUser?.chat_id || selectedUser?.id}
          onClose={() => setBroadcastModalOpen(false)}
        />
      )}
    </div>
  )
}

export default ChatHeader
