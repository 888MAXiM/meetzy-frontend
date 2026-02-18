import { useTranslation } from "react-i18next"
import { AddMemberModalProps } from "../../../../../../types/components/chat"
import { Input, Modal, ModalBody, ModalHeader } from "reactstrap"
import ChatAvatar from "../../../../../../shared/image/ChatAvatar"

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  isOpen,
  onClose,
  filteredContacts,
  addMemberSearch,
  onSetAddMemberSearch,
  onAddMembers,
}) => {
  const { t } = useTranslation()

  return (
    <Modal isOpen={isOpen} toggle={onClose} size="md" centered>
      <ModalHeader toggle={onClose}>{t('add_members')}</ModalHeader>
      <ModalBody>
        <Input
          type="text"
          placeholder={t('search_contacts')}
          value={addMemberSearch}
          onChange={(e) => onSetAddMemberSearch(e.target.value)}
          className="mb-3 search-contacts"
        />
        <div className="add-member-aligns">
          {filteredContacts.length === 0 ? (
            <div className="text-center text-muted py-4">{t('no_contacts_found')}</div>
          ) : (
            <div className="list-group">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.chat_id}
                  className="list-group-item list-group-item-action cursor-pointer"
                  onClick={() => onAddMembers([contact.chat_id])}
                >
                  <div className="d-flex align-items-center">
                    <ChatAvatar data={contact} name={contact} customClass="avatar-sm" />
                    <div className="flex-grow-1">
                      <div className="fw-medium">{contact.name}</div>
                      {contact.email && <div className="small text-muted">{contact.email}</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  )
}

export default AddMemberModal;
