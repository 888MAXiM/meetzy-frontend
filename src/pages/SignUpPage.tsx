import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../redux/hooks'
import AuthContainer from '../auth'
import { Button } from 'reactstrap'
import { ROUTES } from '../constants/route'

const SignUpPage = () => {
  const { allow_user_signup } = useAppSelector((state) => state.settings)
  const navigate = useNavigate()

  if (!allow_user_signup) {
    return (
      <div className="signup-disabled-container">
        <div className="box">
          <h1 className="fw-light">Registration Disabled</h1>
          <p className="fs-6 mt-2">The admin has temporarily disabled new signups.</p>
          <Button color="primary px-3" onClick={() => navigate(ROUTES.Login)}>
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return <AuthContainer />
}

export default SignUpPage
