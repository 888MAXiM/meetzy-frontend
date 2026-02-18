import { useDispatch } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import { mutations, queries } from '../api'
import { ROUTES } from '../constants/route'
import { useAppSelector } from '../redux/hooks'
import { logout } from '../redux/reducers/authSlice'
import { resetChatState } from '../redux/reducers/messenger/chatSlice'
import { SvgIcon } from '../shared/icons'
import { toaster } from '../utils/custom-functions'

const ImpersonationBanner = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { token, user } = useAppSelector((state) => state.auth)
  const { data: impersonationStatus } = queries.useGetImpersonationStatus({
    refetchInterval: 10000,
    retry: false,
    enabled: !!token,
  })
  const { mutate: stopImpersonation, isPending } = mutations.useStopImpersonation()

  const handleStopImpersonation = () => {
    stopImpersonation(undefined, {
      onSuccess: (data) => {
        queryClient.clear()
        dispatch(resetChatState())
        if (data.token && data.originalUser && data.originalUser !== user?.id) {
          const adminUrl = import.meta.env.VITE_ADMIN_APP_URL
          if (adminUrl) {
            window.location.href = adminUrl
            dispatch(logout())
          } else {
            window.location.href = ROUTES.Login
            dispatch(logout())
          }
        } else {
          window.location.href = ROUTES.Login
          dispatch(logout())
        }
      },
      onError: () => {
        toaster('error', 'failed_to_stop_impersonation')
      },
    })
  }

  if (!impersonationStatus?.isImpersonating) return null

  return (
    <div className="impersonation-banner">
      <div className="banner-left">
        <SvgIcon iconId="users" />
        <span>You are strictly impersonating a user. Actions are limited.</span>
      </div>
      <button onClick={handleStopImpersonation} disabled={isPending} className="stop-btn">
        {isPending ? 'Stopping...' : 'Stop'}
      </button>
    </div>
  )
}

export default ImpersonationBanner
