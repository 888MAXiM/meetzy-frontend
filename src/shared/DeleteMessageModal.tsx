import { FC, useEffect, useState } from 'react'
import { Button, Modal, ModalBody, ModalFooter } from 'reactstrap'
import { DeleteMessageModalProps } from '../types/shared'
import { useAppSelector } from '../redux/hooks'

const DeleteMessageModal: FC<DeleteMessageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  canDeleteForEveryone = true,
}) => {
  const defaultOption = canDeleteForEveryone ? 'delete-for-everyone' : 'delete-for-me'
  const [selectedOption, setSelectedOption] = useState<'delete-for-me' | 'delete-for-everyone'>(defaultOption)
  const { currentUser } = useAppSelector((store) => store.chat)

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(defaultOption)
    }
  }, [isOpen, defaultOption])

  const handleConfirm = () => {
    onConfirm(selectedOption)
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} toggle={handleClose} centered className="delete-message-modal">
      <ModalBody>
        <h4 className="mb-1">Delete message?</h4>
        <p className="text-muted mb-4">
          {canDeleteForEveryone
            ? 'You can delete messages for everyone or just for yourself.'
            : 'You can delete this message for yourself. Others will still see it.'}
        </p>

        <div className="delete-options">
          <div
            className={`delete-option cursor-pointer ${selectedOption === 'delete-for-me' ? 'selected' : ''}`}
            onClick={() => setSelectedOption('delete-for-me')}
          >
            <div className="custom-radio">
              <input
                type="radio"
                id="delete-for-me"
                name="deleteOption"
                value="delete-for-me"
                checked={selectedOption === 'delete-for-me'}
                onChange={() => setSelectedOption('delete-for-me')}
              />
              <label htmlFor="delete-for-me" className="mb-0">
                Delete for me
              </label>
            </div>
          </div>

          {canDeleteForEveryone && currentUser && (
            <div
              className={`delete-option cursor-pointer ${selectedOption === 'delete-for-everyone' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('delete-for-everyone')}
            >
              <div className="custom-radio">
                <input
                  type="radio"
                  id="delete-for-everyone"
                  name="deleteOption"
                  value="delete-for-everyone"
                  checked={selectedOption === 'delete-for-everyone'}
                  onChange={() => setSelectedOption('delete-for-everyone')}
                />
                <label htmlFor="delete-for-everyone" className="mb-0">
                  Delete for everyone
                </label>
              </div>
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter className="border-0 pt-0 px-4 pb-4 ms-auto">
        <Button color="secondary" onClick={handleClose} disabled={isLoading} className="px-4">
          Cancel
        </Button>
        <Button color="danger" onClick={handleConfirm} disabled={isLoading} className="px-4">
          {isLoading ? 'Deleting...' : 'Delete'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DeleteMessageModal
