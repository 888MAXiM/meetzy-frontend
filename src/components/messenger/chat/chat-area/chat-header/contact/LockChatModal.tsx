import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { mutations, queries } from '../../../../../../api'
import { useAppSelector } from '../../../../../../redux/hooks'
import { setChatPinVerified } from '../../../../../../redux/reducers/userSettingSlice'
import { setRecentChatLockStatus } from '../../../../../../redux/reducers/messenger/chatSlice'
import SimpleModal from '../../../../../../shared/modal/SimpleModal'
import { toaster } from '../../../../../../utils/custom-functions'
import ForgetPinModal from './ForgetChatPinModal'

interface LockChatModalProps {
  isOpen: boolean
  onClose: () => void
  actionType?: 'PinVerified' | 'changePin' | 'Default' | null
}

const LockChatModal: React.FC<LockChatModalProps> = ({ isOpen, onClose, actionType = null }) => {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { user } = useAppSelector((state) => state.auth)
  const { data } = queries.useGetUserSettings(user?.id)
  const { selectedUser } = useAppSelector((state) => state.chat)
  const { mutate, isPending } = mutations.useUpdateUserSetting()
  const [pinLength, setPinLength] = useState<number>(data?.userSetting?.chat_lock_digit || 4)

  useEffect(() => {
    if (data?.userSetting?.chat_lock_digit) {
      setPinLength(data.userSetting.chat_lock_digit)
    }
  }, [data?.userSetting?.chat_lock_digit])
  
  const [pin, setPin] = useState<string[]>([])
  const [confirmPin, setConfirmPin] = useState<string[]>([])
  const [oldPin, setOldPin] = useState<string[]>([])
  const [error, setError] = useState('')
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [showNewPin, setShowNewPin] = useState(false)
  const [showForgetPinModal, setShowForgetPinModal] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const isSettingNewPin = !data?.userSetting?.pin_hash
  const isLocking = !selectedUser?.isLocked
  const isChangingPin = actionType === 'changePin'

  useEffect(() => {
    if (!isOpen) {
      inputRefs.current = []
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setPin(Array(pinLength).fill(''))
      setConfirmPin(Array(pinLength).fill(''))
      setOldPin(Array(pinLength).fill(''))
      setShowConfirmPin(false)
      setShowNewPin(false)
      setPinLength(data?.userSetting.chat_lock_digit || 4)
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    setPin(Array(pinLength).fill(''))
    setConfirmPin(Array(pinLength).fill(''))
    if (!isChangingPin) {
      setOldPin(Array(pinLength).fill(''))
    }
  }, [pinLength])

  useEffect(() => {
    if (isOpen) {
      const focusFirstInput = () => {
        inputRefs.current = inputRefs.current.slice(0, pinLength)
        const firstInput = inputRefs.current[0]
        if (firstInput) {
          firstInput.focus()
        } else {
          requestAnimationFrame(focusFirstInput)
        }
      }
      requestAnimationFrame(() => {
        setTimeout(focusFirstInput, 10)
      })
    }
  }, [isOpen, pinLength, showNewPin, showConfirmPin])

  const setInputRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      inputRefs.current[index] = el
    },
    [],
  )

  const handlePinChange = (index: number, value: string, field: 'pin' | 'confirm' | 'old' = 'pin') => {
    if (!/^\d*$/.test(value)) return

    let newPin: string[]
    if (field === 'old') {
      newPin = [...oldPin]
    } else if (field === 'confirm') {
      newPin = [...confirmPin]
    } else {
      newPin = [...pin]
    }

    newPin[index] = value.slice(-1)

    if (field === 'old') {
      setOldPin(newPin)
    } else if (field === 'confirm') {
      setConfirmPin(newPin)
    } else {
      setPin(newPin)
    }

    if (value && index < pinLength - 1) {
      const nextInput = inputRefs.current[index + 1]
      nextInput?.focus()
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    field: 'pin' | 'confirm' | 'old' = 'pin',
  ) => {
    if (e.key === 'Backspace') {
      const currentPin = field === 'old' ? oldPin : field === 'confirm' ? confirmPin : pin
      if (!currentPin[index] && index > 0) {
        const prevInput = inputRefs.current[index - 1]
        prevInput?.focus()
      }
    } else if (e.key === 'Enter' && canConfirm()) {
      handleContinue()
    }
  }

  const handlePaste = (e: React.ClipboardEvent, field: 'pin' | 'confirm' | 'old' = 'pin') => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, pinLength)
    const newPin = Array(pinLength).fill('')

    pastedData.split('').forEach((digit, index) => {
      if (index < pinLength) {
        newPin[index] = digit
      }
    })

    if (field === 'old') {
      setOldPin(newPin)
    } else if (field === 'confirm') {
      setConfirmPin(newPin)
    } else {
      setPin(newPin)
    }

    const nextEmptyIndex = newPin.findIndex((val) => !val)
    const focusIndex = nextEmptyIndex === -1 ? pinLength - 1 : nextEmptyIndex
    const focusInput = inputRefs.current[focusIndex]
    focusInput?.focus()
  }

  const togglePinLength = () => {
    setPinLength(pinLength === 4 ? 6 : 4)
  }

  const handleContinue = () => {
    if (isChangingPin && !showNewPin) {
      setShowNewPin(true)
      setError('')
      return
    }

    if ((isSettingNewPin || isChangingPin) && showNewPin && !showConfirmPin) {
      setShowConfirmPin(true)
      setError('')
      return
    }

    handleConfirm()
  }

  const getChatType = (): 'user' | 'group' | 'broadcast' | 'announcement' => {
    if (selectedUser?.isAnnouncement) return 'announcement'
    if (selectedUser?.isBroadcast || selectedUser?.chat_type === 'broadcast') return 'broadcast'
    if (selectedUser?.isGroup || selectedUser?.chat_type === 'group') return 'group'
    return 'user'
  }

  const getChatId = (): number | undefined => {
    return (selectedUser?.chat_id || selectedUser?.id) as any
  }

  const handleConfirm = () => {
    const currentPin = getCurrentPin()
    const chatType = getChatType()
    const chatId = getChatId()

    const payload: {
      pin: string
      lock_chat?: { type: string; id: number }
      unlock_chat?: { type: string; id: number }
      new_pin?: string
    } = { pin: '' }

    if (actionType === 'PinVerified') {
      payload.pin = currentPin.join('')
    } else if (isChangingPin) {
      payload.pin = oldPin.join('')
      payload.new_pin = confirmPin.join('')
    } else if (isSettingNewPin && showConfirmPin) {
      payload.pin = confirmPin.join('')
      if (selectedUser?.isLocked && chatId) {
        payload.unlock_chat = { type: chatType, id: chatId }
      } else if (chatId) {
        payload.lock_chat = { type: chatType, id: chatId }
      }
    } else {
      payload.pin = currentPin.join('')
      if (selectedUser?.isLocked && chatId) {
        payload.unlock_chat = { type: chatType, id: chatId }
      } else if (chatId) {
        payload.lock_chat = { type: chatType, id: chatId }
      }
    }

    mutate(payload, {
      onSuccess: () => {
        if (actionType === 'PinVerified') {
          dispatch(setChatPinVerified(payload.pin))
          toaster('success', 'Chat verified successfully')
        } else if (isChangingPin) {
          toaster('success', 'PIN changed successfully')
        } else {
          // Update isLocked status immediately for real-time UI update
          const chatId = getChatId()
          const chatType = getChatType()
          if (chatId) {
            dispatch(
              setRecentChatLockStatus({
                chatId,
                chatType: chatType as 'direct' | 'group' | 'announcement' | 'broadcast',
                isLocked: isLocking,
              }),
            )
          }
          toaster('success', isLocking ? 'Chat locked successfully' : 'Chat unlocked successfully')
        }
        onClose()
      },
      onError: (err: any) => {
        const errorMsg = err?.response?.data?.message || 'Invalid PIN'
        setError(errorMsg)

        if (actionType === 'PinVerified') {
          setPin(Array(pinLength).fill(''))
          setTimeout(() => {
            inputRefs.current[0]?.focus()
          }, 0)
        }
      },
    })
  }

  const handleBack = () => {
    setError('')
    if (isChangingPin) {
      if (showConfirmPin) {
        setShowConfirmPin(false)
        setConfirmPin(Array(pinLength).fill(''))
      } else if (showNewPin) {
        setShowNewPin(false)
        setPin(Array(pinLength).fill(''))
        setPinLength(data?.userSetting.chat_lock_digit || 4)
      }
    } else if (isSettingNewPin && showConfirmPin) {
      setShowConfirmPin(false)
      setConfirmPin(Array(pinLength).fill(''))
    }
  }

  const handleCancel = () => {
    setError('')
    onClose()
  }

  const handleForgetPin = () => {
    onClose()
    setShowForgetPinModal(true)
  }

  const handleForgetPinSuccess = () => {
    toaster('success', 'PIN has been reset successfully. Please enter your new PIN.')
    setShowForgetPinModal(false)
    setPin(Array(pinLength).fill(''))
    setOldPin(Array(pinLength).fill(''))
    setError('')
  }

  const getTitle = () => {
    if (isChangingPin) {
      return t('Change PIN')
    }
    if (selectedUser?.isLocked && actionType === 'PinVerified') {
      return t('Verify this chat')
    }
    if (selectedUser?.isLocked) {
      return t('Unlock this chat')
    }
    return isSettingNewPin ? t('Set PIN to lock chat') : t('Enter PIN to lock chat')
  }

  const getDescription = () => {
    if (isChangingPin) {
      if (!showNewPin) {
        return 'Enter your current PIN'
      }
      return showConfirmPin ? 'Confirm your new PIN' : 'Enter your new PIN'
    }
    if (selectedUser?.isLocked && actionType === 'PinVerified') {
      return 'Enter your PIN to verify this chat'
    }
    if (selectedUser?.isLocked) {
      return 'Enter your PIN to unlock this chat'
    }
    if (isSettingNewPin) {
      return showConfirmPin ? 'Confirm your PIN' : 'Create a PIN to secure your chats'
    }
    return 'Enter your PIN to lock this chat'
  }

  const canConfirm = () => {
    let currentPin: string[]

    if (isChangingPin) {
      if (!showNewPin) {
        currentPin = oldPin
      } else if (showConfirmPin) {
        currentPin = confirmPin
      } else {
        currentPin = pin
      }
    } else {
      currentPin = showConfirmPin && isSettingNewPin ? confirmPin : pin
    }

    return currentPin.every((digit) => digit !== '') && currentPin.length === pinLength
  }

  const getCurrentPin = () => {
    if (isChangingPin) {
      if (!showNewPin) {
        return oldPin
      }
      return showConfirmPin ? confirmPin : pin
    }
    return showConfirmPin && isSettingNewPin ? confirmPin : pin
  }

  const getCurrentField = (): 'pin' | 'confirm' | 'old' => {
    if (isChangingPin) {
      if (!showNewPin) return 'old'
      return showConfirmPin ? 'confirm' : 'pin'
    }
    return showConfirmPin && isSettingNewPin ? 'confirm' : 'pin'
  }

  const currentPin = getCurrentPin()
  const currentField = getCurrentField()

  const getButtonText = () => {
    if (isChangingPin) {
      if (!showNewPin || !showConfirmPin) {
        return t('continue') || 'Continue'
      }
      return t('confirm') || 'Confirm'
    }
    if (showConfirmPin && isSettingNewPin) {
      return t('confirm') || 'Confirm'
    }
    return t('continue') || 'Continue'
  }

  const shouldShowBackButton = () => {
    if (isChangingPin) {
      return showNewPin
    }
    return isSettingNewPin && showConfirmPin
  }

  const shouldShowForgetPin = () => {
    if (actionType === 'PinVerified') return true
    if (!isSettingNewPin && selectedUser?.isLocked) return true
    if (isChangingPin && !showNewPin) return true
    return false
  }

  return (
    <>
      <SimpleModal
        isOpen={isOpen}
        onClose={handleCancel}
        title={getTitle()}
        size="md"
        centered
        actions={[
          {
            title: t('cancel') || 'Cancel',
            onClick: handleCancel,
            color: 'secondary',
            disabled: isPending,
          },
          ...(shouldShowBackButton()
            ? [
                {
                  title: t('back') || 'Back',
                  onClick: handleBack,
                  color: 'secondary',
                  disabled: isPending,
                  autoClose: false,
                },
              ]
            : []),
          {
            title: getButtonText(),
            onClick: handleContinue,
            color: 'primary',
            disabled: isPending || !canConfirm(),
            autoClose: false,
          },
        ]}
        closeOnBackdrop={false}
      >
        <div className="lock-chat-modal-content">
          <div className="lock-chat-info">
            {isChangingPin
              ? 'Update your PIN to enhance security'
              : isSettingNewPin
              ? 'Your PIN will be used to lock and unlock chats'
              : 'This will keep your chat locked and hidden'}
            <p className="pt-2">{getDescription()}</p>
          </div>

          <div className="lock-chat-pin-container">
            {Array.from({ length: pinLength }).map((_, index) => (
              <input
                key={index}
                ref={setInputRef(index)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={currentPin[index] || ''}
                onChange={(e) => handlePinChange(index, e.target.value, currentField)}
                onKeyDown={(e) => handleKeyDown(index, e, currentField)}
                onPaste={(e) => handlePaste(e, currentField)}
                disabled={isPending}
                className={`lock-chat-pin-input ${pinLength === 6 ? 'pin-six' : ''} ${
                  currentPin[index] ? 'filled' : ''
                }`}
              />
            ))}
          </div>

          {error && <div className="lock-chat-error">{error}</div>}

          {((isSettingNewPin && !showConfirmPin) || (isChangingPin && showNewPin && !showConfirmPin)) && (
            <button type="button" onClick={togglePinLength} className="lock-chat-toggle-btn">
              Use {pinLength === 4 ? '6' : '4'} digit PIN
            </button>
          )}

          {shouldShowForgetPin() && (
            <button type="button" onClick={handleForgetPin} className="lock-chat-forget-pin-btn" disabled={isPending}>
              Forget PIN?
            </button>
          )}
        </div>
      </SimpleModal>

      <ForgetPinModal
        isOpen={showForgetPinModal}
        onClose={() => setShowForgetPinModal(false)}
        onSuccess={handleForgetPinSuccess}
      />
    </>
  )
}

export default LockChatModal
