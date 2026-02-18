import { useCallback, useMemo, useState } from 'react'
import { Form, FormGroup, Input, Label, Spinner } from 'reactstrap'
import { toast } from 'react-toastify'
import { queries, mutations } from '../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { setNewModal } from '../../../../../redux/reducers/messenger/messengerSlice'
import type { Contact } from '../../../../../types/components/chat'
import SimpleModal from '../../../../../shared/modal/SimpleModal'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { useTranslation } from 'react-i18next'
import { useUserFeatures } from '../../../../../hooks/useUserFeatures'

const Broadcast = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { newModal } = useAppSelector((state) => state.messenger)
  const isOpen = newModal[3] ?? false

  const { data: contactsData, isLoading: isContactsLoading } = queries.useGetContactList(1, 100)
  const { data: currentUserData } = queries.useGetUserDetails()
  const createBroadcastMutation = mutations.useCreateBroadcast()
  const { max_broadcasts_list, max_members_per_broadcasts_list } = useUserFeatures()
  const { data: broadcastsData } = queries.useGetMyBroadcasts(1, 1000)

  const [broadcastName, setBroadcastName] = useState('')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number| string>>(new Set())

  const contacts = contactsData?.contacts ?? []
  const currentUserId = currentUserData?.user?.id

  const filteredContacts = useMemo(() => {
    const search = recipientSearch.trim().toLowerCase()
    return contacts
      .filter((contact: Contact) => contact.id !== currentUserId)
      .filter((contact: Contact) => {
        if (!search) return true
        return contact.name.toLowerCase().includes(search) || (contact.email || '').toLowerCase().includes(search)
      })
  }, [contacts, currentUserId, recipientSearch])

  const selectedRecipientIds = useMemo(() => Array.from(selectedRecipients), [selectedRecipients])

  const resetForm = useCallback(() => {
    setBroadcastName('')
    setRecipientSearch('')
    setSelectedRecipients(new Set())
  }, [])

  const handleToggle = useCallback(() => {
    resetForm()
    dispatch(setNewModal(3))
  }, [dispatch, resetForm])

  const toggleRecipient = useCallback(
    (recipientId: number | string) => {
      setSelectedRecipients((prev) => {
        const next = new Set(prev)
        if (next.has(recipientId)) {
          next.delete(recipientId)
        } else {
          if (next.size + 1 > max_members_per_broadcasts_list) {
            toast.error(
              t('broadcast_member_limit_exceeded') ||
                `Cannot add more recipients: Maximum ${max_members_per_broadcasts_list} recipients allowed per broadcast list.`
            )
            return prev
          }
          next.add(recipientId)
        }
        return next
      })
    },
    [max_members_per_broadcasts_list, t],
  )

  const handleCreateBroadcast = useCallback(async () => {
    if (!broadcastName.trim()) {
      toast.error(t('broadcast_name_required') || 'Broadcast name is required')
      return
    }

    if (selectedRecipientIds.length === 0) {
      toast.error(t('at_least_one_recipient_required') || 'At least one recipient is required')
      return
    }

    // Check broadcast list count limit
    const currentBroadcastCount = broadcastsData?.data?.length || 0
    if (currentBroadcastCount >= max_broadcasts_list) {
      toast.error(
        t('broadcast_limit_reached') ||
          `You can only create ${max_broadcasts_list} broadcast lists. Upgrade your plan for more.`
      )
      return
    }

    // Check recipient limit
    if (selectedRecipientIds.length > max_members_per_broadcasts_list) {
      toast.error(
        t('broadcast_member_limit_exceeded') ||
          `Cannot create broadcast: Maximum ${max_members_per_broadcasts_list} recipients allowed per broadcast list.`
      )
      return
    }

    try {
      const response = await createBroadcastMutation.mutateAsync({
        name: broadcastName.trim(),
        recipient_ids: selectedRecipientIds,
      })
      toast.success(response?.message || t('broadcast_created_successfully') || 'Broadcast created successfully')
      handleToggle()
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('failed_to_create_broadcast') ||
        'Failed to create broadcast'
      toast.error(errorMessage)
    }
  }, [broadcastName, createBroadcastMutation, handleToggle, selectedRecipientIds, t, max_broadcasts_list, max_members_per_broadcasts_list, broadcastsData])

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void handleCreateBroadcast()
    },
    [handleCreateBroadcast],
  )

  const isCreateDisabled =
    !broadcastName.trim() || selectedRecipientIds.length === 0 || createBroadcastMutation.isPending

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleToggle}
      title={t('create_new_broadcast') || 'Create New Broadcast'}
      className="fade show add-popup add-broadcast-modal"
      centered
      closeOnBackdrop={false}
      actions={[
        {
          text: t('cancel') || 'Cancel',
          color: 'danger',
          className: 'button-effect btn-sm',
          onClick: handleToggle,
          autoClose: false,
        },
        {
          text: t('create_broadcast') || 'Create Broadcast',
          color: 'primary',
          className: 'button-effect btn-sm',
          onClick: handleCreateBroadcast,
          autoClose: false,
          disabled: isCreateDisabled,
          loading: createBroadcastMutation.isPending,
        },
      ]}
    >
      <Form onSubmit={handleSubmit} className="default-new-form">
        <FormGroup>
          <Label for="broadcast-name">{t('broadcast_name') || 'Broadcast Name'} *</Label>
          <Input
            id="broadcast-name"
            type="text"
            value={broadcastName}
            onChange={(e) => setBroadcastName(e.target.value)}
            placeholder={t('enter_broadcast_name') || 'Enter broadcast name'}
            maxLength={100}
          />
        </FormGroup>

        <div className="mt-4">
          <Label className="d-flex justify-content-between align-items-center">
            <span>{t('select_recipients') || 'Select Recipients'}</span>
            <span className="small text-muted">
              {t('selected_count', { count: selectedRecipientIds.length }) || `${selectedRecipientIds.length} selected`} / {max_members_per_broadcasts_list}
              {selectedRecipientIds.length >= max_members_per_broadcasts_list && (
                <span className="text-danger ms-1">(Limit reached)</span>
              )}
            </span>
          </Label>

          <Input
            id="broadcast-recipient-search"
            type="text"
            value={recipientSearch}
            onChange={(e) => setRecipientSearch(e.target.value)}
            placeholder={t('search_by_name_or_email') || 'Search by name or email'}
            className="mb-3"
          />

          <div className="member-list custom-scroll">
            {isContactsLoading ? (
              <div className="text-center py-4">
                <Spinner size="sm" className="me-2" />
                {t('loading_contacts') || 'Loading contacts...'}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center text-muted py-4">{t('no_contacts_found') || 'No contacts found'}</div>
            ) : (
              <ul className="call-log-main new-group-box custom-scroll">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedRecipients.has(contact.chat_id)
                  return (
                    <li key={contact.chat_id}>
                      <div className="call-box" onClick={() => toggleRecipient(contact.chat_id)}>
                        <div className="profile">
                          <ChatAvatar data={contact} name={contact} customClass="avatar-sm" />
                        </div>
                        <div className="details">
                          <h6>{contact.name}</h6>
                          <p>{contact.email}</p>
                        </div>
                        <Input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRecipient(contact.chat_id)}
                          aria-label={t('toggle_recipient', { name: contact.name }) || `Toggle ${contact.name}`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </Form>
    </SimpleModal>
  )
}

export default Broadcast

