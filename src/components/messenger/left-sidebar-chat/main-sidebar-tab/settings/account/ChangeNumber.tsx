import { Form, Formik } from 'formik'
import { useTranslation } from 'react-i18next'
import { Button, Card, CardBody, CardHeader, Collapse } from 'reactstrap'
import * as Yup from 'yup'
import { mutations, queries } from '../../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../../redux/hooks'
import { setAccount } from '../../../../../../redux/reducers/messenger/mainSidebarSlice'
import PhoneInput from '../../../../../../shared/form-fields/PhoneInput'
import { useEffect, useState } from 'react'
import { setUserSetting } from '../../../../../../redux/reducers/userSettingSlice'
import { ChevronDown, ChevronUp } from 'react-feather'

const ChangeNumber = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const { account } = useAppSelector((state) => state.mainSidebar)
  const { userSetting } = useAppSelector((state) => state.userSettings)
  const { data } = queries.useGetUserDetails()
  const { mutate: updateProfile, isPending } = mutations.useUpdateProfile()
  const { mutate: updateUserSetting } = mutations.useUpdateUserSetting()

  const [hidePhone, setHidePhone] = useState(userSetting?.hide_phone ?? false)

  useEffect(() => {
    setHidePhone(userSetting?.hide_phone ?? false)
  }, [userSetting])

  const initialValues = {
    countryCode: data?.user.country_code?.replace('+', '') || '91',
    phone: data?.user.phone?.replace('+', '') || '',
  }

  const schema = Yup.object().shape({
    countryCode: Yup.string().required(),
    phone: Yup.string().required('Phone number is required'),
  })

  const handleSubmit = async (values: typeof initialValues) => {
    if (isPending) return
    try {
      await updateProfile({ phone: values.phone, country_code: values.countryCode })
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleHidePhoneToggle = async () => {
    const newValue = !hidePhone
    setHidePhone(newValue)

    try {
      await updateUserSetting({ hide_phone: newValue })
      dispatch(
        setUserSetting({
          ...userSetting,
          hide_phone: newValue,
        }),
      )
    } catch (error) {
      console.error('Failed to update hide phone setting:', error)
      setHidePhone(!newValue)
    }
  }

  return (
    <Card>
      <CardHeader onClick={() => dispatch(setAccount(account !== '4' ? '4' : ''))}>
        <a className="account-setting">
          {account === '4' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          {t('Change Number')}
        </a>
      </CardHeader>

      <Collapse className={`${account === '4' ? 'show' : ''}`}>
        <CardBody className="change-number">
          <Formik initialValues={initialValues} validationSchema={schema} onSubmit={handleSubmit} enableReinitialize>
            {() => (
              <Form>
                <PhoneInput name="phone" codeName="countryCode" xs1="5" xs2="7" />

                <div className="text-end">
                  <Button
                    size="sm"
                    outline
                    color="primary"
                    className="button-effect"
                    type="submit"
                    disabled={isPending}
                  >
                    {t('confirm')}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>

          {/* Hide Phone Toggle */}
          <div className="hide-phone-setting mt-3 pt-3 border-top">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">{t('Hide Phone Number')}</h6>
                <p className="text-muted small mb-0">{t('Your phone number will be hidden from contacts')}</p>
              </div>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="hidePhoneSwitch"
                  checked={hidePhone ?? false}
                  onChange={handleHidePhoneToggle}
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Collapse>
    </Card>
  )
}

export default ChangeNumber
