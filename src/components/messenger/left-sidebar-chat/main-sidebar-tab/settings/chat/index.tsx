import { Form, Formik } from 'formik'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Col, Row } from 'reactstrap'
import { mutations, queries } from '../../../../../../api'
import { KEYS } from '../../../../../../constants/keys'
import { useAppSelector } from '../../../../../../redux/hooks'
import SwitchInput from '../../../../../../shared/form-fields/SwitchInput'
import ConfirmModal from '../../../../../../shared/modal/ConfirmationModal'
import { UserSetting } from '../../../../../../types/api'
import CommonMediaHeading from './../common/CommonMediaHeading'
import AllChat from './Chat'

const Chat = () => {
  const { t } = useTranslation()
  const { settingsActiveTab } = useAppSelector((state) => state.mainSidebar)
  const { mutate } = mutations.useUpdateUserSetting()
  const { userSetting } = useAppSelector((state) => state.userSettings)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedKey, setSelectedKey] = useState<keyof UserSetting | null>(null)
  const [selectedValue, setSelectedValue] = useState<boolean>(false)
  const { refetch } = queries.useGetConnectToDrive(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  const optionItem: UserSetting = {
    auto_backup: userSetting?.auto_backup ?? false,
    doc_backup: userSetting?.doc_backup ?? false,
    video_backup: userSetting?.video_backup ?? false,
  }

  const isAutoBackupEnabled = optionItem.auto_backup

  const visibleOptions = Object.entries(optionItem).filter(([key]) => {
    if (key === 'doc_backup' || key === 'video_backup') {
      return isAutoBackupEnabled
    }
    return true
  })

  useEffect(() => {
    const googleConnected = searchParams.get('google_connected')
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    queryClient.invalidateQueries({ queryKey: [KEYS.ALL_USER_SETTINGS] })

    if (googleConnected === 'true' || code || state) {
      const checkAndUpdateAutoBackup = async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500))

          await queryClient.invalidateQueries({ queryKey: [KEYS.ALL_USER_SETTINGS] })
          await queryClient.refetchQueries({ queryKey: [KEYS.ALL_USER_SETTINGS] })

          const connectData = await refetch()

          if (!connectData.data?.redirectUrl) {
            const userSettingData = queryClient.getQueryData([KEYS.ALL_USER_SETTINGS]) as any
            const currentAutoBackup = userSettingData?.userSetting?.auto_backup ?? false

            if (!currentAutoBackup) {
              mutate(
                { auto_backup: true },
                {
                  onSuccess: () => {
                    queryClient.invalidateQueries({ queryKey: [KEYS.ALL_USER_SETTINGS] })
                  },
                },
              )
            }
          }

          searchParams.delete('google_connected')
          searchParams.delete('code')
          searchParams.delete('state')
          setSearchParams(searchParams, { replace: true })
        } catch {
          searchParams.delete('google_connected')
          searchParams.delete('code')
          searchParams.delete('state')
          setSearchParams(searchParams, { replace: true })
        }
      }

      checkAndUpdateAutoBackup()
    }
  }, [searchParams, setSearchParams, refetch, mutate, queryClient])

  const handleCancel = () => {
    setShowConfirmation(false)
    setSelectedKey(null)
  }

  const handleConfirm = async () => {
    if (!selectedKey) return

    if (selectedKey === 'auto_backup' && selectedValue === true) {
      try {
        const connectData = await refetch()

        if (connectData.data?.redirectUrl) {
          window.location.href = connectData.data.redirectUrl
          setShowConfirmation(false)
          setSelectedKey(null)
          return
        }

        const payload = { [selectedKey]: selectedValue }
        mutate(payload, {
          onSuccess: () => {
            setShowConfirmation(false)
            setSelectedKey(null)
          },
        })
      } catch (error) {
        console.error('Error checking Google connection:', error)
        setShowConfirmation(false)
        setSelectedKey(null)
      }
    } else {
      const payload = { [selectedKey]: selectedValue }
      mutate(payload, {
        onSuccess: () => {
          setShowConfirmation(false)
          setSelectedKey(null)
        },
      })
    }
  }

  const handleSwitchChange = (key: keyof UserSetting, currentValue: boolean) => {
    setSelectedKey(key)
    setSelectedValue(!currentValue)
    setShowConfirmation(true)
  }

  return (
    <>
      <div className="setting-block">
        <div className={`block ${settingsActiveTab === 'chat' ? 'open' : ''}`}>
          <CommonMediaHeading title={'chat'} />
          <ul className="help">
            <li>
              <p className="txt-dark">Chat Backup</p>
              <Formik initialValues={optionItem} onSubmit={() => {}} enableReinitialize>
                <Form>
                  <Row>
                    {visibleOptions.map(([key, value]) => (
                      <Col md="12" key={key}>
                        <SwitchInput
                          formGroupClass="d-flex justify-content-between chat-switch-list"
                          name={key}
                          label={key}
                          checked={value}
                          labelClass="usage-option-label"
                          onToggle={() => handleSwitchChange(key as keyof UserSetting, value)}
                          preventImmediateToggle={true}
                        />
                      </Col>
                    ))}
                  </Row>
                </Form>
              </Formik>
            </li>
            <AllChat />
          </ul>
        </div>
        <CommonMediaHeading title={'chat'} text={'chat_message'} type="chat" />
      </div>
      <ConfirmModal
        subtitle={`Are you sure you want to ${selectedValue ? 'enable' : 'disable'} ${t(`${selectedKey}`)}?`}
        title={`${selectedValue ? 'Enable' : 'Disable'} ${t(`${selectedKey}`)}`}
        variant="info"
        isOpen={showConfirmation}
        onClose={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  )
}

export default Chat
