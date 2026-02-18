import { Form, Formik, type FormikHelpers } from 'formik'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from 'reactstrap'
import mutations from '../../api/mutations'
import { ROUTES } from '../../constants/route'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setForgotPasswordEmail } from '../../redux/reducers/authSlice'
import { SolidButton } from '../../shared/button/SolidButton'
import PhoneInput from '../../shared/form-fields/PhoneInput'
import TextInput from '../../shared/form-fields/TextInput'
import type { EmailPayload } from '../../types/api'
import { toaster } from '../../utils/custom-functions'
import { forgotPasswordSchema } from '../../utils/validationSchemas'
import AuthWrapper from '../common/AuthWrapper'

const ForgotPasswordContainer = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { mutate: requestPin, isPending } = mutations.useForgotPassword()
  const { auth_method, login_method } = useAppSelector((state) => state.settings)
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>(auth_method === 'phone' ? 'phone' : 'email')

  const handleSubmit = async (values: EmailPayload, { resetForm }: FormikHelpers<EmailPayload>) => {
    requestPin(
      { identifier: values?.email || '+' + values.countryCode + values.phone },
      {
        onSuccess: () => {
          dispatch(setForgotPasswordEmail(values.email || '+' + values.countryCode + values.phone))
          toaster('success', 'Otp sent successfully')
          navigate(ROUTES.VerifyOtp)
          resetForm()
        },
      },
    )
  }

  const initialValues: EmailPayload = {
    email: '',
    phone: '',
    countryCode: '91',
  }

  return (
    <AuthWrapper heading="forgot_password" subHeading="enter_email_address" back={ROUTES.Login}>
      {auth_method === 'both' && (
        <div className="auth-tabs mb-4 d-flex justify-content-center gap-3">
          <Button className={`auth-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
            Email
          </Button>

          <Button className={`auth-tab ${activeTab === 'phone' ? 'active' : ''}`} onClick={() => setActiveTab('phone')}>
            Phone
          </Button>
        </div>
      )}
      <Formik
        initialValues={initialValues}
        validationSchema={forgotPasswordSchema}
        onSubmit={handleSubmit}
        validateOnBlur={true}
        validateOnChange={false}
        context={{ activeTab, login_method }}
      >
        {() => (
          <Form className="form2">
            <div className="form-group">
              {(auth_method === 'email' || (auth_method === 'both' && activeTab === 'email')) && (
                <TextInput
                  label={t('email_address')}
                  containerClass="login-input email-input"
                  iconProps={{ iconId: 'email', className: 'email-icon' }}
                  name="email"
                  type="email"
                  placeholder="admin@example.com"
                />
              )}
              {(auth_method === 'phone' || (auth_method === 'both' && activeTab === 'phone')) && (
                <PhoneInput
                  label={t('phone_number')}
                  codeName="countryCode"
                  phoneName="phone"
                  formGroupClass="form-group"
                  xs1="4"
                  xs2="8"
                />
              )}
            </div>
            <div className="form-group mb-0">
              <SolidButton
                loading={isPending}
                title="Send"
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

export default ForgotPasswordContainer
