import { Form, Formik } from 'formik'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import mutations from '../../api/mutations'
import { ROUTES } from '../../constants/route'
import { STORAGE_KEYS } from '../../constants/storageKeys'
import { useAppDispatch } from '../../redux/hooks'
import { clearForgotPasswordEmail } from '../../redux/reducers/authSlice'
import { SolidButton } from '../../shared/button/SolidButton'
import TextInput from '../../shared/form-fields/TextInput'
import { SvgIcon } from '../../shared/icons'
import type { ResetPasswordFormValues } from '../../types/auth'
import { getStorage } from '../../utils'
import { toaster } from '../../utils/custom-functions'
import { confirmPasswordSchema } from '../../utils/validationSchemas'
import AuthWrapper from '../common/AuthWrapper'

const NewPasswordForm = () => {
  const { t } = useTranslation()
  const storage = getStorage()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { mutate: resetPassword, isPending } = mutations.useResetPassword()

  const handleSubmit = (values: ResetPasswordFormValues) => {
    const email = storage.getItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL) as string
    const otp = storage.getItem(STORAGE_KEYS.OTP) as string

    if (!otp || !email) {
      toaster('error', 'Invalid OTP or email. Please try again.')
      navigate(ROUTES.ForgotPassword)
      return
    }

    resetPassword(
      {
        otp: otp,
        new_password: values.password,
        identifier: email,
      },
      {
        onSuccess: () => {
          toaster('success', 'Password reset successfully. You can now login.')
          dispatch(clearForgotPasswordEmail())
          storage.removeItem(STORAGE_KEYS.OTP)
          storage.removeItem(STORAGE_KEYS.FORGOT_PASSWORD_EMAIL)
          storage.removeItem(STORAGE_KEYS.RESEND_COUNTDOWN_KEY)
          navigate(ROUTES.Login)
        },
      },
    )
  }

  return (
    <AuthWrapper heading="set_new_password" subHeading="set_new_password_description" back={ROUTES.Login}>
      <div className="form2">
        <Formik
          initialValues={{
            password: '',
            confirm_password: '',
          }}
          validationSchema={confirmPasswordSchema}
          onSubmit={handleSubmit}
        >
          {() => (
            <Form className="login-form">
              <TextInput
                label={t('new_password')}
                iconProps={{ iconId: 'password', className: 'lock-icon' }}
                name="password"
                placeholder="*********"
                type="password"
                formGroupClass="form-group"
                labelClass="col-form-label"
              />
              <TextInput
                label={t('confirm_password')}
                iconProps={{ iconId: 'password', className: 'lock-icon' }}
                name="confirm_password"
                placeholder="*********"
                type="password"
                formGroupClass="form-group"
                labelClass="col-form-label"
              />

              <div className="security-info">
                <SvgIcon iconId="shield-check" className="w-5 h-5" />
                <span className="security-info-text">{t('security_info_text')}</span>
              </div>

              <SolidButton
                title={t('reset_password')}
                type="submit"
                color="primary"
                className={`w-100 Login-btn ${isPending ? 'loading' : ''}`}
                loading={isPending}
              />
            </Form>
          )}
        </Formik>
      </div>
    </AuthWrapper>
  )
}

export default NewPasswordForm
