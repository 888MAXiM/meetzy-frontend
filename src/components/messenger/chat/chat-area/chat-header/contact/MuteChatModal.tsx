import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { mutations } from '../../../../../../api'
import { ChatType } from '../../../../../../constants'
import SimpleModal from '../../../../../../shared/modal/SimpleModal'
import { SvgIcon } from '../../../../../../shared/icons'
import { RecentChat } from '../../../../../../types/components/chat'

interface MuteChatModalProps {
  isOpen: boolean
  onClose: () => void
  contact?: RecentChat
  onMuteSuccess?: () => void
}

type MuteDuration = '1h' | '8h' | '1w' | 'forever'

const MuteChatModal: React.FC<MuteChatModalProps> = ({ isOpen, onClose, contact, onMuteSuccess }) => {
  const { t } = useTranslation()
  const [selectedDuration, setSelectedDuration] = useState<MuteDuration | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const muteChatMutation = mutations.useMuteChat()

  const chatId = contact?.chat_id
  const chatType = contact?.chat_type === 'group' ? ChatType.group : ChatType.DM

  const muteOptions: Array<{ value: MuteDuration; label: string; description: string }> = [
    {
      value: '1h',
      label: t('hour_1') || '1 Hour',
      description: t('mute_for_1_hour') || 'Mute notifications for 1 hour',
    },
    {
      value: '8h',
      label: t('hours_8') || '8 Hours',
      description: t('mute_for_8_hours') || 'Mute notifications for 8 hours',
    },
    {
      value: '1w',
      label: t('week_1') || '1 Week',
      description: t('mute_for_1_week') || 'Mute notifications for 1 week',
    },
    {
      value: 'forever',
      label: t('forever') || 'Forever',
      description: t('mute_forever') || 'Mute notifications indefinitely',
    },
  ]

  const handleMute = async () => {
    if (!chatId || !contact || !selectedDuration) return

    setIsLoading(true)
    try {
      await muteChatMutation.mutateAsync({
        target_id: chatId,
        target_type: chatType === ChatType.group ? 'group' : contact?.isAnnouncement ? 'announcement' : 'user',
        duration: selectedDuration,
      })

      if (onMuteSuccess) {
        onMuteSuccess()
      }

      onClose()
      setSelectedDuration(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('mute_chat') || 'Mute Chat'}
      size="sm"
      centered
      modalClassName="mute-chat-modal"
      actions={[
        {
          title: t('cancel') || 'Cancel',
          onClick: onClose,
          color: 'secondary',
          disabled: isLoading,
        },
        {
          title: t('confirm') || 'Confirm',
          onClick: handleMute,
          color: 'primary',
          loading: isLoading,
          disabled: !selectedDuration,
        },
      ]}
    >
      <div className="mute-chat-modals">
        <div className="mute-options">
          {muteOptions.map((option) => (
            <div
              key={option.value}
              className={`mute-option ${selectedDuration === option.value ? 'selected' : ''}`}
              onClick={() => setSelectedDuration(option.value)}
              style={{
                border: `1px solid ${selectedDuration === option.value ? 'rgba(var(--primary-color),1)' : '#e0e0e0'}`,
                backgroundColor: selectedDuration === option.value ? 'rgba(var(--primary-color),0.1)' : 'transparent',
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="mb-1">{option.label}</h6>
                </div>
                {selectedDuration === option.value && (
                  <SvgIcon
                    className="fill-primary mute-options-svg"
                    iconId="check-circle"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SimpleModal>
  )
}

export default MuteChatModal
