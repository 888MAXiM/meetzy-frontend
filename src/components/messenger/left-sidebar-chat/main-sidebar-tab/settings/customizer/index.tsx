import { Form, Formik } from 'formik'
import { useState } from 'react'
import { Col, Row } from 'reactstrap'
import { useAppDispatch, useAppSelector } from '../../../../../../redux/hooks'
import { setLayoutType, setTemplateLayoutData } from '../../../../../../redux/reducers/templateCustomizerSlice'
import SwitchInput from '../../../../../../shared/form-fields/SwitchInput'
import ChatWallpaper from '../../../../../customizer/ChatWallpaper'
import Configurations from '../../../../../customizer/Configurations'
import SidebarSetting from '../../../../../customizer/SidebarSetting'
import TemplateLayout from '../../../../../customizer/TemplateLayout'
import ThemeColor from '../../../../../customizer/ThemeColor'
import CommonMediaHeading from '../common/CommonMediaHeading'

const Customizers = () => {
  const dispatch = useAppDispatch()
  const { settingsActiveTab } = useAppSelector((state) => state.mainSidebar)
  const { layoutType, templateLayout } = useAppSelector((state) => state.templateCustomizer)
  const currentTheme = templateLayout.find((item) => item.active)?.layoutValue || 'light'
  const [customizer, setCustomizer] = useState(false)
  const toggleCustomizer = () => setCustomizer(!customizer)

  const initialValues = {
    layoutRtl: layoutType,
    showSettingsPanel: customizer,
    mode: currentTheme !== 'light',
  }

  const handleRtlToggle = () => {
    dispatch(setLayoutType())
  }

  const handleSettingsToggle = (checked: boolean) => {
    setCustomizer(checked)
  }

  const handleModeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light'
    dispatch(setTemplateLayoutData(newTheme))
  }

  return (
    <div className="setting-block border-0">
      <CommonMediaHeading title={'customizers_title'} text={'customizers_title'} type="customizers" />
      <div className={`block ${settingsActiveTab === 'customizers' ? 'open' : ''}`}>
        <CommonMediaHeading title={'customizers_title'} />
        <Formik initialValues={initialValues} onSubmit={() => {}} enableReinitialize>
          {() => (
            <Form className="mt-3">
              <Row>
                <Col md="12">
                  <SwitchInput
                    formGroupClass="d-flex justify-content-between privacy-box row"
                    name="layoutRtl"
                    label="RTL/LTR Layout"
                    labelClass="usage-option-label"
                    subDescription="toggle between RTL and LTR layout direction"
                    onToggle={handleRtlToggle}
                    preventImmediateToggle={false}
                    useFormik={true}
                  />
                </Col>
                <Col md="12">
                  <SwitchInput
                    formGroupClass="d-flex justify-content-between privacy-box row"
                    name="showSettingsPanel"
                    label="Settings Panel"
                    labelClass="usage-option-label"
                    subDescription="toggle visibility of the detailed customizer panel"
                    onToggle={handleSettingsToggle}
                    preventImmediateToggle={false}
                    useFormik={true}
                  />
                </Col>
                <Col md="12">
                  <SwitchInput
                    formGroupClass="d-flex justify-content-between privacy-box row"
                    name="mode"
                    label="Theme Mode"
                    labelClass="usage-option-label"
                    subDescription="toggle for theme mode Light and Dark"
                    onToggle={handleModeToggle}
                    preventImmediateToggle={false}
                    useFormik={true}
                  />
                </Col>
              </Row>
            </Form>
          )}
        </Formik>
        <div className="template-according" id="accordion">
          <section className="setting-sidebar" style={customizer ? { right: '0px' } : { right: '-400px' }}>
            <Configurations setCustomizer={toggleCustomizer} />
            <ThemeColor />
            <TemplateLayout />
            <div className="chat-wallpaper">
              <ChatWallpaper />
              <SidebarSetting />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Customizers
