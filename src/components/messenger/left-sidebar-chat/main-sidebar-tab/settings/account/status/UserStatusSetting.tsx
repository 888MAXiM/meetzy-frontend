import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, Collapse } from 'reactstrap'
import { mutations } from '../../../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../../../redux/hooks'
import { setAccount } from '../../../../../../../redux/reducers/messenger/mainSidebarSlice'
import ContactList from './ContactList'
import PrivacyOptions from './PrivacyOptions'
import StatusSummary from './StatusSummary'
import { ChevronDown, ChevronUp } from 'react-feather'

const UserStatusSetting = () => {
  const dispatch = useAppDispatch()
  const { account } = useAppSelector((state) => state.mainSidebar)
  const { userSetting } = useAppSelector((state) => state.userSettings)
  const { allMembers } = useAppSelector((state) => state.chat)
  const { mutate } = mutations.useUpdateUserSetting()

  const [privacyOption, setPrivacyOption] = useState(userSetting?.status_privacy || 'my_contacts')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showContactList, setShowContactList] = useState(false)
  const [tempSelectedUsers, setTempSelectedUsers] = useState<string[]>([])

  useEffect(() => {
    if (userSetting && userSetting?.status_privacy) {
      setPrivacyOption(userSetting.status_privacy)

      if (userSetting.status_privacy === 'only_share_with' && userSetting.shared_with) {
        setSelectedUsers(userSetting.shared_with)
        setTempSelectedUsers(userSetting.shared_with)
      } else {
        setSelectedUsers([])
        setTempSelectedUsers([])
      }
    }
  }, [userSetting])

  const handlePrivacyChange = (option: 'my_contacts' | 'only_share_with') => {
    if (option === privacyOption) return

    const payload = {
      status_privacy: option,
      shared_with: option === 'only_share_with' ? selectedUsers : null,
    }

    mutate(payload, {
      onSuccess: () => {
        setPrivacyOption(option)
        setShowContactList(false)
      },
    })
  }

  const toggleContactList = () => {
    if (showContactList) {
      setTempSelectedUsers(selectedUsers)
    }
    setShowContactList(!showContactList)
  }

  const handleUserSelection = (userId: string) => {
    setTempSelectedUsers((prev) => {
      if (prev?.includes(userId)) {
        return prev.filter((id) => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
  }

  const handleSelectAll = () => {
    if (tempSelectedUsers?.length === allMembers.length) {
      setTempSelectedUsers([])
    } else {
      setTempSelectedUsers(allMembers.map((contact) => contact.id))
    }
  }

  const handleConfirmSelection = () => {
    const payload = {
      status_privacy: 'only_share_with',
      shared_with: tempSelectedUsers.length > 0 ? tempSelectedUsers : null,
    }

    mutate(payload, {
      onSuccess: () => {
        setSelectedUsers(tempSelectedUsers)
        setShowContactList(false)
        setPrivacyOption('only_share_with')
      },
    })
  }

  const getDisplayCount = () => {
    if (privacyOption === 'my_contacts') {
      return allMembers.length
    } else {
      return selectedUsers.length
    }
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => dispatch(setAccount(account !== '5' ? '5' : ''))}>
        <a className="account-setting">
          {account === '5' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          User Status
        </a>
      </CardHeader>
      <Collapse isOpen={account === '5'}>
        <CardBody>
          <div className="status-privacy-settings">
            <PrivacyOptions
              privacyOption={privacyOption}
              onPrivacyChange={handlePrivacyChange}
              onToggleContactList={toggleContactList}
              displayCount={getDisplayCount()}
            />

            {showContactList && privacyOption === 'only_share_with' && (
              <ContactList
                allMembers={allMembers}
                tempSelectedUsers={tempSelectedUsers}
                onUserSelection={handleUserSelection}
                onSelectAll={handleSelectAll}
                onConfirmSelection={handleConfirmSelection}
              />
            )}

            <StatusSummary privacyOption={privacyOption} allMembers={allMembers} selectedUsers={selectedUsers} />
          </div>
        </CardBody>
      </Collapse>
    </Card>
  )
}

export default UserStatusSetting
