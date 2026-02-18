import React from 'react'
import { ListGroup, ListGroupItem, Modal, ModalBody, ModalHeader } from 'reactstrap'
import { ImageBaseUrl } from '../../../../../constants'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { ViewersModalProps } from '../../../../../types/components/chat'

const ViewersModal: React.FC<ViewersModalProps> = ({ isOpen, onClose, viewers }) => {
  return (
    <Modal className="viewers-modal" isOpen={isOpen} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>Viewers ({viewers?.length || 0})</ModalHeader>
      <ModalBody>
        {!viewers || viewers.length === 0 ? (
          <p className="text-muted text-center">No views yet</p>
        ) : (
          <ListGroup flush>
            {viewers.map((viewer) => (
              <ListGroupItem key={viewer.id} className="d-flex align-items-center">
                <div className="me-3">
                  <ChatAvatar
                    data={{
                      avatar: viewer.avatar ? ImageBaseUrl + viewer.avatar : null,
                      name: viewer.name,
                    }}
                    customClass="avatar-md"
                  />
                </div>
                <div className="flex-grow-1">
                  <h6 className="mb-0">{viewer.name}</h6>
                  <small className="text-muted">{viewer.viewed_ago}</small>
                </div>
              </ListGroupItem>
            ))}
          </ListGroup>
        )}
      </ModalBody>
    </Modal>
  )
}

export default ViewersModal
