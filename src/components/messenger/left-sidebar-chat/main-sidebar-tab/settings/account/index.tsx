import { useAppSelector } from '../../../../../../redux/hooks'
import CommonMediaHeading from '../common/CommonMediaHeading'
import ChangeNumber from './ChangeNumber'
import DeleteAccount from './DeleteAccount'
import Privacy from './Privacy'
import UserStatusSetting from './status/UserStatusSetting'

const Account = () => {
  const { settingsActiveTab } = useAppSelector((state) => state.mainSidebar)
  const { allow_status } = useAppSelector((state) => state.settings)

  return (
    <div className="setting-block border-0">
      <div className={`block ${settingsActiveTab === 'account' ? 'open' : ''}`}>
        <CommonMediaHeading title={'account_title'} />
        <div className="template-according" id="accordion">
          <Privacy />
          <ChangeNumber />
          {allow_status && <UserStatusSetting />}
          <DeleteAccount />
        </div>
      </div>
      <CommonMediaHeading title={'account_title'} text={'account_message'} type="account" />
    </div>
  )
}

export default Account
