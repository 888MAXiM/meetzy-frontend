import { useState } from 'react'
import { AlertCircle, Crosshair, ExternalLink, Smartphone, Trash2 } from 'react-feather'
import { Fragment } from 'react/jsx-runtime'
import { mutations, queries } from '../../../../api'
import { useAppSelector } from '../../../../redux/hooks'
import ConfirmModal from '../../../../shared/modal/ConfirmationModal'
import { getChatId } from '../../../../utils'
import { setOpenReportModal } from '../../../../redux/reducers/messenger/chatSlice'
import { useDispatch } from 'react-redux'

const ContactInformation = () => {
  const dispatch = useDispatch()
  const { selectedUser, selectedUserProfile } = useAppSelector((state) => state.chat)
  const id = getChatId(selectedUser)
  const { refetch: exportChat } = queries.useGetChatExport(id, selectedUser?.chat_type)
  const { mutate } = mutations.useClearChat()
  const [showClearModal, setShowClearModal] = useState(false)

  // Check if the selected user has hidden their phone number
  const isPhoneHidden = selectedUserProfile?.userSetting?.hide_phone || false

  const handleClear = () => {
    mutate({ id: id, type: selectedUser?.chat_type, broadcastId: selectedUser?.chat_id })
    handleClearCancel()
  }

  const handleExportChat = async () => {
    const res = await exportChat()
    const text = res.data
    if (!text) return
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `chat-export-${id}.txt`
    a.click()

    URL.revokeObjectURL(url)
  }

  const toggleModal = () => {
    dispatch(setOpenReportModal())
  }

  const handleClearClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowClearModal(true)
  }

  const handleClearCancel = () => {
    setShowClearModal(false)
  }

  return (
    <Fragment>
      {!selectedUser?.isAnnouncement && (
        <div className="status other">
          <h5 className="block-title pb-2">Contact info</h5>
          <ul>
            {selectedUserProfile?.phone && (
              <li>
                <h6>
                  <a>
                    {!isPhoneHidden && (
                      <>
                        <Smartphone />
                        {selectedUserProfile?.phone || '-'}
                      </>
                    )}
                  </a>
                </h6>
              </li>
            )}
            {selectedUserProfile?.email && (
              <li>
                <h6>
                  <a>
                    <Crosshair />
                    {selectedUserProfile?.email || '-'}
                  </a>
                </h6>
              </li>
            )}
          </ul>
        </div>
      )}
      <div className="status other">
        <ul>
          <li>
            <h6>
              <a onClick={handleClearClick}>
                <Trash2 />
                Clear Chat
              </a>
            </h6>
          </li>
          <li>
            <h6>
              <a onClick={handleExportChat}>
                <ExternalLink /> Export Chat
              </a>
            </h6>
          </li>
          {!selectedUser?.isAnnouncement && (
            <li>
              <h6>
                <a onClick={toggleModal}>
                  <AlertCircle />
                  Report Contact
                </a>
              </h6>
            </li>
          )}
        </ul>
      </div>
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
    </Fragment>
  )
}

export default ContactInformation
