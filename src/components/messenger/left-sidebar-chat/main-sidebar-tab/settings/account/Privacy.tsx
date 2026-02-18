import { Formik } from 'formik'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardBody, CardHeader, Col, Collapse, Form, Row } from 'reactstrap'
import { mutations } from '../../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../../redux/hooks'
import { setAccount } from '../../../../../../redux/reducers/messenger/mainSidebarSlice'
import SwitchInput from '../../../../../../shared/form-fields/SwitchInput'
import ConfirmModal from '../../../../../../shared/modal/ConfirmationModal'
import { UserSetting } from '../../../../../../types/api'
import { ChevronDown, ChevronUp } from 'react-feather'

const Privacy = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { mutate } = mutations.useUpdateUserSetting()
  const { account } = useAppSelector((state) => state.mainSidebar)
  const { userSetting } = useAppSelector((state) => state.userSettings)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [selectedKey, setSelectedKey] = useState<keyof UserSetting | null>(null)
  const [selectedValue, setSelectedValue] = useState<boolean>(false)

  const optionItem: UserSetting = {
    last_seen: userSetting?.last_seen ?? false,
    profile_pic: userSetting?.profile_pic ?? false,
    display_bio: userSetting?.display_bio ?? false,
    read_receipts: userSetting?.read_receipts ?? false,
    typing_indicator: userSetting?.typing_indicator ?? false,
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    setSelectedKey(null)
  }

  const handleConfirm = () => {
    if (!selectedKey) return
    const payload = {
      [selectedKey]: selectedValue,
    }

    mutate(payload, {
      onSuccess: () => {
        setShowConfirmation(false)
        setSelectedKey(null)
      },
    })
  }

  const handleSwitchChange = (key: keyof UserSetting, currentValue: boolean) => {
    setSelectedKey(key)
    setSelectedValue(!currentValue)
    setShowConfirmation(true)
  }

  return (
    <>
      <Card>
        <CardHeader onClick={() => dispatch(setAccount(account !== '2' ? '2' : ''))}>
          <a className="account-setting">
            {account === '2' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {'Privacy'}
          </a>
        </CardHeader>
        <Collapse className={`${account === '2' ? 'show' : ''}`}>
          <CardBody>
            <Formik initialValues={optionItem} onSubmit={() => {}} enableReinitialize>
              <Form>
                <Row>
                  {Object.entries(optionItem).map(([key, value]) => (
                    <Col md="12" key={key}>
                      <SwitchInput
                        formGroupClass="d-flex justify-content-between privacy-box row pb-3"
                        name={key}
                        label={key}
                        checked={value}
                        labelClass="usage-option-label"
                        subDescription={key}
                        onToggle={() => handleSwitchChange(key as keyof UserSetting, value)}
                        preventImmediateToggle={true}
                      />
                    </Col>
                  ))}
                </Row>
              </Form>
            </Formik>
          </CardBody>
        </Collapse>
      </Card>
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

export default Privacy
