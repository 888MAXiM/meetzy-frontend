import { Modal, ModalBody, ModalFooter, ModalHeader, Button } from 'reactstrap'

interface CameraNotFoundModalProps {
  isOpen: boolean
  onClose: () => void
}

const CameraNotFoundModal: React.FC<CameraNotFoundModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>Camera not found</ModalHeader>
      <ModalBody>
        <p>
          You can't take a photo because it looks like your computer doesn't have a camera. Try connecting one or if you have one connected, try restarting your browser.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button className='confirm-modal' onClick={onClose}>
          OK, got it
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default CameraNotFoundModal
