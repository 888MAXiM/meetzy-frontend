import { Fragment, useEffect, useState } from 'react'
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import { mutations } from '../../../../../../api'
import { getChatFriendContent } from '../../../../../../data/messenger'
import { useAppDispatch, useAppSelector } from '../../../../../../redux/hooks'
import { SvgIcon } from '../../../../../../shared/icons'
import ConfirmModal from '../../../../../../shared/modal/ConfirmationModal'
import { getChatId } from '../../../../../../utils'
import { useMessageSelection } from '../../chat/message-action/useMessageSelection'
import MuteChatModal from './MuteChatModal'
import { setProfileToggle } from '../../../../../../redux/reducers/messenger/messengerSlice'
import {
  selectChat,
  setOpenReportModal,
  setSelectedUser,
  removeRecentChat,
} from '../../../../../../redux/reducers/messenger/chatSlice'
import ReportUserModal from '../../../../left-sidebar-chat/profile-section/ReportUserModal'
import { toaster } from '../../../../../../utils/custom-functions'
import DisappearingModal from './DisappearingModal'
import LockChatModal from './LockChatModal'
import { useTranslation } from 'react-i18next'

const QuickAction = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { toggleSmallSide, profileToggle } = useAppSelector((state) => state.messenger)
  const { selectedUser, openReportModal } = useAppSelector((state) => state.chat)
  const [showClearModal, setShowClearModal] = useState(false)
  const [isMuteModalOpen, setIsMuteModalOpen] = useState(false)
  const [disappearingOpen, setDisappearingOpen] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)
  const { mutate } = mutations.useClearChat()
  const id = getChatId(selectedUser)
  const { isSelectionMode, clearSelection, enterEmptySelectionMode } = useMessageSelection()
  const isGroupChat = selectedUser?.chat_type === 'group'
  const { mutate: deleteChat, isPending: isDeleting } = mutations.useDeleteChat()
  const { mutate: deleteBroadcast, isPending: isDeletingBroadcast } = mutations.useDeleteBroadcast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeleteBroadcast, setShowDeleteBroadcast] = useState(false)

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

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

  const handleClear = () => {
    mutate({ id: id, type: selectedUser?.chat_type, broadcastId: selectedUser?.chat_id })
    handleClearCancel()
  }

  const handleClearClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowClearModal(true)
  }

  const handleClearCancel = () => {
    setShowClearModal(false)
  }

  const handleToggleSelectionMode = () => {
    if (isSelectionMode) {
      clearSelection()
    } else {
      enterEmptySelectionMode()
    }
  }

  const handleContactClick = () => {
    if (!isGroupChat) {
      dispatch(setProfileToggle(!profileToggle))
    }
  }

  const handleCloseClick = () => {
    dispatch(setSelectedUser(null))
    dispatch(selectChat(null))
  }

  const handleReportClick = () => {
    setDropdownOpen(false)
    dispatch(setOpenReportModal())
  }

  const confirmDelete = () => {
    const targetId = selectedUser?.chat_id
    const apiTargetType = selectedUser?.chat_type === 'group' ? 'group' : 'user'
    const reduxChatType = selectedUser?.chat_type === 'group' ? 'group' : 'direct'

    deleteChat(
      { targetId, targetType: apiTargetType },
      {
        onSuccess: () => {
          toaster('success', 'Successful delete this chat')
          setShowDeleteModal(false)
          dispatch(setSelectedUser(null))
          dispatch(selectChat(null))
          if (targetId) {
            dispatch(removeRecentChat({ chatId: targetId, chatType: reduxChatType }))
          }
        },
      },
    )
  }

  const confirmDeleteBroadcast = () => {
    const targetId = selectedUser?.chat_id

    deleteBroadcast(
      { broadcast_id: targetId },
      {
        onSuccess: () => {
          toaster('success', 'Successful delete this broadcast')
          setShowDeleteBroadcast(false)
          dispatch(setSelectedUser(null))
          dispatch(selectChat(null))
        },
      },
    )
  }

  const handleDeleteClick = () => {
    setShowDeleteModal(true)
  }

  const handleDeleteBroadcastClick = () => {
    setShowDeleteBroadcast(true)
  }

  const handleDisappearingClick = () => {
    setDisappearingOpen(true)
  }

  const handleLockClick = () => {
    setLockOpen(true)
  }

  const chatFriendContent = getChatFriendContent(selectedUser, {
    handleClearClick,
    handleContactClick,
    handleToggleSelectionMode,
    handleCloseClick,
    handleReportClick,
    handleDeleteClick,
    handleDeleteBroadcastClick,
    handleDisappearingClick,
    handleLockClick,
  })

  return (
    <Fragment>
      <li className="icon-btn chat-friend-toggle">
        <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
          <DropdownToggle className="icon-btn rounded15 button-effect" tag="button" color="">
            <SvgIcon iconId="header-toggle" />
          </DropdownToggle>
          <DropdownMenu end className="dropdown-menu-custom">
            {chatFriendContent
              .filter((item) => item.allow)
              .map((item, index) => (
                <Fragment key={index}>
                  <DropdownItem onClick={item.onClick} className="d-flex align-items-center">
                    <SvgIcon className={item.class} iconId={item.icon} />
                    <h5 className="ms-2 mb-0">{t(item.title)}</h5>
                  </DropdownItem>
                  {item.title == 'Close Chat' && <DropdownItem divider className="mx-2 border-bottom-0" />}
                </Fragment>
              ))}
          </DropdownMenu>
        </Dropdown>
      </li>
      <ConfirmModal
        isOpen={showClearModal}
        onClose={handleClearCancel}
        onConfirm={handleClear}
        title="Clear Chat Confirmation"
        subtitle="Are you sure you want to clear your chat?"
        confirmText="Clear Chat"
        cancelText="Cancel"
        variant="info"
        iconId="confirmation"
      />
      <MuteChatModal isOpen={isMuteModalOpen} onClose={() => setIsMuteModalOpen(false)} />
      <DisappearingModal isOpen={disappearingOpen} onClose={() => setDisappearingOpen(false)} />
      <LockChatModal isOpen={lockOpen} onClose={() => setLockOpen(false)} />
      <ReportUserModal open={openReportModal || false} toggleModal={handleReportClick} />
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        title="Delete Chat"
        subtitle="Are you sure you want to delete this chats?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showDeleteBroadcast}
        onClose={() => setShowDeleteBroadcast(false)}
        onConfirm={confirmDeleteBroadcast}
        isLoading={isDeletingBroadcast}
        title="Delete Broadcast"
        subtitle="Are you sure you want to delete this broadcast?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </Fragment>
  )
}

export default QuickAction
