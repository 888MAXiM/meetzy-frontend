import { Formik } from 'formik'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Form } from 'reactstrap'
import { mutations } from '../../api'
import { useAppSelector } from '../../redux/hooks'
import { setIdentifier } from '../../redux/reducers/authSlice'
import { SolidButton } from '../../shared/button'
import PhoneInput from '../../shared/form-fields/PhoneInput'
import TextInput from '../../shared/form-fields/TextInput'
import type { RegisterCredentials } from '../../types/auth'
import { toaster } from '../../utils/custom-functions'
import { emailPhoneSchema } from '../../utils/validationSchemas'
import LinkIdentifierOtp from './LinkIdentifierOtp'

const LinkIdentifier = () => {
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [mode, setMode] = useState('link')
  const [oldIdentifier, setOldIdentifier] = useState('link')
  const { auth_method, login_method } = useAppSelector((state) => state.settings)
  const { mutate: linkIdentifier } = mutations.useLinkIdentifier()

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
    if (auth_method !== 'email') {
      payload.old_identifier = values.email
    }
    if (auth_method !== 'phone') {
      payload.old_identifier = `+${values.countryCode}${values.phone}`
    }
    if (auth_method == 'email') {
      payload.new_email = values.email
    }
    if (auth_method == 'phone') {
      payload.new_phone = values.phone
      payload.country_code = `+${values.countryCode}`
    }

    linkIdentifier(payload, {
      onSettled: () => setLoading(false),
      onSuccess: (data) => {
        toaster('success', data.message)
        setOldIdentifier(payload.old_identifier)
        dispatch(setIdentifier(payload.new_email || payload.country_code + payload.new_phone))
        setMode('otp')
      },
    })
  }

  return (
    <>
      {mode == 'link' ? (
        <Formik
          initialValues={initialValues}
          validationSchema={emailPhoneSchema}
          validateOnBlur={true}
          validateOnChange={false}
          onSubmit={handleSubmit}
          context={{ auth_method, login_method }}
        >
          {({ handleSubmit }) => (
            <Form className="form2" onSubmit={handleSubmit}>
              <div className={`${auth_method == 'email' ? 'link-identifier' : ''}`}>
                <TextInput
                  name="email"
                  type="email"
                  label={t(auth_method == 'email' ? 'link_email_address' : 'email_address')}
                  placeholder={t('enter_email')}
                  formGroupClass="form-group"
                  labelClass="col-form-label"
                  iconProps={{ iconId: 'email', className: 'email-icon' }}
                />

                <PhoneInput
                  label={t(auth_method == 'phone' ? 'link_phone_number' : 'phone_number')}
                  codeName="countryCode"
                  phoneName="phone"
                  formGroupClass="form-group"
                  xs1="4"
                  xs2="8"
                />
              </div>
              <div className="form-group mb-0">
                <SolidButton
                  color="primary"
                  title={t(auth_method == 'phone' ? 'link_phone_number' : 'link_email')}
                  className="button-effect w-100"
                  type="submit"
                  loading={loading}
                />
              </div>
            </Form>
          )}
        </Formik>
      ) : (
        <LinkIdentifierOtp old_identifier={oldIdentifier} setMode={setMode} keyType="identifier" />
      )}
    </>
  )
}

export default LinkIdentifier
