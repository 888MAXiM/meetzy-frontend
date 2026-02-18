import { Button, Input, Label, Spinner } from 'reactstrap'
import ChatAvatar from '../../../../../../shared/image/ChatAvatar'
import { AvatarUpload } from '../../../../left-sidebar-chat/main-sidebar-tab/settings/settings-heading/AvatarUpload'
import { formatDate } from '../../../../../../utils'
import { AboutTabProps } from '../../../../../../types/components/chat'
import { useTranslation } from 'react-i18next'

const AboutTab: React.FC<AboutTabProps> = ({
  group,
  isAdmin,
  isMember,
  isEditing,
  isLoadingGroup,
  editName,
  editDescription,
  currentAvatarUrl,
  onSetEditing,
  onSetEditName,
  onSetEditDescription,
  onAvatarChange,
  onRemoveAvatar,
  onSaveEdit,
  onCancelEdit,
  onLeaveGroup,
  onDeleteGroupForMe,
  updateGroupMutation,
  leaveGroupMutation,
  deleteChatLoading,
}) => {
  const { t } = useTranslation()

  if (isLoadingGroup) {
    return (
      <div className="text-center py-4">
        <Spinner />
      </div>
    )
  }

  return (
    <div>
      {!isEditing ? (
        <div className="mb-2">
          <ChatAvatar data={group} name={group} customClass="avatar-lg mx-auto profile" />
        </div>
      ) : (
        <div className="mb-3">
          <AvatarUpload
            currentAvatar={currentAvatarUrl}
            username={group?.name || ''}
            isEditing={true}
            onAvatarChange={onAvatarChange}
            onRemoveAvatar={onRemoveAvatar}
          />
        </div>
      )}

      {!isEditing ? (
        <>
          <div className="mb-3">
            <Label className="fw-bold">{t('group_name')}</Label>
            <div className="p-2 bg-light rounded text-break">{group?.name}</div>
          </div>

          <div className="mb-3">
            <Label className="fw-bold">{t('description')}</Label>
            <div className="p-2 bg-light rounded">{group?.description || t('no_description')}</div>
          </div>

          {(isAdmin || group.setting.allow_edit_info !== 'admin') && (
            <Button color="primary" outline onClick={() => onSetEditing(true)}>
              {t('edit')}
            </Button>
          )}

          <div className="mt-4 small text-muted">
            {t('created_by')} {group?.creator?.name || t('unknown')} {t('on')}{' '}
            {group?.created_at ? formatDate(group.created_at) : t('unknown_date')}
          </div>

          {isMember ? (
            <div className="leavegrp mt-3 p-3 bg-danger bg-opacity-10 border border-danger rounded">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="fw-bold">{t('leave_group')}</div>
                  <div className="small text-muted">{t('leave_group_desc')}</div>
                </div>
                <Button color="danger" outline onClick={onLeaveGroup} disabled={leaveGroupMutation.isPending}>
                  {leaveGroupMutation.isPending ? <Spinner size="sm" /> : t('leave_group')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="leavegrp mt-3 p-3 bg-light border rounded">
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <div>
                  <div className="fw-bold">{t('delete_group_for_me')}</div>
                  <div className="small text-muted">
                    {t('delete_group_for_me_desc') || 'This will remove the group from your chats.'}
                  </div>
                </div>
                <Button color="danger" outline onClick={onDeleteGroupForMe} disabled={deleteChatLoading}>
                  {deleteChatLoading ? <Spinner size="sm" /> : t('delete')}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-3">
            <Label className="fw-bold">{t('group_name')}</Label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => onSetEditName(e.target.value)}
              placeholder={t('enter_group_name')}
            />
          </div>

          <div className="mb-3">
            <Label className="fw-bold">{t('description')}</Label>
            <Input
              type="textarea"
              rows={3}
              value={editDescription}
              onChange={(e) => onSetEditDescription(e.target.value)}
              placeholder={t('enter_group_description')}
            />
          </div>

          <div className="d-flex gap-2">
            <Button color="primary" onClick={onSaveEdit} disabled={updateGroupMutation.isPending || !editName.trim()}>
              {updateGroupMutation.isPending ? <Spinner size="sm" /> : t('save')}
            </Button>

            <Button color="light" outline onClick={onCancelEdit}>
              {t('cancel')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default AboutTab
