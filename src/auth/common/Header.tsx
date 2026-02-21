import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ImageBaseUrl, ImagePath } from '../../constants'
import { useAppSelector } from '../../redux/hooks'
import { Image } from '../../shared/image'
import type { AuthHeaderProps } from '../../types/shared'
import { ROUTES } from '../../constants/route'
import { SvgIcon } from '../../shared/icons'

const AuthHeader = ({ isSignupPage, homeRoute, back }: AuthHeaderProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { logo_light_url, logo_dark_url } = useAppSelector((state) => state.settings)

  return (
    <>
      <div className="login-content-header">
        {back && (
          <div className="back-btn-badge" onClick={() => navigate(ROUTES.Login)}>
            <SvgIcon className="back-btn-icon" iconId="back-arrow-icon" />
          </div>
        )}
        <Link to={homeRoute}>
          <Image
            className="img-fluid for-light m-auto"
            src={`${logo_light_url ? ImageBaseUrl + logo_light_url : `${ImagePath}/logos/logo.jpg`}`}
            alt="logo"
          />
          <Image
            className="img-fluid for-dark m-auto"
            src={`${logo_dark_url ? ImageBaseUrl + logo_dark_url : `${ImagePath}/logos/1.svg`}`}
            alt="logo_dark"
          />
        </Link>
      </div>
      <h3 className="text-center">{t('welcome_heading')}</h3>
      <h6 className="text-center mb-3">
        {t('welcome_desc')}{' '}
        {isSignupPage == ROUTES.SignUp ? 'sign up for' : isSignupPage == ROUTES.Login ? 'login to' : 'link identifier'}{' '}
        {'your account.'}
      </h6>
    </>
  )
}

export default AuthHeader
