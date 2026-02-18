import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Input, Label } from 'reactstrap'
import { useQueryClient } from '@tanstack/react-query'
import { mutations } from '../../../../../../api'
import { KEYS } from '../../../../../../constants/keys'
import { useAppSelector } from '../../../../../../redux/hooks'
import SimpleModal from '../../../../../../shared/modal/SimpleModal'
import { Message } from '../../../../../../types/api'

interface PinMessageModalProps {
  isOpen: boolean
  onClose: () => void
  message: Message | null
}

interface DurationOption {
  value: string
  label: string
}

const PinMessageModal: React.FC<PinMessageModalProps> = ({ isOpen, onClose, message }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { selectedUser } = useAppSelector((state) => state.chat)
  const pinMessageMutation = mutations.useTogglePinMessage()
  const [selectedDuration, setSelectedDuration] = useState<string>('7d')

  useEffect(() => {
    setSelectedDuration(selectedUser?.disappearing?.duration || '7d')
  }, [selectedUser])

  const durationOptions: DurationOption[] = [
    {
      value: '24h',
      label: '24 hours',
    },
    {
      value: '7d',
      label: '7 days',
    },
    {
      value: '30d',
      label: '90 days',
    },
  ]

  const handleConfirm = async () => {
    if (!message) return

    try {
      await pinMessageMutation.mutateAsync({
        messageId: message.id,
        duration: selectedDuration, 
      })

      queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES], exact: false })
      toast.success('Message pinned successfully')
      onClose()
    } catch (error) {
      console.error('Failed to pin message:', error)
      toast.error('Failed to pin message')
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={t('Choose how long your pin lasts')}
      size="md"
      centered
      modalClassName="disappearing-chat-modal"
      actions={[
        {
          title: t('cancel') || 'Cancel',
          onClick: handleCancel,
          color: 'secondary',
          disabled: pinMessageMutation.isPending,
        },
        {
          title: t('confirm') || 'Confirm',
          onClick: handleConfirm,
          color: 'primary',
          disabled: pinMessageMutation.isPending,
        },
      ]}
    >
      <div className="disappearing-options">
        <p className="text-muted mb-3">You can unpin any time.</p>

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
                onChange={(e) => setSelectedDuration(e.target.value)}
              />
              <div className="duration-content">
                <div className="duration-label">{option.label}</div>
              </div>
            </Label>
          ))}
        </div>
      </div>
    </SimpleModal>
  )
}

export default PinMessageModal
