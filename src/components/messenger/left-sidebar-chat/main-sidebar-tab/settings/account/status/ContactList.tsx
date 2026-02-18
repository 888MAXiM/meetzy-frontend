import { Card, CardBody, Button, FormGroup, Input, Label } from 'reactstrap'

interface Contact {
  id: string
  name: string
}

interface ContactListProps {
  allMembers: Contact[]
  tempSelectedUsers: string[]
  onUserSelection: (userId: string) => void
  onSelectAll: () => void
  onConfirmSelection: () => void
}

const ContactList = ({
  allMembers,
  tempSelectedUsers,
  onUserSelection,
  onSelectAll,
  onConfirmSelection,
}: ContactListProps) => {
  return (
    <Card className="mt-3">
      <CardBody className="p-3">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-1">Select contacts to share with</h6>
            <small className="text-muted">
              {tempSelectedUsers?.length} of {allMembers.length} selected
            </small>
          </div>
        </div>

        <FormGroup check className="p-2 border-bottom border-user-form">
          <Label check className="fw-bold">
            Select all
          </Label>
          <Input type="checkbox" checked={(tempSelectedUsers?.length ?? 0) === allMembers.length} onChange={onSelectAll} />
        </FormGroup>

        <div className="mx-2 contact-list-content custom-scroll">
          {allMembers.map((contact: any) => {
            const contactId = String(contact.id || contact.chat_id || contact.user_id)
            return (
              <FormGroup check key={contactId} className="mb-2 form-check-user">
                <div className="d-flex align-items-center justify-content-between w-100">
                  <div
                    className="d-flex align-items-center flex-grow-1"
                    style={{ cursor: 'pointer' }}
                    onClick={() => onUserSelection(contactId)}
                  >
                    <div
                      className="d-flex align-items-center justify-content-center me-2"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(var(--primary-color),1)',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {contact.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="status-aligns-user">
                      <div className="fw-medium">{contact.name}</div>
                      <small className="text-muted">Last seen recently</small>
                    </div>
                  </div>
                  <Input
                    type="checkbox"
                    checked={tempSelectedUsers?.includes(contactId) ?? false}
                    onChange={() => onUserSelection(contactId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </FormGroup>
            )
          })}
        </div>
        <Button
          color="primary"
          className="btn-user-status"
          size="sm"
          onClick={onConfirmSelection}
          disabled={tempSelectedUsers?.length === 0}
        >
          <i className="fa fa-check" />
        </Button>
      </CardBody>
    </Card>
  )
}

export default ContactList
