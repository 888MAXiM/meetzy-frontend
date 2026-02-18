import { Formik, type FormikHelpers } from 'formik'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Form } from 'reactstrap'
import { mutations, queries } from '../../api'
import { ROUTES } from '../../constants/route'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import { SolidButton } from '../../shared/button'
import OtpInput from '../../shared/form-fields/OtpInput'
import type { OtpPayload } from '../../types/api'
import { getStorage } from '../../utils'
import { toaster } from '../../utils/custom-functions'
import { otpSchema } from '../../utils/validationSchemas'
import AuthWrapper from '../common/AuthWrapper'

const VerifyOtpContainer = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const storage = getStorage()
  const coolDownSeconds = 60
  const otpDigits = 6
  const forgotPasswordEmail = (storage.getItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL) as string) || null
  const { data: demoData } = queries.useGetDemoStatus()
  const isDemoMode = demoData?.demo === true

  const demoOtp = '123456'
  const initialOtpValues = isDemoMode ? demoOtp.split('') : Array(otpDigits).fill('')
  const [otpValues, setOtpValues] = useState<string[]>(initialOtpValues)
  const [resendDisabled, setResendDisabled] = useState(false)
  const [coolDown, setCoolDown] = useState(0)

  const { mutate: verifyOtp, isPending } = mutations.useVerifyOtp()
  const { mutate: resendOtp, isPending: resendOtpLoading } = mutations.useResendOtp()

  useEffect(() => {
    if (!forgotPasswordEmail) {
      navigate(ROUTES.ForgotPassword)
      return
    }

    const lastSent = storage.getItem(STORAGE_KEYS.RESEND_COUNTDOWN_KEY)
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSent as string, 10)) / 1000)
      if (elapsed < coolDownSeconds) {
        const remaining = coolDownSeconds - elapsed
        setCoolDown(remaining)
        setResendDisabled(true)

        const interval = setInterval(() => {
          setCoolDown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              setResendDisabled(false)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        return () => clearInterval(interval)
      }
    }
  }, [forgotPasswordEmail, navigate, storage])

  useEffect(() => {
    if (isDemoMode) {
      setOtpValues(demoOtp.split(''))
    } else {
      setOtpValues(Array(otpDigits).fill(''))
    }
  }, [isDemoMode])

  const handleSubmit = async (values: OtpPayload, _formikHelpers: FormikHelpers<OtpPayload>) => {
    if (!forgotPasswordEmail) {
      toaster('error', 'Email not found. Please try again.')
      navigate(ROUTES.ForgotPassword)
      return
    }

    // Bypass backend verification in demo mode if OTP is 123456
    if (isDemoMode && values.otp === demoOtp) { 
      verifyOtp(
        {
          identifier: forgotPasswordEmail,
          otp: values.otp,
        },
        {
          onSuccess: () => {
            storage.setItem(STORAGE_KEYS.OTP, values.otp)
            toaster('success', 'OTP verified successfully')
            navigate(ROUTES.ResetPassword)
          },
        },
      )
      return
    }
  }

  const handleResendOtp = () => {
    if (!forgotPasswordEmail) {
      toaster('error', 'Email not found. Please restart the process.')
      return
    }

    setResendDisabled(true)

    resendOtp(
      { identifier: forgotPasswordEmail },
      {
        onSuccess: () => {
          const now = Date.now()
          storage.setItem(STORAGE_KEYS.RESEND_COUNTDOWN_KEY, now.toString())
          setCoolDown(coolDownSeconds)
          if (!isDemoMode) {
            toaster('success', 'OTP resent successfully')
          }
          setOtpValues(Array(otpDigits).fill(''))

          const interval = setInterval(() => {
            setCoolDown((prev) => {
              if (prev <= 1) {
                clearInterval(interval)
                setResendDisabled(false)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        },
        onError: () => {
          setResendDisabled(false)
        },
      },
    )
  }

  return (
    <AuthWrapper heading="verify_otp" subHeading="sent_otp" back={ROUTES.ForgotPassword}>
      <Formik<OtpPayload>
        initialValues={{ otp: isDemoMode ? demoOtp : '' }}
        validationSchema={otpSchema}
        onSubmit={handleSubmit}
        validateOnBlur={false}
      >
        {({ setFieldValue, handleSubmit: formikHandleSubmit }) => (
          <Form className="form2 otp-form" onSubmit={formikHandleSubmit}>
            <div className="form-group">
              <OtpInput
                submitForm={(values, helpers) => handleSubmit(values, helpers)}
                val={otpValues}
                setVal={(val: string[]) => {
                  setOtpValues(val)
                  setFieldValue('otp', val.join(''))
                }}
                digits={otpDigits}
              />
              {isDemoMode && (
                <p className="text-center mt-2 mb-0 demo-text">
                  App in demo mode. User OTP: <strong>{demoOtp}</strong>
                </p>
              )}
            </div>

            {!isDemoMode && (
              <div className="form-group text-center mb-0">
                <p>
                  {t('didnt_receive_otp')}?{' '}
                  <a
                    role="button"
                    className={`resend link-text ${resendDisabled ? 'disabled' : ''}`}
                    onClick={!resendDisabled ? handleResendOtp : undefined}
                    style={{
                      cursor: resendDisabled ? 'not-allowed' : 'pointer',
                      opacity: resendDisabled ? 0.6 : 1,
                    }}
                  >
                    {resendDisabled && !resendOtpLoading
                      ? `Resend in ${coolDown}s`
                      : resendOtpLoading
                      ? 'Resending...'
                      : 'Resend OTP'}
                  </a>
                </p>
              </div>
            )}

            <div className="form-group mb-0">
              <SolidButton
                loading={isPending}
                title={t('verify_otp')}
                type="submit"
                color="primary"
                className="button-effect w-100"
              />
            </div>
          </Form>
        )}
      </Formik>
    </AuthWrapper>
  )
}

export default VerifyOtpContainer
