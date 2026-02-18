import { useState } from 'react'
import { mutations } from '../../../../../../api'
import ConfirmModal from '../../../../../../shared/modal/ConfirmationModal'
import { toaster } from '../../../../../../utils/custom-functions'
import LockChatModal from '../../../../chat/chat-area/chat-header/contact/LockChatModal'
import { useAppSelector } from '../../../../../../redux/hooks'

const AllChat = () => {
  const { mutate, isPending: isArchiving } = mutations.useArchiveAllChats()
  const { mutate: clearAll, isPending: isClearing } = mutations.useClearAllChats()
  const { mutate: deleteAll, isPending: isDeleting } = mutations.useDeleteAllChats()
  const { userSetting } = useAppSelector((state) => state.userSettings)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [lockOpen, setLockOpen] = useState(false)

  const handleArchiveAll = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowArchiveModal(true)
  }

  const handlePin = (e: React.MouseEvent) => {
    e.preventDefault()
    setLockOpen(true)
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowClearModal(true)
  }

  const handleDeleteAll = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowDeleteModal(true)
  }

  const confirmArchiveAll = () => {
    mutate(undefined, {
      onSuccess: () => {
        toaster('success', 'Successful archive all user')
        setShowArchiveModal(false)
      },
    })
  }

  const confirmClearAll = () => {
    clearAll(undefined, {
      onSuccess: () => {
        toaster('success', 'Successful clear all chat')
        setShowClearModal(false)
      },
    })
  }

  const confirmDeleteAll = () => {
    deleteAll(undefined, {
      onSuccess: () => {
        toaster('success', 'Successful delete all chat')
        setShowDeleteModal(false)
      },
    })
  }

  return (
    <>
      {userSetting?.pin_hash && (
        <li>
          <h5>
            <a onClick={handlePin}>Manage chat pin</a>
          </h5>
        </li>
      )}
      <li>
        <h5>
          <a onClick={handleArchiveAll}>Archive all chat</a>
        </h5>
      </li>
      <li>
        <h5>
          <a onClick={handleClearAll}>Clear all chats</a>
        </h5>
      </li>
      <li>
        <h5>
          <a className="font-danger" onClick={handleDeleteAll}>
            Delete all chats
          </a>
        </h5>
      </li>

      <LockChatModal
        isOpen={lockOpen}
        onClose={() => {
          setLockOpen(false)
        }}
        actionType="changePin"
      />

      <ConfirmModal
        isOpen={showArchiveModal}
        onClose={() => setShowArchiveModal(false)}
        onConfirm={confirmArchiveAll}
        isLoading={isArchiving}
        title="Archive All Chats"
        subtitle="Are you sure you want to archive all chats? This action will move all your chats to the archive."
        confirmText="Archive All"
        cancelText="Cancel"
        variant="warning"
      />

      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={confirmClearAll}
        isLoading={isClearing}
        title="Clear All Chats"
        subtitle="Are you sure you want to clear all chats? This action will remove all messages from all your chats. This action cannot be undone."
        confirmText="Clear All"
        cancelText="Cancel"
        variant="warning"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAll}
        isLoading={isDeleting}
        title="Delete All Chats"
        subtitle="Are you sure you want to delete all chats? This action will permanently delete all your chats. This action cannot be undone."
        confirmText="Delete All"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  )
}

export default AllChat
