import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { queries } from '../../../../../api'
import Account from './account'
import { useDispatch } from 'react-redux'
import { useAppSelector } from '../../../../../redux/hooks'
import { setUserSetting } from '../../../../../redux/reducers/userSettingSlice'
import SettingsHeading from './settings-heading'
import Chat from './chat'
import Customizers from './customizer'
import Plans from './plans'
import Subscriptions from './subscriptions'
import DocumentVerification from './document-verification'
import { SvgIcon } from '../../../../../shared/icons'
import { logout } from '../../../../../redux/reducers/authSlice'
import { resetChatState } from '../../../../../redux/reducers/messenger/chatSlice'
import ConfirmModal from '../../../../../shared/modal/ConfirmationModal'
import { useTranslation } from 'react-i18next'

const Settings = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { user } = useAppSelector((state) => state.auth)
  const { data } = queries.useGetUserSettings(user?.id)
  const { display_customizer } = useAppSelector((state) => state.settings)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    dispatch(setUserSetting(data?.userSetting))
  }, [data, dispatch])

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = () => {
    // Clear React Query cache
    queryClient.clear()
    // Reset chat state
    dispatch(resetChatState())
    dispatch(logout())
    setShowLogoutModal(false)
  }

  const handleLogoutCancel = () => {
    setShowLogoutModal(false)
  }

  return (
    <>
      <div>
        <SettingsHeading />
        <Account />
        <Chat />
        <Plans />
        <Subscriptions />
        <DocumentVerification />
        {display_customizer && <Customizers />}
        <div className="setting-block logout-btn">
            <a className="setting-block-signout" onClick={handleLogoutClick}>
              <SvgIcon className="" iconId="signOut" />
              {t('logout_hint')}
            </a>
        </div>
      </div> 
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Logout Confirmation"
        subtitle="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        variant="danger"
        iconId="signOut"
      />
    </>
  )
}

export default Settings
