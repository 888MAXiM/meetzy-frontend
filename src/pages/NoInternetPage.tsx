import { useTranslation } from 'react-i18next'
import { SolidButton } from '../shared/button'
import { SvgIcon } from '../shared/icons'
import { useAppSelector } from '../redux/hooks'
// import { Image } from '../shared/image'
// import { ImagePath } from '../constants'

interface NoInternetPageProps {
  onRetry: () => void
  isRetrying?: boolean
}

const NoInternetPage = ({ onRetry, isRetrying = false }: NoInternetPageProps) => {
  const { t } = useTranslation()
  const { no_internet_title, no_internet_content } = useAppSelector((state) => state.settings)

  return (
    <div className="no-internet-page flex-center">
      <SvgIcon className="nointernet-image" iconId="internet" />
      <div className="text-center p-4 nointernet-content">
        <SolidButton
          onClick={onRetry}
          loading={isRetrying}
          disabled={isRetrying}
          color="primary"
          className="px-4 py-2 mb-4"
          title={isRetrying ? t('Checking...') : t('Retry')}
        />

        <h2 className="text-muted">{no_internet_title || 'No internet'}</h2>
        {isRetrying && (
          <div className="mt-2">
            <p className="text-info">{t('Checking internet connection...')}</p>
          </div>
        )}

        <div className="mt-2">
          <p className="text-muted">
            {no_internet_content || 'Make sure you are connected to the internet and try again.'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default NoInternetPage
