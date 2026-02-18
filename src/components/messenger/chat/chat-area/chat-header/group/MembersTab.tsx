import { MoreVertical } from 'react-feather'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Input, Spinner } from 'reactstrap'
import ChatAvatar from '../../../../../../shared/image/ChatAvatar'
import { GroupMember } from '../../../../../../types/api'
import { MembersTabProps } from '../../../../../../types/components/chat'
import { useTranslation } from 'react-i18next'

const MembersTab: React.FC<MembersTabProps> = ({
  members,
  memberSearch,
  isLoadingMembers,
  user,
  isAdmin,
  openDropdownId,
  onSetMemberSearch,
  onToggleDropdown,
  onUpdateMemberRole,
  onRemoveMember,
}) => {
  const { t } = useTranslation()

  if (isLoadingMembers) {
    return (
      <div className="text-center py-4">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3">
        <Input
          type="text"
          placeholder={t('search_members')}
          value={memberSearch}
          onChange={(e) => onSetMemberSearch(e.target.value)}
        />
      </div>

      <div className="list-group">
        {members
          .slice()
          .sort((a, b) => {
            const isAYou = a.id === user?.id
            const isBYou = b.id === user?.id
            if (isAYou) return -1
            if (isBYou) return 1
            if (a.group_role === 'admin' && b.group_role !== 'admin') return -1
            if (a.group_role !== 'admin' && b.group_role === 'admin') return 1
            return a.name.localeCompare(b.name)
          })
          .map((member: GroupMember) => {
            const isCurrentUser = member.id === user?.id
            const canManage = isAdmin && !isCurrentUser && (member.group_role !== 'admin' || !member.is_created_by)
            const canMakeAdmin = isAdmin && !isCurrentUser

            return (
              <div key={member.id} className="list-group-item d-flex align-items-center">
                <ChatAvatar data={member} name={member} customClass="avatar-sm" />

                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="fw-medium">{isCurrentUser ? 'You' : member.name}</span>

                    {member.group_role === 'admin' && member.is_created_by && (
                      <span className="badge bg-primary ms-2">{t('admin')}</span>
                    )}
                    {member.group_role === 'admin' && !member.is_created_by && (
                      <span className="badge bg-primary ms-2">{t('admin')}</span>
                    )}
                  </div>

                  <div className="small text-muted">{member.email}</div>
                </div>

                {canManage && (
                  <Dropdown
                    isOpen={openDropdownId === member.id}
                    toggle={() => onToggleDropdown(openDropdownId === member.id ? null : member.id)}
                  >
                    <DropdownToggle tag="span" className="cursor-pointer">
                      <MoreVertical size={18} />
                    </DropdownToggle>

                    <DropdownMenu>
                      {canMakeAdmin && (
                        <DropdownItem
                          onClick={() =>
                            onUpdateMemberRole(member.id, member.group_role === 'admin' ? 'member' : 'admin')
                          }
                        >
                          {member.group_role === 'admin' ? t('remove_admin') : t('make_admin')}
                        </DropdownItem>
                      )}

                      <DropdownItem onClick={() => onRemoveMember(member.id)} className="text-danger">
                        {t('remove_from_group')}
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

export default MembersTab
