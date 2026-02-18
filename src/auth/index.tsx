import { useLocation, useNavigate } from 'react-router-dom'
import { mutations } from '../api'
import { ImagePath } from '../constants'
import { ROUTES } from '../constants/route'
import AuthWrapper from './common/AuthWrapper'
import AuthHeader from './common/Header'
import LoginForm from './login'
import LinkIdentifier from './login/LinkIdentifier'
import SignupForm from './sign-up'
import LinkPassword from './login/LinkPassword'
import NotFound from '../pages/NotFound'

const AuthContainer = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { useRegister } = mutations
  const registerMutation = useRegister()

  return (
    <AuthWrapper>
      <AuthHeader
        isSignupPage={location.pathname}
        homeRoute={ROUTES.Messenger}
        logoLightPath={`${ImagePath}/logo/landing-logo.png`}
        logoDarkPath={`${ImagePath}/logo/logo-white.png`}
        back={location.pathname !== ROUTES.SignUp && location.pathname !== ROUTES.Login}
      />

      {location.pathname === ROUTES.SignUp ? (
        <SignupForm registerMutate={registerMutation.mutate} navigate={navigate} />
      ) : location.pathname === ROUTES.Login ? (
        <LoginForm />
      ) : location.pathname === ROUTES.LinkIdentifier ? (
        <LinkIdentifier />
      ) : location.pathname === ROUTES.LinkPassword ? (
        <LinkPassword />
      ) : (
        <NotFound />
      )}
    </AuthWrapper>
  )
}

export default AuthContainer
