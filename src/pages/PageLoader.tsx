import { ReactNode } from 'react'
import { SvgIcon } from '../shared/icons'
import useInternetConnection from '../utils/useInternetConnection'
import NoInternetPage from './NoInternetPage'

interface InternetConnectionWrapperProps {
  children: ReactNode
}

const InternetConnectionWrapper = ({ children }: InternetConnectionWrapperProps) => {
  const { isOnline, isChecking, retry } = useInternetConnection()

  if (isChecking) {
    return (
      <div className="internet-connection-loading flex-center ">
        <div className="text-center">
          <div className="main-loader">
            <SvgIcon className="light-logo" iconId="logo-light" />
            <SvgIcon className="dark-logo" iconId="logo-dark" />
            <p>Simple, secure messaging for fast moving teams...!</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isOnline) {
    return <NoInternetPage onRetry={retry} isRetrying={isChecking} />
  }

  return <>{children}</>
}

export default InternetConnectionWrapper
