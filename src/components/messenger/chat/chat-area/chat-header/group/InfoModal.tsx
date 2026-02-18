import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Button, Modal, ModalBody, ModalHeader, TabContent, TabPane } from 'reactstrap'
import { mutations, queries } from '../../../../../../api'
import { KEYS } from '../../../../../../constants/keys'
import { useAppDispatch, useAppSelector } from '../../../../../../redux/hooks'
import { setSelectedUser, removeRecentChat, selectChat } from '../../../../../../redux/reducers/messenger/chatSlice'
import { GroupInfoModalProps } from '../../../../../../types/components/chat'
import { toaster } from '../../../../../../utils/custom-functions'
import SimpleModal from '../../../../../../shared/modal/SimpleModal'
import AboutTab from './AboutTab'
import GroupSettingsTab from './SettingsTab'
import MembersTab from './MembersTab'
import AddMemberModal from './AddMemberModal'
import { ChatType } from '../../../../../../constants'
import { useUserFeatures } from '../../../../../../hooks/useUserFeatures'

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({ isOpen, groupId, onClose }) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'about' | 'members' | 'settings'>('about')
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [openDropdownId, setOpenDropdownId] = useState<number | string | null>(null)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [addMemberSearch, setAddMemberSearch] = useState('')
  const { user } = useAppSelector((store) => store.auth)
  const selectedUser = useAppSelector((store) => store.chat.selectedUser)
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false)
  const { data: groupInfoData, isLoading: isLoadingGroup } = queries.useGetGroupInfo(groupId, {
    enabled: isOpen && !!groupId,
  })
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    refetch: refetchMembers,
  } = queries.useGetGroupMembers(
    groupId,
    { page: 1, limit: 100, search: memberSearch },
    { enabled: isOpen && !!groupId },
  )

  const group = groupInfoData?.group
  const members = membersData?.members || []
  const totalMembers = membersData?.total_members || 0
  const currentUserMember = useMemo(() => members.find((m) => m.id === user?.id), [members, user?.id])
  const isMember = !!currentUserMember
  const isAdmin = currentUserMember?.group_role === 'admin'
  const updateGroupMutation = mutations.useUpdateGroup()
  const addMembersMutation = mutations.useAddGroupMembers()
  const removeMembersMutation = mutations.useRemoveGroupMembers()
  const updateMemberRoleMutation = mutations.useUpdateMemberRole()
  const leaveGroupMutation = mutations.useLeaveGroup()
  const deleteChatMutation = mutations.useDeleteChat()
  const updateGroupSettingsMutation = mutations.useUpdateGroupSettings()
  const { data: contactsData } = queries.useGetContactList(1, 100, { enabled: showAddMemberModal })
  const contacts = contactsData?.contacts || []
  const { max_group_members } = useUserFeatures()

  useEffect(() => {
    if (group) {
      setEditName(group.name)
      setEditDescription(group.description || '')
      setRemoveAvatar(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    }
  }, [group])

  const handleAvatarChange = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('please_select_valid_image'))
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('image_size_limit'))
        return
      }
      setAvatarFile(file)
      const previewUrl = URL.createObjectURL(file)
      setAvatarPreview(previewUrl)
      setRemoveAvatar(false)
    },
    [t],
  )

  const handleRemoveAvatarClick = useCallback(() => {
    setRemoveAvatar(true)
    setAvatarFile(null)
    setAvatarPreview(null)
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!groupId) return

    try {
      await updateGroupMutation.mutateAsync({
        group_id: groupId,
        name: editName.trim(),
        description: editDescription.trim(),
        avatar: avatarFile || undefined,
        remove_avatar: removeAvatar,
      })
      toaster('success', t('group_updated_successfully'))
      setIsEditing(false)
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
      queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, groupId] })
      queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
    } catch (error) {
      console.error('Failed to update group:', error)
      toaster('warn', t('failed_to_update_group'))
    }
  }, [groupId, editName, editDescription, avatarFile, removeAvatar, updateGroupMutation, queryClient, avatarPreview, t])

  const handleCancelEdit = useCallback(() => {
    if (group) {
      setEditName(group.name)
      setEditDescription(group.description || '')
    }
    setIsEditing(false)
    setAvatarFile(null)
    setAvatarPreview(null)
    setRemoveAvatar(false)
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
  }, [group, avatarPreview])

  const handleAddMembers = useCallback(
    async (userIds: (number | string)[]) => {
      if (!groupId) return

      // Check if adding these members would exceed the limit
      const newTotalMembers = totalMembers + userIds.length
      if (newTotalMembers > max_group_members) {
        toast.error(
          t('group_member_limit_exceeded') ||
            `Cannot add members: This group cannot exceed ${max_group_members} members.`,
        )
        return
      }

      try {
        await addMembersMutation.mutateAsync({
          group_id: groupId,
          members: userIds.map((id) => ({
            user_id: id,
            role: 'member',
          })),
        })
        toast.success(t('members_added_successfully'))
        setShowAddMemberModal(false)
        setAddMemberSearch('')
        refetchMembers()
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
      } catch (error: any) {
        console.error('Failed to add members:', error)
        const errorMessage = error?.response?.data?.message || error?.message || t('failed_to_add_members')
        toast.error(errorMessage)
      }
    },
    [groupId, addMembersMutation, refetchMembers, queryClient, t, totalMembers, max_group_members],
  )

  const handleRemoveMember = useCallback(
    async (userId: number | string) => {
      if (!groupId) return

      try {
        await removeMembersMutation.mutateAsync({
          group_id: groupId,
          user_ids: [userId],
        })
        toast.success(t('member_removed_successfully'))
        refetchMembers()
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
      } catch (error) {
        console.error('Failed to remove member:', error)
        toast.error(t('failed_to_remove_member'))
      }
      setOpenDropdownId(null)
    },
    [groupId, removeMembersMutation, refetchMembers, queryClient, t],
  )

  const handleUpdateMemberRole = useCallback(
    async (userId: string | number, newRole: 'admin' | 'member') => {
      if (!groupId) return

      try {
        await updateMemberRoleMutation.mutateAsync({
          group_id: groupId,
          user_id: userId,
          new_role: newRole,
        })
        toast.success(t('member_role_updated', { role: newRole }))
        refetchMembers()
      } catch (error) {
        console.error('Failed to update member role:', error)
        toast.error(t('failed_to_update_member_role'))
      }
      setOpenDropdownId(null)
    },
    [groupId, updateMemberRoleMutation, refetchMembers, t],
  )

  const handleLeaveGroup = useCallback(() => {
    if (!groupId) return
    setShowDeleteGroupModal(true)
  }, [groupId])

  const handleConfirmLeaveGroup = useCallback(
    async (deleteForMe: boolean) => {
      if (!groupId) return

      try {
        await leaveGroupMutation.mutateAsync({ group_id: groupId })

        if (deleteForMe) {
          await deleteChatMutation.mutateAsync({
            targetId: groupId,
            targetType: 'group',
            deleteType: 'hide_chat',
          })

          if (selectedUser && (selectedUser.chat_id === groupId || selectedUser.id === groupId)) {
            dispatch(setSelectedUser(null))
            dispatch(selectChat(null))
          }
          dispatch(removeRecentChat({ chatId: groupId, chatType: 'group' }))
        }

        toast.success(t('left_group_successfully'))
        setShowDeleteGroupModal(false)
        onClose()
        queryClient.invalidateQueries({ queryKey: [KEYS.USER_GROUPS] })
        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, groupId] })
      } catch (error) {
        console.error('Failed to leave group:', error)
        toast.error(t('failed_to_leave_group'))
        setShowDeleteGroupModal(false)
      }
    },
    [groupId, leaveGroupMutation, deleteChatMutation, selectedUser, onClose, queryClient, dispatch, t],
  )

  const handleDeleteGroupForMe = useCallback(async () => {
    if (!groupId) return
    try {
      await deleteChatMutation.mutateAsync({
        targetId: groupId,
        targetType: 'group',
        deleteType: 'hide_chat',
      })

      if (selectedUser && (selectedUser.chat_id === groupId || selectedUser.id === groupId)) {
        dispatch(setSelectedUser(null))
        dispatch(selectChat(null))
      }
      dispatch(removeRecentChat({ chatId: groupId, chatType: 'group' }))
      toast.success(t('chat_deleted_successfully') || 'Group deleted')
      queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
    } catch (error) {
      console.error('Failed to delete group for user:', error)
      toast.error(t('failed_to_delete_group_for_me') || 'Failed to delete group')
    }
  }, [groupId, deleteChatMutation, selectedUser, dispatch, queryClient, t])

  const filteredContacts = useMemo(() => {
    const searchLower = addMemberSearch.toLowerCase()
    const existingMemberIds = new Set(members.map((m) => m.id))
    return contacts.filter(
      (contact) =>
        !existingMemberIds.has(contact.chat_id) &&
        contact.chat_id !== user?.id &&
        (contact.name.toLowerCase().includes(searchLower) || contact.email?.toLowerCase().includes(searchLower)),
    )
  }, [contacts, members, addMemberSearch, user?.id])

  const currentAvatarUrl = useMemo(() => {
    if (avatarPreview) return avatarPreview
    if (removeAvatar) return null
    return group?.avatar_url || null
  }, [avatarPreview, removeAvatar, group?.avatar_url])

  const isGroupMember = useMemo(() => {
    if (selectedUser?.chat_type !== ChatType.group) return true
    const members = membersData?.members || []
    return members.some((m) => m.id === user?.id)
  }, [membersData?.members, user?.id, selectedUser?.chat_type])

  if (!isOpen || !groupId) return null

  return (
    <>
      <Modal isOpen={isOpen} toggle={onClose} size="lg" className="group-info-modal" centered>
        <ModalHeader toggle={onClose} className="border-bottom-0 pb-0">
          <div className="w-100">
            <h2 className="mb-1 text-elipsis">{group?.name || t('loading')}</h2>
            {group?.description && <p className="text-muted small mb-0">{group.description}</p>}
          </div>
        </ModalHeader>
        <ModalBody className="pt-0">
          <div className="d-flex align-items-center border-bottom mb-3 btn-groupings">
            <button
              className={`btn btn-link text-decoration-none groupinfo-btn ${
                activeTab === 'about' ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
              }`}
              onClick={() => setActiveTab('about')}
            >
              {t('about')}
            </button>
            <button
              className={`btn btn-link text-decoration-none groupinfo-btn ${
                activeTab === 'members' ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
              }`}
              onClick={() => setActiveTab('members')}
            >
              {t('members')} {totalMembers > 0 && <span className="badge bg-primary">{totalMembers}</span>}
            </button>
            {isAdmin && (
              <button
                className={`btn btn-link text-decoration-none groupinfo-btn ${
                  activeTab === 'settings' ? 'text-primary border-bottom border-primary border-2' : 'text-muted'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                {t('settings')}
              </button>
            )}
            {activeTab === 'members' &&
              isGroupMember &&
              selectedUser?.chat_type === ChatType.group &&
              (group?.setting?.allow_add_member === 'everyone' || false || isAdmin) && (
                <div className="ms-auto">
                  <button
                    className="btn btn-sm btn-primary add-member d-flex align-items-center"
                    onClick={() => {
                      if (totalMembers >= max_group_members) {
                        toast.error(
                          t('group_member_limit_reached') ||
                            `Group member limit reached. Maximum ${max_group_members} members allowed.`,
                        )
                        return
                      }
                      setShowAddMemberModal(true)
                    }}
                    disabled={totalMembers >= max_group_members}
                    title={
                      totalMembers >= max_group_members ? `Maximum ${max_group_members} members allowed` : undefined
                    }
                  >
                    <Plus size={16} className="me-1" />
                    {t('add_member')}
                  </button>
                </div>
              )}
          </div>

          <TabContent activeTab={activeTab}>
            <TabPane tabId="about">
              <AboutTab
                group={group}
                isAdmin={isAdmin}
                isMember={isMember}
                isEditing={isEditing}
                isLoadingGroup={isLoadingGroup}
                editName={editName}
                editDescription={editDescription}
                currentAvatarUrl={currentAvatarUrl}
                onSetEditing={setIsEditing}
                onSetEditName={setEditName}
                onSetEditDescription={setEditDescription}
                onAvatarChange={handleAvatarChange}
                onRemoveAvatar={handleRemoveAvatarClick}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onLeaveGroup={handleLeaveGroup}
                onDeleteGroupForMe={handleDeleteGroupForMe}
                updateGroupMutation={updateGroupMutation}
                leaveGroupMutation={leaveGroupMutation}
                deleteChatLoading={deleteChatMutation.isPending}
              />
            </TabPane>

            <TabPane tabId="members">
              <MembersTab
                members={members}
                totalMembers={totalMembers}
                memberSearch={memberSearch}
                isLoadingMembers={isLoadingMembers}
                user={user}
                isAdmin={isAdmin}
                openDropdownId={openDropdownId}
                onSetMemberSearch={setMemberSearch}
                onToggleDropdown={setOpenDropdownId}
                onUpdateMemberRole={handleUpdateMemberRole}
                onRemoveMember={handleRemoveMember}
                refetchMembers={refetchMembers}
              />
            </TabPane>

            <TabPane tabId="settings">
              {isAdmin ? (
                <GroupSettingsTab
                  groupId={groupId}
                  updateGroupSettingsMutation={updateGroupSettingsMutation}
                  queryClient={queryClient}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">{t('only_admins_can_access_settings')}</p>
                </div>
              )}
            </TabPane>
          </TabContent>
        </ModalBody>
      </Modal>

      <AddMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        filteredContacts={filteredContacts}
        addMemberSearch={addMemberSearch}
        onSetAddMemberSearch={setAddMemberSearch}
        onAddMembers={handleAddMembers}
      />

      <SimpleModal
        isOpen={showDeleteGroupModal}
        onClose={() => setShowDeleteGroupModal(false)}
        title={t('leave_group')}
        subtitle={t('leave_group_desc')}
        bodyClassName="text-center "
        closable={!(leaveGroupMutation.isPending || deleteChatMutation.isPending)}
        closeOnBackdrop={!(leaveGroupMutation.isPending || deleteChatMutation.isPending)}
        closeOnEscape={!(leaveGroupMutation.isPending || deleteChatMutation.isPending)}
        headerClassName="leave-group-modal"
      >
        <p className="text-muted text-start mb-0">{t('leave_group_confirm_message')}</p>
        <div className="leave-grn-btns">
          <Button
            className="btn-outline"
            onClick={() => handleConfirmLeaveGroup(false)}
            loading={leaveGroupMutation.isPending}
            disabled={leaveGroupMutation.isPending || deleteChatMutation.isPending}
          >
            {t('leave_group')}
          </Button>
          <Button
            className="btn-primary"
            onClick={() => handleConfirmLeaveGroup(true)}
            loading={leaveGroupMutation.isPending || deleteChatMutation.isPending}
            disabled={leaveGroupMutation.isPending || deleteChatMutation.isPending}
          >
            {t('leave_and_delete')}
          </Button>
        </div>
      </SimpleModal>
    </>
  )
}

export default GroupInfoModal
