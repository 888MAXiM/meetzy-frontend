import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SimpleModal from '../../../../../../shared/modal/SimpleModal'
import { mutations } from '../../../../../../api'
import { useAppSelector } from '../../../../../../redux/hooks'
import { toaster } from '../../../../../../utils/custom-functions'
import { Input, Label } from 'reactstrap'

interface DisappearingModalProps {
  isOpen: boolean
  onClose: () => void
}

interface DurationOption {
  value: string
  label: string
  description: string
}

const DisappearingModal: React.FC<DisappearingModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation()
  const { selectedUser } = useAppSelector((state) => state.chat)
  const { mutate, isPending } = mutations.useToggleDisappearingMessages()
  const [selectedDuration, setSelectedDuration] = useState<string>()

  useEffect(() => {
    if (!selectedUser) {
      setSelectedDuration('off')
      return
    }
    
    const disappearing = selectedUser.disappearing
    const duration = disappearing?.enabled 
      ? (disappearing.duration || 'off')
      : 'off'
    
    setSelectedDuration(duration)
  }, [
    selectedUser,
    selectedUser?.disappearing?.enabled,
    selectedUser?.disappearing?.duration,
    isOpen,
  ])

  const durationOptions: DurationOption[] = [
    {
      value: '24h',
      label: '24 hours',
      description: 'Messages disappear after 24 hours',
    },
    {
      value: '7d',
      label: '7 days',
      description: 'Messages disappear after 7 days',
    },
    {
      value: '90d',
      label: '90 days',
      description: 'Messages disappear after 90 days',
    },
    {
      value: 'after_seen',
      label: 'After seen',
      description: 'Messages disappear after seen',
    },
    {
      value: 'off',
      label: 'Off',
      description: 'Turn off disappearing messages',
    },
  ]

  const handleConfirm = () => {
    const isGroupChat = selectedUser?.chat_type === 'group'

    const payload: any = {
      duration: selectedDuration,
      enabled: selectedDuration !== 'off',
    }

    if (isGroupChat) {
      payload.groupId = selectedUser?.chat_id
    } else {
      payload.recipientId = selectedUser?.chat_id
    }

    mutate(payload, {
      onSuccess: () => {
        toaster('success', `Disappearing messages ${selectedDuration === 'off' ? 'disabled' : 'enabled'}`)
        onClose()
      },
      onError: () => {
        toaster('error', 'Failed to update disappearing messages')
      },
    })
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t('Disappearing Messages')}
      size="md"
      centered
      modalClassName="disappearing-chat-modal"
      actions={[
        {
          title: t('cancel') || 'Cancel',
          onClick: handleCancel,
          color: 'secondary',
          disabled: isPending,
        },
        {
          title: t('confirm') || 'Confirm',
          onClick: handleConfirm,
          color: 'primary',
          disabled: isPending,
        },
      ]}
    >
      <div className="disappearing-options">
        <p className="text-muted mb-3">
          For more privacy and storage, all new messages will disappear from this chat after the selected duration.
        </p>

        <div className="duration-options">
          {durationOptions.map((option) => (
            <Label
              key={option.value}
              className={`duration-option ${selectedDuration === option.value ? 'active' : ''}`}
              htmlFor={`duration-${option.value}`}
            >
              <Input
                type="radio"
                id={`duration-${option.value}`}
                name="duration"
                value={option.value}
                checked={selectedDuration === option.value}
                onChange={(e) => setSelectedDuration(e.target.value as string)}
              />
              <div className="duration-content">
                <div className="duration-label">{option.label}</div>
                <div className="duration-description">{option.description}</div>
              </div>
            </Label>
          ))}
        </div>
      </div>
    </SimpleModal>
  )
}

export default DisappearingModal
