import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { SvgIcon } from '../../shared/icons'

const AuthWrapper = ({
  heading,
  subHeading,
  back,
  children,
}: {
  children: ReactNode
  heading?: string
  subHeading?: string
  back?: string
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="login-page2 animat-rate">
      <div className="login-content-main">
        <div className="login-content">
          <div className="forgot-password-content">
            {back && (
              <div className="back-btn-badge">
                <SvgIcon className="back-btn-icon" iconId="back-arrow-icon" onClick={() => navigate(back)} />
              </div>
            )}
            {heading && <h3 className="text-center">{t(heading)}?</h3>}
            {subHeading && <h6 className="text-center">{t(subHeading)}</h6>}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthWrapper
