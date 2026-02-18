import AuthContainer from '../auth'
import ForgotPasswordForm from '../auth/forgot-password'
import NewPasswordForm from '../auth/new-password'
import VerifyOtpContainer from '../auth/verify-otp'
import { ROUTES } from '../constants/route'
import SignUpPage from '../pages/SignUpPage'
import { PublicRoute } from './Middleware'

export const AuthRoutes = [
  {
    path: ROUTES.Login,
    element: (
      <PublicRoute>
        <AuthContainer />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.SignUp,
    element: (
      <PublicRoute>
        <SignUpPage />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.LinkIdentifier,
    element: (
      <PublicRoute>
        <AuthContainer />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.LinkPassword,
    element: (
      <PublicRoute>
        <AuthContainer />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.ForgotPassword,
    element: (
      <PublicRoute>
        <ForgotPasswordForm />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.VerifyOtp,
    element: (
      <PublicRoute>
        <VerifyOtpContainer />
      </PublicRoute>
    ),
  },
  {
    path: ROUTES.ResetPassword,
    element: (
      <PublicRoute>
        <NewPasswordForm />
      </PublicRoute>
    ),
  },
]
