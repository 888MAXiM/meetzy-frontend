import { Formik } from 'formik'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Button, Form } from 'reactstrap'
import { mutations } from '../../api'
import { useAppSelector } from '../../redux/hooks'
import { setIdentifier } from '../../redux/reducers/authSlice'
import { SolidButton } from '../../shared/button'
import PhoneInput from '../../shared/form-fields/PhoneInput'
import TextInput from '../../shared/form-fields/TextInput'
import type { RegisterCredentials } from '../../types/auth'
import { toaster } from '../../utils/custom-functions'
import { linkPasswordSchema } from '../../utils/validationSchemas'
import LinkIdentifierOtp from './LinkIdentifierOtp'

const LinkPassword = () => {
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [mode, setMode] = useState('link')
  const [oldIdentifier, setOldIdentifier] = useState('link')
  const [newPassword, setNewPassword] = useState()
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email')
  const { login_method } = useAppSelector((state) => state.settings)
  const { mutate: linkPassword } = mutations.useLinkPassword()

  const initialValues: RegisterCredentials = {
    name: '',
    email: '',
    password: '',
    phone: '',
    countryCode: '91',
  }

  const handleSubmit = async (values: RegisterCredentials) => {
    setLoading(true)

    const payload: any = {}
    if (activeTab == 'email') {
      payload.identifier = values.email
    }
    if (activeTab == 'phone') {
      payload.identifier = `+${values.countryCode}${values.phone}`
    }

    payload.new_password = values.password

    linkPassword(payload, {
      onSettled: () => setLoading(false),
      onSuccess: (data) => {
        toaster('success', data.message)
        setOldIdentifier(payload.identifier)
        setNewPassword(payload.new_password)
        dispatch(setIdentifier(payload.identifier))
        setMode('otp')
      },
    })
  }

  return (
    <>
      {mode == 'link' ? (
        <>
          <div className="auth-tabs mb-4 d-flex justify-content-center gap-3">
            <Button
              className={`auth-tab ${activeTab === 'email' ? 'active' : ''}`}
              onClick={() => setActiveTab('email')}
            >
              Email
            </Button>

            <Button
              className={`auth-tab ${activeTab === 'phone' ? 'active' : ''}`}
              onClick={() => setActiveTab('phone')}
            >
              Phone
            </Button>
          </div>
          <Formik
            initialValues={initialValues}
            validationSchema={linkPasswordSchema}
            validateOnBlur={true}
            validateOnChange={false}
            onSubmit={handleSubmit}
            context={{ activeTab, login_method }}
          >
            {({ handleSubmit }) => (
              <Form className="form2" onSubmit={handleSubmit}>
                {activeTab == 'email' && (
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

                {activeTab === 'phone' && (
                  <PhoneInput
                    label={t('phone_number')}
                    codeName="countryCode"
                    phoneName="phone"
                    formGroupClass="form-group"
                    xs1="4"
                    xs2="8"
                  />
                )}

                <TextInput
                  name="password"
                  type="password"
                  label={t('link_password')}
                  placeholder={t('enter_password')}
                  formGroupClass="form-group"
                  labelClass="col-form-label"
                  iconProps={{ iconId: 'password', className: 'lock-icon' }}
                />

                <div className="form-group mb-0">
                  <SolidButton
                    color="primary"
                    title={t('signup')}
                    className="button-effect w-100"
                    type="submit"
                    loading={loading}
                  />
                </div>
              </Form>
            )}
          </Formik>
        </>
      ) : (
        <LinkIdentifierOtp
          old_identifier={oldIdentifier}
          setMode={setMode}
          newPassword={newPassword}
          keyType="password"
        />
      )}
    </>
  )
}

export default LinkPassword
