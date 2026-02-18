import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useQueryClient } from '@tanstack/react-query'
import { KEYS } from '../../../../../../constants/keys'
import { mutations } from '../../../../../../api'
import SimpleModal from '../../../../../../shared/modal/SimpleModal'
import { toaster } from '../../../../../../utils/custom-functions'
import { Button, Input, Label } from 'reactstrap'

interface ForgetPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Step = 'identifier' | 'otp' | 'newPin'

interface IdentifierFormValues {
  identifierType: 'email' | 'phone'
}

const ForgetPinModal: React.FC<ForgetPinModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [currentStep, setCurrentStep] = useState<Step>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [newPin, setNewPin] = useState<string[]>([])
  const [pinLength, setPinLength] = useState<number>(4)
  const [error, setError] = useState('')
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([])
  const { mutate: forgetPin, isPending: isForgetPending } = mutations.useForgetChatLockPin()
  const { mutate: verifyOtp, isPending: isVerifyPending } = mutations.useVerifyChatLockPinOtp()
  const { mutate: resetPin, isPending: isResetPending } = mutations.useResetChatLockPin()

  const isPending = isForgetPending || isVerifyPending || isResetPending

  const initialValues: IdentifierFormValues = {
    identifierType: 'email',
  }

  const identifierValidationSchema = Yup.object().shape({
    identifierType: Yup.string()
      .oneOf(['email', 'phone'], 'Please select email or phone')
      .required('Please select an option'),
  })

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('identifier')
      setIdentifier('')
      setOtp(Array(6).fill(''))
      setNewPin(Array(pinLength).fill(''))
      setPinLength(4)
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    setNewPin(Array(pinLength).fill(''))
  }, [pinLength])

  useEffect(() => {
    if (isOpen && currentStep === 'otp') {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen, currentStep])

  useEffect(() => {
    if (isOpen && currentStep === 'newPin') {
      setTimeout(() => {
        pinInputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen, currentStep, pinLength])

  const setOtpInputRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      otpInputRefs.current[index] = el
    },
    [],
  )

  const setPinInputRef = useCallback(
    (index: number) => (el: HTMLInputElement | null) => {
      pinInputRefs.current[index] = el
    },
    [],
  )

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = Array(6).fill('')

    pastedData.split('').forEach((digit, index) => {
      if (index < 6) {
        newOtp[index] = digit
      }
    })

    setOtp(newOtp)

    const nextEmptyIndex = newOtp.findIndex((val) => !val)
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    otpInputRefs.current[focusIndex]?.focus()
  }

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newPinArray = [...newPin]
    newPinArray[index] = value.slice(-1)
    setNewPin(newPinArray)

    if (value && index < pinLength - 1) {
      pinInputRefs.current[index + 1]?.focus()
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !newPin[index] && index > 0) {
      pinInputRefs.current[index - 1]?.focus()
    }
  }

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, pinLength)
    const newPinArray = Array(pinLength).fill('')

    pastedData.split('').forEach((digit, index) => {
      if (index < pinLength) {
        newPinArray[index] = digit
      }
    })

    setNewPin(newPinArray)

    const nextEmptyIndex = newPinArray.findIndex((val) => !val)
    const focusIndex = nextEmptyIndex === -1 ? pinLength - 1 : nextEmptyIndex
    pinInputRefs.current[focusIndex]?.focus()
  }

  const togglePinLength = () => {
    setPinLength(pinLength === 4 ? 6 : 4)
  }

  const handleIdentifierSubmit = (values: IdentifierFormValues) => {
    // Pass "email" or "phone" as identifier
    const identifierValue = values.identifierType

    setError('')
    setIdentifier(identifierValue)

    forgetPin(
      { identifier: identifierValue },
      {
        onSuccess: (data) => {
          toaster('success', data.message || 'OTP sent successfully')
          setCurrentStep('otp')
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.message || 'Failed to send OTP'
          setError(errorMsg)
        },
      },
    )
  }

  const handleOtpSubmit = () => {
    const otpValue = otp.join('')

    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP')
      return
    }

    setError('')
    verifyOtp(
      { identifier: identifier, otp: parseInt(otpValue) },
      {
        onSuccess: (data) => {
          toaster('success', data.message || 'OTP verified successfully')
          setCurrentStep('newPin')
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.message || 'Invalid OTP'
          setError(errorMsg)
          setOtp(Array(6).fill(''))
          setTimeout(() => {
            otpInputRefs.current[0]?.focus()
          }, 0)
        },
      },
    )
  }

  const handleNewPinSubmit = () => {
    const pinValue = newPin.join('')

    if (pinValue.length !== pinLength) {
      setError(`Please enter the complete ${pinLength}-digit PIN`)
      return
    }

    setError('')
    resetPin(
      { identifier: identifier, digit: pinLength, new_pin: parseInt(pinValue) },
      {
        onSuccess: (data) => {
          toaster('success', data.message || 'PIN reset successfully')
          queryClient.invalidateQueries({ queryKey: [KEYS.ALL_USER_SETTINGS] })
          onSuccess?.()
          onClose()
        },
        onError: (err: any) => {
          const errorMsg = err?.response?.data?.message || 'Failed to reset PIN'
          setError(errorMsg)
          setNewPin(Array(pinLength).fill(''))
          setTimeout(() => {
            pinInputRefs.current[0]?.focus()
          }, 0)
        },
      },
    )
  }

  const handleBack = () => {
    setError('')
    if (currentStep === 'otp') {
      setCurrentStep('identifier')
      setOtp(Array(6).fill(''))
    } else if (currentStep === 'newPin') {
      setCurrentStep('otp')
      setNewPin(Array(pinLength).fill(''))
    }
  }

  const handleCancel = () => {
    setError('')
    onClose()
  }

  const getTitle = () => {
    switch (currentStep) {
      case 'identifier':
        return t('Forget PIN')
      case 'otp':
        return t('Verify OTP')
      case 'newPin':
        return t('Create New PIN')
      default:
        return t('Forget PIN')
    }
  }

  const getDescription = () => {
    switch (currentStep) {
      case 'identifier':
        return 'Enter your email or phone number to receive an OTP'
      case 'otp':
        return `Enter the 6-digit OTP sent to your ${identifier === 'email' ? 'email' : 'phone'}`
      case 'newPin':
        return `Create a new ${pinLength}-digit PIN for your chat lock`
      default:
        return ''
    }
  }

  const canContinue = () => {
    switch (currentStep) {
      case 'otp':
        return otp.every((digit) => digit !== '')
      case 'newPin':
        return newPin.every((digit) => digit !== '') && newPin.length === pinLength
      default:
        return false
    }
  }

  const handleContinue = () => {
    switch (currentStep) {
      case 'otp':
        handleOtpSubmit()
        break
      case 'newPin':
        handleNewPinSubmit()
        break
    }
  }

  const getButtonText = () => {
    switch (currentStep) {
      case 'identifier':
        return t('send_otp') || 'Send OTP'
      case 'otp':
        return t('verify') || 'Verify'
      case 'newPin':
        return t('reset_pin') || 'Reset PIN'
      default:
        return t('continue') || 'Continue'
    }
  }

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={getTitle()}
      size="md"
      centered
      actions={
        currentStep === 'identifier'
          ? [] // No actions for identifier step, handled by form submit
          : [
              {
                title: t('cancel') || 'Cancel',
                onClick: handleCancel,
                color: 'secondary',
                disabled: isPending,
              },
              {
                title: t('back') || 'Back',
                onClick: handleBack,
                color: 'secondary',
                disabled: isPending,
                autoClose: false,
              },
              {
                title: getButtonText(),
                onClick: handleContinue,
                color: 'primary',
                disabled: isPending || !canContinue(),
                autoClose: false,
              },
            ]
      }
      closeOnBackdrop={false}
      className="forget-pin-modal"
    >
      <div className={`lock-chat-modal-content ${currentStep === 'identifier' ? 'align-items-stretch' : ''} p-0`}>
        <div className="lock-chat-info mb-2">
          <p className="pb-0 mb-0">{getDescription()}</p>
        </div>

        {currentStep === 'identifier' && (
          <>
            <Formik
              initialValues={initialValues}
              validationSchema={identifierValidationSchema}
              validateOnBlur={true}
              validateOnChange={false}
              onSubmit={handleIdentifierSubmit}
            >
              {({ handleSubmit, isSubmitting, values, setFieldValue }) => (
                <div>
                  <div className="delete-options form-group d-flex justify-content-center align-items-center gap-4 py-4 mb-0">
                    <Label
                      className={`delete-option d-flex align-items-center gap-2 ${
                        values.identifierType == 'email' ? 'selected' : ''
                      }`}
                    >
                      <Input
                        type="radio"
                        name="identifierType"
                        value="email"
                        checked={values.identifierType === 'email'}
                        onChange={() => setFieldValue('identifierType', 'email')}
                        className="form-check-input mt-0"
                      />
                      <span className="form-check-label fw-medium">{t('email_address') || 'Email'}</span>
                    </Label>
                    <Label
                      className={`delete-option d-flex align-items-center gap-2 ${
                        values.identifierType == 'phone' ? 'selected' : ''
                      }`}
                    >
                      <Input
                        type="radio"
                        name="identifierType"
                        value="phone"
                        checked={values.identifierType === 'phone'}
                        onChange={() => setFieldValue('identifierType', 'phone')}
                        className="form-check-input mt-0"
                      />
                      <span className="form-check-label fw-medium">{t('phone_number') || 'Phone'}</span>
                    </Label>
                  </div>

                  <div className="d-flex gap-2 justify-content-end mt-3">
                    <Button type="button" color="secondary" onClick={handleCancel} disabled={isPending || isSubmitting}>
                      {t('cancel') || 'Cancel'}
                    </Button>
                    <Button type="button" color="primary" onClick={() => handleSubmit()}>
                      {getButtonText()}
                    </Button>
                  </div>
                </div>
              )}
            </Formik>
          </>
        )}

        {currentStep === 'otp' && (
          <div className="lock-chat-pin-container">
            {Array.from({ length: 6 }).map((_, index) => (
              <input
                key={index}
                ref={setOtpInputRef(index)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[index] || ''}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                onPaste={handleOtpPaste}
                disabled={isPending}
                className={`lock-chat-pin-input pin-six ${otp[index] ? 'filled' : ''}`}
              />
            ))}
          </div>
        )}

        {currentStep === 'newPin' && (
          <>
            <div className="lock-chat-pin-container">
              {Array.from({ length: pinLength }).map((_, index) => (
                <input
                  key={index}
                  ref={setPinInputRef(index)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={newPin[index] || ''}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  onPaste={handlePinPaste}
                  disabled={isPending}
                  className={`lock-chat-pin-input ${pinLength === 6 ? 'pin-six' : ''} ${newPin[index] ? 'filled' : ''}`}
                />
              ))}
            </div>

            <button type="button" onClick={togglePinLength} className="lock-chat-toggle-btn">
              Use {pinLength === 4 ? '6' : '4'} digit PIN
            </button>
          </>
        )}

        {error && <div className="lock-chat-error mt-2">{error}</div>}
      </div>
    </SimpleModal>
  )
}

export default ForgetPinModal
