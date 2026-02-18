import { useCallback, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Button, Spinner } from 'reactstrap'
import { mutations, queries } from '../../../../../../api'
import { useAppDispatch } from '../../../../../../redux/hooks'
import { selectChat, setSelectedUser } from '../../../../../../redux/reducers/messenger/chatSlice'
import ChatAvatar from '../../../../../../shared/image/ChatAvatar'
import SimpleModal from '../../../../../../shared/modal/SimpleModal'
import type { Contact } from '../../../../../../types/components/chat'
import AddMemberModal from '../group/AddMemberModal'
import { useUserFeatures } from '../../../../../../hooks/useUserFeatures'

interface BroadcastInfoModalProps {
  isOpen: boolean
  broadcastId: string | number | null
  onClose: () => void
}

const BroadcastInfoModal: React.FC<BroadcastInfoModalProps> = ({ isOpen, broadcastId, onClose }) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { data: broadcastsData, refetch: refetchBroadcasts } = queries.useGetMyBroadcasts(1, 200, {
    enabled: isOpen,
  })
  const { data: contactsData } = queries.useGetContactList(1, 200, {
    enabled: isOpen,
  })

  const addRecipientsMutation = mutations.useAddBroadcastRecipients()
  const removeRecipientsMutation = mutations.useRemoveBroadcastRecipients()
  const deleteBroadcastMutation = mutations.useDeleteBroadcast()
  const [addMemberSearch, setAddMemberSearch] = useState('')
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const { max_members_per_broadcasts_list } = useUserFeatures()

  const broadcast = useMemo(
    () => broadcastsData?.data.find((b) => b.id === broadcastId),
    [broadcastId, broadcastsData?.data],
  )

  const recipients = broadcast?.recipients || []
  const contacts = contactsData?.contacts || []

  const filteredContacts = useMemo(() => {
    const term = addMemberSearch.trim().toLowerCase()
    const existingIds = new Set(recipients.map((r) => r.id))
    return contacts
      .filter((c: Contact) => !existingIds.has(c.chat_id))
      .filter((c: Contact) => {
        if (!term) return true
        return c.name.toLowerCase().includes(term) || (c.email || '').toLowerCase().includes(term)
      })
  }, [addMemberSearch, contacts, recipients])

  const handleAddRecipients = useCallback(
    async (ids: (string | number)[]) => {
      if (!broadcastId) return
      if (ids.length === 0) {
        toast.error('Select at least one contact')
        return
      }

      // Check if adding these recipients would exceed the limit
      const newTotalRecipients = recipients.length + ids.length
      if (newTotalRecipients > max_members_per_broadcasts_list) {
        toast.error(
          t('broadcast_member_limit_exceeded') ||
            `Cannot add recipients: Maximum ${max_members_per_broadcasts_list} recipients allowed per broadcast list.`,
        )
        return
      }

      try {
        await addRecipientsMutation.mutateAsync({ broadcast_id: broadcastId, recipient_ids: ids })
        toast.success('Recipients added')
        setShowAddMemberModal(false)
        setAddMemberSearch('')
        await refetchBroadcasts()
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add recipients'
        toast.error(errorMessage)
      }
    },
    [addRecipientsMutation, broadcastId, refetchBroadcasts, recipients.length, max_members_per_broadcasts_list, t],
  )

  const handleRemoveRecipient = useCallback(
    async (id: number | string) => {
      if (!broadcastId) return
      try {
        await removeRecipientsMutation.mutateAsync({ broadcast_id: broadcastId, recipient_ids: [id] })
        toast.success('Recipient removed')
        await refetchBroadcasts()
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Failed to remove recipient')
      }
    },
    [broadcastId, refetchBroadcasts, removeRecipientsMutation],
  )

  const handleDeleteBroadcast = useCallback(async () => {
    if (!broadcastId) return
    try {
      await deleteBroadcastMutation.mutateAsync({ broadcast_id: broadcastId })
      toast.success('Broadcast deleted')
      onClose()
      dispatch(setSelectedUser(null))
      dispatch(selectChat(null))
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Failed to delete broadcast')
    }
  }, [broadcastId, deleteBroadcastMutation, dispatch, onClose])

  if (!isOpen || !broadcastId) return null

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={broadcast?.name || 'Broadcast'}
      className="broadcast-info-modal"
      size="lg"
    >
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">Recipients ({recipients.length})</h6>
        <Button
          size="sm"
          color="primary"
          className="button-effect px-3 py-2"
          onClick={() => {
            if (recipients.length >= max_members_per_broadcasts_list) {
              toast.error(
                t('broadcast_member_limit_reached') ||
                  `Broadcast recipient limit reached. Maximum ${max_members_per_broadcasts_list} recipients allowed.`,
              )
              return
            }
            setShowAddMemberModal(true)
          }}
          disabled={recipients.length >= max_members_per_broadcasts_list}
          title={
            recipients.length >= max_members_per_broadcasts_list
              ? `Maximum ${max_members_per_broadcasts_list} recipients allowed`
              : undefined
          }
        >
          <Plus size={16} className="me-1" /> Add recipients
        </Button>
      </div>

      <div className="member-list custom-scroll mb-3">
        {recipients.length === 0 ? (
          <div className="text-muted py-3">No recipients yet</div>
        ) : (
          <ul className="call-log-main new-group-box custom-scroll">
            {recipients.map((recipient) => (
              <li key={recipient.id}>
                <div className="call-box">
                  <div className="profile">
                    <ChatAvatar data={recipient} name={recipient} customClass="avatar-sm" />
                  </div>
                  <div className="details">
                    <h6>{recipient.name}</h6>
                  </div>
                  <button
                    className="icon-btn delete-member-broadcast bg-light-danger button-effect btn-sm"
                    onClick={() => handleRemoveRecipient(recipient.id)}
                    disabled={removeRecipientsMutation.isPending}
                  >
                    <Trash2 />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="leavegrp mt-3 p-3 bg-opacity-10 border border-danger rounded">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div className="fw-bold">{t('delete_broadcast')}</div>
            <div className="small text-muted">{t('delete_broadcast_desc')}</div>
          </div>
          <Button
            color="danger"
            outline
            className="px-3"
            onClick={handleDeleteBroadcast}
            disabled={deleteBroadcastMutation.isPending}
          >
            {deleteBroadcastMutation.isPending ? <Spinner size="sm" /> : t('delete_broadcast')}
          </Button>
        </div>
      </div>

      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        filteredContacts={filteredContacts}
        addMemberSearch={addMemberSearch}
        onSetAddMemberSearch={setAddMemberSearch}
        onAddMembers={handleAddRecipients}
      />
    </SimpleModal>
  )
}

export default BroadcastInfoModal
