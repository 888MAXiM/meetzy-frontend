import { Formik, useFormikContext } from 'formik'
import { useEffect, useRef, useState } from 'react'
import { Lock, Mail, Phone } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { RiLoader2Fill, RiLoader2Line } from 'react-icons/ri'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Label } from 'reactstrap'
import { mutations, queries } from '../../api'
import { ROUTES } from '../../constants/route'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { loginSuccess, saveRememberMe, setIdentifier } from '../../redux/reducers/authSlice'
import OtpInput from '../../shared/form-fields/OtpInput'
import PhoneInput from '../../shared/form-fields/PhoneInput'
import TextInput from '../../shared/form-fields/TextInput'
import { SvgIcon } from '../../shared/icons'
import { LoginResponse, OTPInitResponse } from '../../types/auth'
import LoginTable from './Login'

type IdentifierType = 'email' | 'phone' | null
type LoginMode = 'password' | 'otp' | 'otp-verify'
type TabType = 'email' | 'phone'

// Separate component to handle Formik values with useEffect
const PhoneFormWatcher = ({ onChange }: { onChange: (values: { phone: string; country_code: string }) => void }) => {
  const { values } = useFormikContext<{ phone: string; country_code: string }>()

  useEffect(() => {
    onChange(values)
  }, [values.phone, values.country_code, onChange])

  return null
}

const LoginForm = () => {
  const { auth_method, login_method } = useAppSelector((state) => state.settings)
  const { rememberedCredentials } = useAppSelector((state) => state.auth)
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  // Initialize mutation hooks at component top level
  const loginWithPasswordMutation = mutations.useLoginWithPassword()
  const loginInitMutation = mutations.useLoginInit()
  const verifyLoginOtpMutation = mutations.useVerifyLoginOtp()

  // UI State with proper types
  const [mode, setMode] = useState<LoginMode>('password')
  const [activeTab, setActiveTab] = useState<TabType>('email')
  const [password, setPassword] = useState<string>('')
  const [countryCode, setCountryCode] = useState<string>('91')
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [, setIdentifierType] = useState<IdentifierType>(null)
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  const { data: demoData } = queries.useGetDemoStatus()
  const isDemoMode = demoData?.demo === true
  const formikPhoneRef = useRef<string>('')
  const formikCountryCodeRef = useRef<string>('91')
  const { identifier } = useAppSelector((state) => state.auth)
  const { allow_user_signup } = useAppSelector((state) => state.settings)

  // Initialize mode based on login_method from Redux
  useEffect(() => {
    if (login_method === 'otp') {
      setMode('otp')
    } else {
      setMode('password')
    }
  }, [login_method])

  useEffect(() => {
    if (rememberedCredentials.rememberMe) {
      setRememberMe(true)

      if (rememberedCredentials.password) {
        setPassword(rememberedCredentials.password)
      }

      if (rememberedCredentials.email) {
        dispatch(setIdentifier(rememberedCredentials.email))
        setActiveTab('email')
      } else if (rememberedCredentials.phone) {
        setPhoneNumber(rememberedCredentials.phone)
        setCountryCode(rememberedCredentials.countryCode)
        formikPhoneRef.current = rememberedCredentials.phone
        formikCountryCodeRef.current = rememberedCredentials.countryCode
        setActiveTab('phone')
      }
    }
  }, [rememberedCredentials, dispatch])

  // Validate identifier format with proper return type
  const validateIdentifier = (value: string): IdentifierType => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^\+?[1-9]\d{6,14}$/

    if (emailRegex.test(value)) return 'email'
    if (phoneRegex.test(value.replace(/\s/g, ''))) return 'phone'
    return null
  }

  // Handle identifier change with proper event type
  const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    dispatch(setIdentifier(value))
    setError('')

    if (auth_method === 'both') {
      const type = validateIdentifier(value)
      setIdentifierType(type)
    }
  }

  // Handle password login with proper error handling
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    let finalIdentifier = identifier

    if (auth_method === 'both') {
      if (activeTab === 'phone') {
        finalIdentifier = `+${formikCountryCodeRef.current}${formikPhoneRef.current}`
      } else {
        finalIdentifier = identifier
      }
    } else if (auth_method === 'phone') {
      finalIdentifier = `+${formikCountryCodeRef.current}${formikPhoneRef.current}`
    }

    if (!finalIdentifier || !password) {
      setError('Please enter both identifier and password')
      return
    }

    const type = validateIdentifier(finalIdentifier)

    if (auth_method === 'email' && type !== 'email') {
      setError('Please enter a valid email address')
      return
    }

    if (auth_method === 'phone' && type !== 'phone') {
      setError('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      const response = (await loginWithPasswordMutation.mutateAsync({
        identifier: finalIdentifier,
        password,
      })) as LoginResponse

      if (rememberMe) {
        const isPhoneLogin = auth_method === 'phone' || (auth_method === 'both' && activeTab === 'phone')

        if (isPhoneLogin) {
          dispatch(
            saveRememberMe({
              phone: formikPhoneRef.current,
              countryCode: formikCountryCodeRef.current,
              password: password,
              rememberMe: true,
            }),
          )
        } else {
          dispatch(
            saveRememberMe({
              email: identifier,
              password: password,
              rememberMe: true,
            }),
          )
        }
      } else {
        dispatch(
          saveRememberMe({
            rememberMe: false,
          }),
        )
      }

      if (response.message) {
        setSuccess(response.message)
      } else {
        setSuccess('Login successful!')
      }

      if (response.token && response.user) {
        dispatch(
          loginSuccess({
            token: response.token,
            user: response.user,
          }),
        )
      }

      navigate(ROUTES.Messenger)
    } catch (err: any) {
      console.error('Login Error:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Login failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    let finalIdentifier = identifier

    if (auth_method === 'both') {
      if (activeTab === 'phone') {
        finalIdentifier = `+${formikCountryCodeRef.current}${formikPhoneRef.current}`
      }
    } else if (auth_method === 'phone') {
      finalIdentifier = `+${formikCountryCodeRef.current}${formikPhoneRef.current}`
    }

    if (!finalIdentifier) {
      setError(
        'Please enter your ' +
          (auth_method === 'email' ? 'email' : auth_method === 'phone' ? 'phone number' : 'email or phone number'),
      )
      return
    }

    const type = validateIdentifier(finalIdentifier)

    if (!type) {
      setError('Please enter a valid email or phone number')
      return
    }

    if (auth_method === 'email' && type !== 'email') {
      setError('Email login only. Please enter a valid email address')
      return
    }

    if (auth_method === 'phone' && type !== 'phone') {
      setError('Phone login only. Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      const response = (await loginInitMutation.mutateAsync({ identifier: finalIdentifier })) as OTPInitResponse
      setIdentifierType(response.type as IdentifierType)
      dispatch(setIdentifier(finalIdentifier))
      setMode('otp-verify')
    } catch (err: any) {
      console.error('OTP Error:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to send OTP'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Handle verify OTP
  const handleVerifyOtp = async (values?: { otp: string }) => {
    setError('')
    setSuccess('')

    const otp = values?.otp || otpValues.join('')

    if (!otp || otp.length < 6) {
      setError('Please enter a valid OTP')
      return
    }

    setLoading(true)
    try {
      const response = (await verifyLoginOtpMutation.mutateAsync({ identifier, otp })) as LoginResponse

      if (response.message) {
        setSuccess(response.message)
      } else {
        setSuccess('OTP verified successfully!')
      }

      if (response.token && response.user) {
        dispatch(
          loginSuccess({
            token: response.token,
            user: response.user,
          }),
        )
      }

      navigate(ROUTES.Messenger)
    } catch (err: any) {
      console.error('Verify OTP Error:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Invalid OTP'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault()
    handleVerifyOtp()
  }

  const handleSetFieldValue = (field: string, value: any) => {
    if (field === 'identifier') {
      dispatch(setIdentifier(value))
    } else if (field === 'password') {
      setPassword(value)
    }
  }

  // Handler to update refs from Formik
  const handleFormikValuesChange = (values: { phone: string; country_code: string }) => {
    formikPhoneRef.current = values.phone
    formikCountryCodeRef.current = values.country_code
    setPhoneNumber(values.phone)
    setCountryCode(values.country_code)
  }

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {error && <div className="alert alert-error">{error}</div>}

        {success && <div className="alert alert-success">{success}</div>}

        {/* PASSWORD LOGIN MODE */}
        {mode === 'password' && login_method !== 'otp' && (
          <form className="form-content" onSubmit={handlePasswordLogin}>
            {/* Tabs for both email and phone */}
            {auth_method === 'both' && (
              <div className="auth-tabs d-flex justify-content-center gap-3 flex-wrap">
                <Button
                  type="button"
                  className={`auth-tab ${activeTab === 'email' ? 'active' : ''}`}
                  onClick={() => setActiveTab('email')}
                >
                  <Mail size={18} />
                  {t('email')}
                </Button>
                <Button
                  type="button"
                  className={`auth-tab ${activeTab === 'phone' ? 'active' : ''}`}
                  onClick={() => setActiveTab('phone')}
                >
                  <Phone size={18} />
                  {t('phone')}
                </Button>
              </div>
            )}

            {/* Email Tab Content */}
            {(auth_method === 'email' || (auth_method === 'both' && activeTab === 'email')) && (
              <>
                <div className="form-group">
                  <label className="form-label">{t('email')}</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      value={identifier}
                      onChange={handleIdentifierChange}
                      placeholder={t('enter_email')}
                      className="form-input"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Phone Tab Content */}
            {(auth_method === 'phone' || (auth_method === 'both' && activeTab === 'phone')) && (
              <Formik
                initialValues={{
                  country_code: countryCode,
                  phone: phoneNumber,
                }}
                onSubmit={() => {}}
                enableReinitialize
              >
                <div>
                  <PhoneFormWatcher onChange={handleFormikValuesChange} />
                  <PhoneInput
                    label="phone_number"
                    name="phone"
                    codeName="country_code"
                    xs1="4"
                    xs2="8"
                    containerClass="mb-sm-2 login-input"
                  />
                </div>
              </Formik>
            )}
            <div className="form-group mt-2">
              <label className="form-label">{t('password')}</label>
              <div className="input-wrapper">
                <Lock className="input-icon" />
                <TextInput
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  placeholder={t('enter_password')}
                  iconProps={{ iconId: 'password', className: 'lock-icon' }}
                  noWrapper
                />
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center">
              <div className="form-check">
                <Input
                  type="checkbox"
                  className="form-check-input"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <Label check htmlFor="rememberMe">
                  {t('remember_me')}?
                </Label>
              </div>
              <Link to={ROUTES.ForgotPassword}>{t('forgot_password')}?</Link>
            </div>

            <div className="w-100 d-flex align-items-center gap-2 flex-wrap">
              <button type="submit" disabled={loading} className="btn btn-primary flex-grow-1">
                {loading ? (
                  <>
                    <RiLoader2Fill className="btn-icon animate-spin" />
                    Logging in...
                  </>
                ) : (
                  t('login')
                )}
              </button>

              {login_method === 'both' && (
                <button
                  type="button"
                  onClick={() => setMode('otp')}
                  className="btn btn-outline-primary flex-grow-1 mt-0"
                >
                  {t('login_with_OTP')}
                </button>
              )}
            </div>
          </form>
        )}

        {/* OTP REQUEST MODE */}
        {mode === 'otp' && (
          <form className="form-content" onSubmit={handleSendOtp}>
            {auth_method === 'both' && (
              <div className="auth-tabs flex-wrap">
                <Button
                  type="button"
                  className={`auth-tab ${activeTab === 'email' ? 'active' : ''}`}
                  onClick={() => setActiveTab('email')}
                >
                  <Mail size={18} />
                  {t('email')}
                </Button>
                <Button
                  type="button"
                  className={`auth-tab ${activeTab === 'phone' ? 'active' : ''}`}
                  onClick={() => setActiveTab('phone')}
                >
                  <Phone size={18} />
                  {t('phone')}
                </Button>
              </div>
            )}

            {/* Email Input */}
            {(auth_method === 'email' || (auth_method === 'both' && activeTab === 'email')) && (
              <div className="form-group">
                <div className="input-wrapper">
                  <Mail className="input-icon" />
                  <input
                    type="email"
                    value={identifier}
                    onChange={handleIdentifierChange}
                    placeholder={t('enter_email')}
                    className="form-input"
                  />
                </div>
              </div>
            )}

            {/* Phone Input */}
            {(auth_method === 'phone' || (auth_method === 'both' && activeTab === 'phone')) && (
              <Formik
                initialValues={{
                  country_code: countryCode,
                  phone: phoneNumber,
                }}
                onSubmit={() => {}}
                enableReinitialize
              >
                <div>
                  <PhoneFormWatcher onChange={handleFormikValuesChange} />
                  <PhoneInput
                    name="phone"
                    codeName="country_code"
                    xs1="4"
                    xs2="8"
                    containerClass="mb-sm-2 login-input-phone"
                  />
                </div>
              </Formik>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary mt-2">
              {loading ? (
                <>
                  <RiLoader2Fill className="btn-icon animate-spin" />
                  Sending OTP...
                </>
              ) : (
                t('send_OTP')
              )}
            </button>

            {login_method === 'both' && (
              <div onClick={() => setMode('password')} className="btn btn-link back-btn-badge">
                <SvgIcon className="back-btn-icon" iconId="back-arrow-icon" />
              </div>
            )}
          </form>
        )}

        {/* OTP VERIFICATION MODE */}
        {mode === 'otp-verify' && (
          <div className="form-content">
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <OtpInput val={otpValues} setVal={setOtpValues} submitForm={handleVerifyOtp} digits={6} />
            </div>

            <button onClick={handleManualVerify} disabled={loading} className="btn btn-primary">
              {loading ? (
                <>
                  <RiLoader2Line className="btn-icon animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify and Login'
              )}
            </button>
            {isDemoMode && <div className="alert alert-info mt-2 text-center">Login with OTP 123456</div>}

            <div
              onClick={() => {
                setMode('otp')
                setOtpValues(['', '', '', '', '', ''])
              }}
              className="btn btn-link back-btn-badge"
            >
              <SvgIcon className="back-btn-icon" iconId="back-arrow-icon" />
            </div>
          </div>
        )}

        <div className="text-center mt-3">
          {Boolean(allow_user_signup) && (
            <p className="mb-0">
              {t('dont_have_an_account')}{' '}
              <Link to={ROUTES.SignUp} className="font-primary">
                {t('signup')}
              </Link>
            </p>
          )}

          {auth_method !== 'both' && (
            <p className="mb-0">
              Already have your {auth_method === 'phone' ? 'email' : 'phone'} registered?{' '}
              <Link to={ROUTES.LinkIdentifier} className="font-primary">
                Link {auth_method}
              </Link>
            </p>
          )}
        </div>
        {isDemoMode && activeTab === 'email' && mode !== 'otp-verify' && (
          <LoginTable setFieldValue={handleSetFieldValue} />
        )}
      </div>
    </div>
  )
}

export default LoginForm
