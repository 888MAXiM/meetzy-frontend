import { Formik } from 'formik'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { Button, Form } from 'reactstrap'
import { ROUTES } from '../../constants/route'
import { useAppSelector } from '../../redux/hooks'
import { setIdentifier } from '../../redux/reducers/authSlice'
import { SolidButton } from '../../shared/button'
import PhoneInput from '../../shared/form-fields/PhoneInput'
import TextInput from '../../shared/form-fields/TextInput'
import type { CombinedErrorResponse } from '../../types/api'
import type { RegisterCredentials, SignupFormProps } from '../../types/auth'
import { toaster } from '../../utils/custom-functions'
import { useCountry } from '../../utils/useCountry'
import { signupValidation } from '../../utils/validationSchemas'

const SignupForm = ({ registerMutate, navigate }: SignupFormProps) => {
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const { getCountryNameByCode } = useCountry()
  const { auth_method, login_method } = useAppSelector((state) => state.settings)
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>(auth_method === 'phone' ? 'phone' : 'email')

  const initialValues: RegisterCredentials = {
    name: '',
    email: '',
    password: '',
    phone: '',
    countryCode: '91',
  }

  const handleSubmit = async (values: RegisterCredentials) => {
    setLoading(true)
    const countryName = getCountryNameByCode(values.countryCode)

    const payload: any = {
      name: values.name,
    }

    // Determine which auth method to use
    const currentAuthMethod = auth_method === 'both' ? activeTab : auth_method

    if (currentAuthMethod === 'email') {
      payload.email = values.email
    }

    if (currentAuthMethod === 'phone') {
      payload.phone = values.phone
      payload.countryCode = `+${values.countryCode}`
      payload.country = countryName
    }

    if (login_method === 'password' || login_method === 'both') {
      payload.password = values.password
    }

    registerMutate(payload, {
      onSettled: () => setLoading(false),
      onSuccess: () => {
        toaster('success', 'Registration successful! Please login.')
        navigate(ROUTES.Login)
        dispatch(setIdentifier(payload.email || payload.countryCode + payload.phone))
      },
      onError: (error: CombinedErrorResponse) => {
        console.error('Registration error:', error)
      },
    })
  }

  return (
    <>
      {/* Only show tabs when auth_method is 'both' */}
      {auth_method === 'both' && (
        <div className="auth-tabs mb-4 d-flex justify-content-center gap-3">
          <Button className={`auth-tab ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
            {t('email')}
          </Button>

          <Button className={`auth-tab ${activeTab === 'phone' ? 'active' : ''}`} onClick={() => setActiveTab('phone')}>
            {t('phone')}
          </Button>
        </div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={signupValidation}
        validateOnBlur={true}
        validateOnChange={false}
        onSubmit={handleSubmit}
        context={{ activeTab, login_method }}
      >
        {({ handleSubmit }) => (
          <Form className="form2" onSubmit={handleSubmit}>
            {/* Full Name - always shown */}
            <TextInput
              name="name"
              type="text"
              label={t('full_name')}
              placeholder={t('enter_name')}
              formGroupClass="form-group"
              labelClass="col-form-label"
              iconProps={{ iconId: 'users', className: 'email-icon' }}
            />

            {/* Email field - shown when auth_method is 'email' OR when auth_method is 'both' and email tab is active */}
            {(auth_method === 'email' || (auth_method === 'both' && activeTab === 'email')) && (
              <TextInput
                name="email"
                type="email"
                label={t('email_address')}
                placeholder={t('enter_email')}
                formGroupClass="form-group"
                labelClass="col-form-label"
                iconProps={{ iconId: 'email', className: 'email-icon' }}
              />
            )}

            {/* Phone field - shown when auth_method is 'phone' OR when auth_method is 'both' and phone tab is active */}
            {(auth_method === 'phone' || (auth_method === 'both' && activeTab === 'phone')) && (
              <PhoneInput
                label={t('phone_number')}
                codeName="countryCode"
                phoneName="phone"
                formGroupClass="form-group"
                xs1="4"
                xs2="8"
                containerClass="signup-input"
              />
            )}

            {/* Password field - shown based on login_method */}
            {(login_method === 'password' || login_method === 'both') && (
              <TextInput
                name="password"
                type="password"
                label={t(login_method == 'both' ? 'password_optional' : 'Password')}
                placeholder={t('enter_password')}
                formGroupClass="form-group"
                labelClass="col-form-label"
                iconProps={{ iconId: 'password', className: 'lock-icon' }}
              />
            )}

            <div className="form-group mb-0">
              <SolidButton
                color="primary"
                title={t('signup')}
                className="button-effect w-100"
                type="submit"
                loading={loading}
              />
            </div>

            <div className="text-center mt-3">
              <p className="mb-0">
                {t('already_have_an_account')}
                <Link to={ROUTES.Login} className="font-primary">
                  {t('login')}
                </Link>
              </p>
            </div>
          </Form>
        )}
      </Formik>
    </>
  )
}

export default SignupForm
