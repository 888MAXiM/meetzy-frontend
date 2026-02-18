import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Input, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from 'reactstrap'
import { queries } from '../../../../../../api'
import ChatAvatar from '../../../../../../shared/image/ChatAvatar'
import type { Contact, ForwardMessageModalProps } from '../../../../../../types/components/chat'
import DecryptedMessage from '../messages/DecryptedMessage'

const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  message,
  onClose,
  onForward,
  isLoading = false,
}) => {
  const [search, setSearch] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'contacts' | 'groups'>('contacts')

  const { data: contactsData, isLoading: isContactsLoading } = queries.useGetContactList(1, 100, { enabled: isOpen })
  const { data: groupsData, isLoading: isGroupsLoading } = queries.useGetGroups({ page: 1, limit: 100 }, { enabled: isOpen })
  const { data: currentUserData } = queries.useGetUserDetails()
  const currentUserId = currentUserData?.user?.id

  const contacts = contactsData?.contacts ?? []
  const groups = groupsData?.groups ?? []

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedRecipients(new Set())
      setActiveTab('contacts')
    }
  }, [isOpen])

  const filteredContacts = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    return contacts
      .filter((contact: Contact) => contact.id !== currentUserId)
      .filter((contact: Contact) => {
        if (!searchLower) return true
        return contact.name.toLowerCase().includes(searchLower) || contact.email?.toLowerCase().includes(searchLower)
      })
      .map((contact: Contact) => ({
        ...contact,
        uniqueKey: `user-${contact.chat_id || contact.id}`,
      }))
  }, [contacts, currentUserId, search])

  const filteredGroups = useMemo(() => {
    const searchLower = search.trim().toLowerCase()
    return groups
      .filter((group: any) => {
        if (!searchLower) return true
        return group.name?.toLowerCase().includes(searchLower)
      })
      .map((group: any) => ({
        ...group,
        uniqueKey: `group-${group.id}`,
      }))
  }, [groups, search])

  const toggleRecipient = useCallback((uniqueKey: string) => {
    setSelectedRecipients((prev) => {
      const next = new Set(prev)
      if (next.has(uniqueKey)) {
        next.delete(uniqueKey)
      } else {
        next.add(uniqueKey)
      }
      return next
    })
  }, [])

  const handleForward = useCallback(() => {
    const recipients = Array.from(selectedRecipients).map((key) => {
      const [type, id] = key.split('-')
      return {
        type: type as 'user' | 'group',
        id: id,
        originalId:
          type === 'user'
            ? filteredContacts.find((c) => c.uniqueKey === key)?.id || parseInt(id, 10)
            : parseInt(id, 10),
      }
    })

    if (recipients.length > 0) {
      onForward(recipients)
      setSelectedRecipients(new Set())
    }
  }, [selectedRecipients, onForward, filteredContacts])

  const handleClose = useCallback(() => {
    setSearch('')
    setSelectedRecipients(new Set())
    setActiveTab('contacts')
    onClose()
  }, [onClose])

  if (!message) return null

  return (
    <Modal className='forward-msg-modal modal-dialog-centered' isOpen={isOpen} toggle={handleClose} size="md">
      <ModalHeader toggle={handleClose}>Forward Message</ModalHeader>
      <ModalBody>
        <div className="mb-3">
          <div className="border rounded p-2 bg-light">
            <div className="d-flex align-items-center">
              {message.sender && (
                <ChatAvatar data={message.sender} name={message.sender} customClass="avatar-sm me-2" />
              )}
              <div className="flex-grow-1">
                <div className="small text-muted">{message.sender?.name || 'Unknown'}</div>
                <div className="small">
                  {message.message_type === 'text' ? (
                    <DecryptedMessage message={message}>
                      {(decryptedContent) => decryptedContent}
                    </DecryptedMessage>
                  ) : message.message_type === 'image' ? (
                    '📷 Image'
                  ) : message.message_type === 'file' ? (
                    '📄 File'
                  ) : message.message_type === 'sticker' ? (
                    '✨ Sticker'
                  ) : (
                    <DecryptedMessage message={message}>
                      {(decryptedContent) => decryptedContent}
                    </DecryptedMessage>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <div className="btn-group w-100" role="group">
            <Button
              color={activeTab === 'contacts' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('contacts')}
              className="flex-fill"
            >
              Contacts
            </Button>
            <Button
              color={activeTab === 'groups' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('groups')}
              className="flex-fill"
            >
              Groups
            </Button>
          </div>
        </div>

        <div className="mb-3">
          <Input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className='forward-msg-aligns'>
          {activeTab === 'contacts' ? (
            isContactsLoading ? (
              <div className="text-center py-4">
                <Spinner size="sm" className="me-2" />
                Loading contacts...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center text-muted py-4">No contacts found</div>
            ) : (
              <div className="list-group">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedRecipients.has(contact.uniqueKey)
                  return (
                    <div
                      key={contact.uniqueKey}
                      className={`list-group-item list-group-item-action cursor-pointer ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleRecipient(contact.uniqueKey)}
                    >
                      <div className="d-flex align-items-center">
                        <ChatAvatar data={contact} name={contact} customClass="avatar-sm" />
                        <div className="flex-grow-1">
                          <div className="fw-medium">{contact.name}</div>
                          {contact.email && <div className="small text-muted">{contact.email}</div>}
                        </div>
                        {isSelected && <span className="text-primary">✓</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : isGroupsLoading ? (
            <div className="text-center py-4">
              <Spinner size="sm" className="me-2" />
              Loading groups...
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="text-center text-muted py-4">No groups found</div>
          ) : (
            <div className="list-group">
              {filteredGroups.map((group) => {
                const isSelected = selectedRecipients.has(group.uniqueKey)
                return (
                  <div
                    key={group.uniqueKey}
                    className={`list-group-item list-group-item-action cursor-pointer ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleRecipient(group.uniqueKey)}
                  >
                    <div className="d-flex align-items-center">
                      <ChatAvatar data={group} name={group} customClass="avatar-sm" />
                      <div className="flex-grow-1">
                        <div className="fw-medium">{group.name}</div>
                        {group.member_count && <div className="small text-muted">{group.member_count} members</div>}
                      </div>
                      {isSelected && <span className="text-primary">✓</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {selectedRecipients.size > 0 && (
          <div className="mt-3 small text-muted">
            {selectedRecipients.size} recipient{selectedRecipients.size !== 1 ? 's' : ''} selected
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={handleForward}
          disabled={selectedRecipients.size === 0 || isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Forwarding...
            </>
          ) : (
            `Forward to ${selectedRecipients.size} recipient${selectedRecipients.size !== 1 ? 's' : ''}`
          )}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default ForwardMessageModal
