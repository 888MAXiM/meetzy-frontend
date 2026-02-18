import { Fragment, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap'
import { mutations, queries } from '../../../../../api'
import { ChatType } from '../../../../../constants'
import { useAppSelector } from '../../../../../redux/hooks'
import {
  setRecentChatBlockedStatus,
  setRecentChatFavoriteStatus,
  setSelectedUser,
  toggleArchiveChat,
  toggleMuteChat,
} from '../../../../../redux/reducers/messenger/chatSlice'
import { SvgIcon } from '../../../../../shared/icons'
import { RecentChat } from '../../../../../types/components/chat'
import MuteChatModal from '../../../chat/chat-area/chat-header/contact/MuteChatModal'
import { getDropdownOptions } from './DropdownOption'

interface RecentQuickActionProps {
  contact: RecentChat
  isDropdownOpen: boolean
  onToggleDropdown: (isOpen: boolean) => void
  onPinToggle: (e: React.MouseEvent) => void
  activeDropdown: RecentChat | null
}

const RecentQuickAction: React.FC<RecentQuickActionProps> = ({
  contact,
  isDropdownOpen,
  onToggleDropdown,
  onPinToggle,
  activeDropdown,
}) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { allow_archive_chat } = useAppSelector((state) => state.settings)
  const { toggleSmallSide } = useAppSelector((state) => state.messenger)
  const { recentChats } = useAppSelector((state) => state.chat)
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false)
  const [, setIsUnmuting] = useState(false)
  const toggleArchiveUser = mutations.useUnArchiveUser()
  const unmuteChatMutation = mutations.useUnmuteChat()
  const toggleFavoriteMutation = mutations.useToggleFavorite()
  const { refetch: refetchArchiveUser } = queries.useArchiveUser()
  const { refetch: refetchFavoriteUser } = queries.useGetFavorites()
  const toggleBlockMutation = mutations.useToggleBlock()
  const chatId = contact.chat_id
  const chatType = contact.chat_type || 'direct'
  const recentChat = recentChats.find((chat) => chat.chat_id === chatId && chat.chat_type === chatType)
  const isMuted = recentChat?.isMuted || false
  const isPinned = contact.isPinned || false

  useEffect(() => {
    const meetzyMain = document.querySelector('.meetzy-main')
    const appSidebar = document.querySelector('.app-sidebar')

    if (toggleSmallSide) {
      meetzyMain?.classList.add('small-sidebar')
      appSidebar?.classList.add('active')
      document.body.classList.add('sidebar-active', 'main-page')
    } else {
      meetzyMain?.classList.remove('small-sidebar')
      appSidebar?.classList.remove('active')
      document.body.classList.remove('sidebar-active', 'main-page')
    }
  }, [toggleSmallSide])

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await toggleArchiveUser.mutateAsync({
        targetId: contact.chat_id,
        targetType:
          contact.chat_type === ChatType.group
            ? 'group'
            : contact.isBroadcast
            ? 'broadcast'
            : contact?.isAnnouncement
            ? 'announcement'
            : 'user',
      })

      const isArchived = response.action === 'archive'
      toast.success(isArchived ? 'Chat archived successfully' : 'Chat unarchived successfully')
      dispatch(setSelectedUser({ ...contact, isArchived }))
      if (contact.chat_id && contact.chat_type) {
        dispatch(
          toggleArchiveChat({
            chatId: contact.chat_id,
            chatType: contact.chat_type,
            isArchived,
          }),
        )
      }
      await refetchArchiveUser()
      onToggleDropdown(false)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to archive/unarchive chat')
    }
  }

  const handleUnmute = async () => {
    if (!chatId) return

    setIsUnmuting(true)
    try {
      const targetType = contact.chat_type === 'group' ? ChatType.group : ChatType.DM
      await unmuteChatMutation.mutateAsync({
        target_id: chatId,
        target_type: targetType === ChatType.group ? 'group' : activeDropdown?.isAnnouncement ? 'announcement' : 'user',
      })

      dispatch(
        toggleMuteChat({
          chatId,
          chatType: contact.chat_type || 'direct',
          isMuted: false,
        }),
      )
      toast.success('Chat unmuted successfully')
      onToggleDropdown(false)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to unmute chat')
    } finally {
      setIsUnmuting(false)
    }
  }

  const handleMuteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMuted) {
      handleUnmute()
    } else {
      setIsMuteModalOpen(true)
      onToggleDropdown(false)
    }
  }

  const handlePinClick = (e: React.MouseEvent) => {
    onPinToggle(e)
    onToggleDropdown(false)
  }

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleDropdown(!isDropdownOpen)
  }

  const toggle = () => onToggleDropdown(!isDropdownOpen)

  const handleMuteSuccess = () => {
    dispatch(
      toggleMuteChat({
        chatId,
        chatType:
          activeDropdown?.chat_type === ChatType.group
            ? 'group'
            : activeDropdown?.isAnnouncement
            ? 'announcement'
            : 'user',
        isMuted: true,
      }),
    )
    toast.success('Chat muted successfully')
  }

  const handleFavourite = async () => {
    try {
      const response = await toggleFavoriteMutation.mutateAsync({
        targetId: activeDropdown?.chat_id,
        targetType:
          activeDropdown?.chat_type === ChatType.group
            ? 'group'
            : activeDropdown?.isAnnouncement
            ? 'announcement'
            : 'user',
      })

      if (response.isFavorite) {
        toast.success('User Favorite successfully')
      } else {
        toast.success('User Unfavorite successfully')
      }
      const nextFavoriteState = response.isFavorite
      dispatch(setSelectedUser({ ...activeDropdown, isFavorite: nextFavoriteState }))
      if (activeDropdown?.chat_id && activeDropdown?.chat_type) {
        dispatch(
          setRecentChatFavoriteStatus({
            chatId: activeDropdown.chat_id,
            chatType: activeDropdown.chat_type === ChatType.group ? 'group' : 'direct',
            isFavorite: nextFavoriteState,
          }),
        )
      }
      await refetchFavoriteUser()
    } catch (error: any) {
      toast.error(error?.message || 'Failed to Favorite/Unfavorite user')
    }
  }

  const handleBlockUser = async () => {
    try {
      const response = await toggleBlockMutation.mutateAsync({
        targetId: activeDropdown?.chat_id,
        block_type: activeDropdown?.chat_type == 'group' ? 'group' : 'user',
      })

      const nextBlockedState = response.action === 'block'
      if (response.action === 'block') {
        toast.success('User blocked successfully')
      } else {
        toast.success('User unblocked successfully')
      }
      dispatch(setSelectedUser({ ...activeDropdown, isBlocked: nextBlockedState }))
      if (activeDropdown?.chat_id) {
        dispatch(
          setRecentChatBlockedStatus({
            chatId: activeDropdown?.chat_id,
            isBlocked: nextBlockedState,
          }),
        )
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to block/unblock user')
    }
  }

  const dropdownOptions = getDropdownOptions(activeDropdown, isMuted, allow_archive_chat, isPinned, t, {
    handleFavourite,
    handlePinClick,
    handleMuteClick,
    handleArchive,
    handleBlockUser,
  })

  return (
    <Fragment>
      <Dropdown isOpen={isDropdownOpen} toggle={toggle} direction="down">
        <DropdownToggle tag="span" data-toggle="dropdown" aria-expanded={isDropdownOpen} onClick={handleToggleDropdown}>
          <SvgIcon className="more-option" iconId="cheveron-right" />
        </DropdownToggle>
        <DropdownMenu end className="dropdown-menu-custom">
          {dropdownOptions
            .filter((item) => item.isVisible)
            .map((item) => (
              <DropdownItem key={item.id} onClick={item.onClick} className={`dropdown-item-${item.id}`}>
                <SvgIcon
                  className={'fill-secondary dropdown-menu-svg-icon'}
                  iconId={item.iconId}
                />
                {item.label}
              </DropdownItem>
            ))}
        </DropdownMenu>
      </Dropdown>
      <MuteChatModal
        isOpen={isMuteModalOpen}
        onClose={() => {
          setIsMuteModalOpen(false)
        }}
        contact={contact}
        onMuteSuccess={handleMuteSuccess}
      />
    </Fragment>
  )
}

export default RecentQuickAction
