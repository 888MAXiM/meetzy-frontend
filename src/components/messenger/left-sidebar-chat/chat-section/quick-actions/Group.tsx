import { useCallback, useMemo, useState } from 'react'
import { Form, FormGroup, Input, Label, Spinner } from 'reactstrap'
import { toast } from 'react-toastify'
import { queries, mutations } from '../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { setNewModal } from '../../../../../redux/reducers/messenger/messengerSlice'
import { Image } from '../../../../../shared/image'
import type { Contact } from '../../../../../types/components/chat'
import SimpleModal from '../../../../../shared/modal/SimpleModal'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import { useTranslation } from 'react-i18next'
import { useUserFeatures } from '../../../../../hooks/useUserFeatures'

const Groups = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { newModal } = useAppSelector((state) => state.messenger)
  const isOpen = newModal[2] ?? false

  const { data: contactsData, isLoading: isContactsLoading } = queries.useGetContactList(1, 100)
  const { data: currentUserData } = queries.useGetUserDetails()
  const createGroupMutation = mutations.useCreateGroup()
  const { max_group_members, max_groups_per_user } = useUserFeatures()
  const { data: userGroupsData } = queries.useGetUserGroups()

  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<Set<number | string>>(new Set())
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const contacts = contactsData?.contacts ?? []
  const currentUserId = currentUserData?.user?.id

  const filteredContacts = useMemo(() => {
    const search = memberSearch.trim().toLowerCase()
    return contacts
      .filter((contact: Contact) => contact.id !== currentUserId)
      .filter((contact: Contact) => {
        if (!search) return true
        return contact.name.toLowerCase().includes(search) || (contact.email || '').toLowerCase().includes(search)
      })
  }, [contacts, currentUserId, memberSearch])

  const selectedMemberIds = useMemo(() => Array.from(selectedMembers), [selectedMembers])

  const resetForm = useCallback(() => {
    setGroupName('')
    setDescription('')
    setMemberSearch('')
    setSelectedMembers(new Set())
    setAvatarFile(null)
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarPreview(null)
  }, [avatarPreview])

  const handleToggle = useCallback(() => {
    resetForm()
    dispatch(setNewModal(2))
  }, [dispatch, resetForm])

  const handleAvatarChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
      if (file) {
        setAvatarFile(file)
        setAvatarPreview(URL.createObjectURL(file))
      } else {
        setAvatarFile(null)
        setAvatarPreview(null)
      }
    },
    [avatarPreview],
  )

  const toggleMember = useCallback(
    (memberId: number | string) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
          const totalMembers = next.size + 1 + 1
          if (totalMembers > max_group_members) {
            toast.error(
              t('group_member_limit_exceeded') ||
                `Cannot add more members: Maximum ${max_group_members} members allowed per group.`
            )
            return prev
          }
        next.add(memberId)
      }
      return next
    })
    },
    [max_group_members, t],
  )

  const handleCreateGroup = useCallback(async () => {
    if (!groupName.trim()) {
      toast.error(t('group_name_required'))
      return
    }

    // Check group count limit
    const currentGroupCount = userGroupsData?.groups?.length || 0
    if (currentGroupCount >= max_groups_per_user) {
      toast.error(
        t('group_limit_reached') ||
          `You can only be in ${max_groups_per_user} groups. Upgrade your plan for more.`
      )
      return
    }

    const totalMembers = selectedMemberIds.length + 1
    if (totalMembers > max_group_members) {
      toast.error(
        t('group_member_limit_exceeded') ||
          `Cannot create group: Maximum ${max_group_members} members allowed per group.`
      )
      return
    }

    const formData = new FormData()
    formData.append('name', groupName.trim())

    if (description.trim()) {
      formData.append('description', description.trim())
    }

    if (avatarFile) {
      formData.append('avatar', avatarFile)
    }

    selectedMemberIds.forEach((memberId) => {
      formData.append('members[]', memberId.toString())
    })

    try {
      const response = await createGroupMutation.mutateAsync(formData)
      toast.success(response?.message || t('group_created_successfully'))
      handleToggle()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || t('failed_to_create_group')
      toast.error(errorMessage)
    }
  }, [avatarFile, createGroupMutation, description, groupName, handleToggle, selectedMemberIds, t, max_group_members, max_groups_per_user, userGroupsData])

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void handleCreateGroup()
    },
    [handleCreateGroup],
  )

  const isCreateDisabled = !groupName.trim() || selectedMemberIds.length === 0 || createGroupMutation.isPending

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleToggle}
      title={t('create_new_group')}
      className="fade show add-popup add-group-modal"
      centered
      closeOnBackdrop={false}
      actions={[
        {
          text: t('cancel'),
          color: 'danger',
          className: 'button-effect btn-sm',
          onClick: handleToggle,
          autoClose: false,
        },
        {
          text: t('create_group'),
          color: 'primary',
          className: 'button-effect btn-sm',
          onClick: handleCreateGroup,
          autoClose: false,
          disabled: isCreateDisabled,
          loading: createGroupMutation.isPending,
        },
      ]}
    >
      <Form onSubmit={handleSubmit} encType="multipart/form-data" className="default-new-form">
        <FormGroup>
          <Label for="group-name">{t('group_name')} *</Label>
          <Input
            id="group-name"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t('enter_group_name')}
          />
        </FormGroup>

        <FormGroup>
          <Label for="group-description">{t('description')}</Label>
          <Input
            id="group-description"
            type="textarea"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('describe_the_group_optional')}
          />
        </FormGroup>

        <FormGroup>
          <Label for="group-avatar">{t('group_avatar')}</Label>
          <Input id="group-avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
          {avatarPreview && (
            <div className="group-img-box">
              <Image className="img-100 rounded" src={avatarPreview} alt={t('group_avatar')} />
            </div>
          )}
        </FormGroup>

        <div className="mt-4">
          <Label className="d-flex justify-content-between align-items-center">
            <span>{t('select_members')}</span>
            <span className="small text-muted">
              {t('selected_count', { count: selectedMemberIds.length })} / {max_group_members - 1}
              {selectedMemberIds.length + 1 > max_group_members - 1 && (
                <span className="text-danger ms-1">(Limit reached)</span>
              )}
            </span>
          </Label>

          <Input
            id="group-member-search"
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder={t('search_by_name_or_email')}
            className="mb-3"
          />

          <div className="member-list custom-scroll">
            {isContactsLoading ? (
              <div className="text-center py-4">
                <Spinner size="sm" className="me-2" />
                {t('loading_contacts')}
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center text-muted py-4">{t('no_contacts_found')}</div>
            ) : (
              <ul className="call-log-main new-group-box custom-scroll">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedMembers.has(contact.chat_id)
                  return (
                    <li key={contact.chat_id}>
                      <div className="call-box" onClick={() => toggleMember(contact.chat_id)}>
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
                          onChange={() => toggleMember(contact.chat_id)}
                          aria-label={t('toggle_member', { name: contact.name })}
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

export default Groups
