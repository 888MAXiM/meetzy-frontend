import { useState } from 'react'
import { RiLoader2Line } from 'react-icons/ri'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { mutations } from '../../api'
import { ROUTES } from '../../constants/route'
import { useAppSelector } from '../../redux/hooks'
import { loginSuccess } from '../../redux/reducers/authSlice'
import OtpInput from '../../shared/form-fields/OtpInput'

const LinkIdentifierOtp = ({
  old_identifier,
  setMode,
  newPassword = '',
  keyType,
}: {
  old_identifier: string
  setMode: (v: string) => void
  newPassword?: string
  keyType: string
}) => {
  console.log("setMode:", setMode)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { auth_method } = useAppSelector((state) => state.settings)

  const verifyLinkOtp = mutations.useVerifyLinkOtp()
  const verifyLinkPassword = mutations.useVerifyLinkPassword()

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const otp = otpDigits.join('')

    if (!otp || otp.length < 6) {
      setError('Please enter a valid OTP')
      return
    }

    try {
      setLoading(true)

      const response =
        keyType === 'identifier'
          ? await verifyLinkOtp.mutateAsync({ identifier: old_identifier, otp })
          : await verifyLinkPassword.mutateAsync({
              identifier: old_identifier,
              otp,
              new_password: newPassword,
            })

      if (response.message) setSuccess(response.message)
      else setSuccess('OTP verified successfully!')

      if (response.token && response.user) {
        dispatch(loginSuccess({ token: response.token, user: response.user }))
      }

      navigate(ROUTES.Messenger)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Invalid OTP'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="form-content" onSubmit={handleVerifyOtp}>
        <div className="form-group">
          <label className="form-label">Enter OTP</label>

          <p className="otp-info">
            OTP sent to {auth_method === 'email' ? 'your email' : 'your phone'}:{' '}
            <span className="otp-identifier">{old_identifier}</span>
          </p>

          <OtpInput val={otpDigits} setVal={setOtpDigits} digits={6} />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? (
            <>
              <RiLoader2Line className="btn-icon animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify and Login'
          )}
        </button>
      </form>
    </>
  )
}

export default LinkIdentifierOtp
