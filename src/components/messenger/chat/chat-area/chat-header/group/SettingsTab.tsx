import { UseMutationResult, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { queries } from '../../../../../../api'
import { toast } from 'react-toastify'
import { Button, Input, Label, Spinner } from 'reactstrap'
import { KEYS } from '../../../../../../constants/keys'
import { GroupSettings, UpdateGroupSettingsPayload } from '../../../../../../types/api'

const GroupSettingsTab: React.FC<{
  groupId: string | undefined | number
  updateGroupSettingsMutation: UseMutationResult<
    { message: string; data: GroupSettings },
    unknown,
    UpdateGroupSettingsPayload,
    unknown
  >
  queryClient: ReturnType<typeof useQueryClient>
}> = ({ groupId, updateGroupSettingsMutation, queryClient }) => {
  const { t } = useTranslation()
  const [allowEditInfo, setAllowEditInfo] = useState<'admin' | 'everyone'>('admin')
  const [allowSendMessage, setAllowSendMessage] = useState<'admin' | 'everyone'>('everyone')
  const [allowAddMember, setAllowAddMember] = useState<'admin' | 'everyone'>('everyone')

  const { data: groupInfoData } = queries.useGetGroupInfo(groupId, { enabled: !!groupId })
  const group = groupInfoData?.group

  useEffect(() => {
    if (group?.setting) {
      setAllowEditInfo(group.setting.allow_edit_info || 'admin')
      setAllowSendMessage(group.setting.allow_send_message || 'everyone')
      setAllowAddMember(group.setting.allow_add_member || 'everyone')
    }
  }, [group])

  const handleSaveSettings = async () => {
    if (!groupId) return

    try {
      await updateGroupSettingsMutation.mutateAsync({
        group_id: groupId,
        allow_edit_info: allowEditInfo,
        allow_send_message: allowSendMessage,
        allow_add_member: allowAddMember,
      })
      toast.success('Settings updated successfully')
      queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, groupId] })
    } catch (error) {
      console.error('Failed to update settings:', error)
      toast.error('Failed to update settings')
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Label className="fw-bold mb-2">Who can edit group info?</Label>
        <div className="group-setting-aligns">
          <Label check>
            <Input
              type="radio"
              name="allowEditInfo"
              value="admin"
              checked={allowEditInfo === 'admin'}
              onChange={(e) => setAllowEditInfo(e.target.value as 'admin' | 'everyone')}
            />{' '}
            {t('only_admins')}
          </Label>
          <Label check>
            <Input
              type="radio"
              name="allowEditInfo"
              value="everyone"
              checked={allowEditInfo === 'everyone'}
              onChange={(e) => setAllowEditInfo(e.target.value as 'admin' | 'everyone')}
            />{' '}
            {t('everyone')}
          </Label>
        </div>
      </div>

      <div className="mb-4">
        <Label className="fw-bold mb-2">Who can send messages?</Label>
        <div className="group-setting-aligns">
          <Label check>
            <Input
              type="radio"
              name="allowSendMessage"
              value="admin"
              checked={allowSendMessage === 'admin'}
              onChange={(e) => setAllowSendMessage(e.target.value as 'admin' | 'everyone')}
            />{' '}
            {t('only_admins')}
          </Label>
          <Label check>
            <Input
              type="radio"
              name="allowSendMessage"
              value="everyone"
              checked={allowSendMessage === 'everyone'}
              onChange={(e) => setAllowSendMessage(e.target.value as 'admin' | 'everyone')}
            />{' '}
            {t('everyone')}
          </Label>
        </div>
      </div>
      <div className="mb-4">
        <Label className="fw-bold mb-2">Who can add members?</Label>
        <div className="group-setting-aligns">
          <Label check>
            <Input
              type="radio"
              name="allowAddMember"
              value="admin"
              checked={allowAddMember === 'admin'}
              onChange={(e) => setAllowAddMember(e.target.value as 'admin' | 'everyone')}
            />{' '}
            {t('only_admins')}
          </Label>
          <Label check>
            <Input
              type="radio"
              name="allowAddMember"
              value="everyone"
              checked={allowAddMember === 'everyone'}
              onChange={(e) => setAllowAddMember(e.target.value as 'admin' | 'everyone')}
            />{' '}
            {t('everyone')}
          </Label>
        </div>
      </div>

      <Button color="primary" onClick={handleSaveSettings} disabled={updateGroupSettingsMutation.isPending}>
        {updateGroupSettingsMutation.isPending ? <Spinner size="sm" /> : 'Save Settings'}
      </Button>
    </div>
  )
}

export default GroupSettingsTab
