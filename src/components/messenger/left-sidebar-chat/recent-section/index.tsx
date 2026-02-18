import { useTranslation } from 'react-i18next'
import { queries } from '../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks'
import { openCloseSidebar, setMobileMenu } from '../../../../redux/reducers/messenger/messengerSlice'
import { IconButton } from '../../../../shared/button/IconButton'
import { SvgIcon } from '../../../../shared/icons'
import ChatAvatar from '../../../../shared/image/ChatAvatar'
import { useMobileMenuEffect } from '../../../../utils/useSidebarEffects'
import SliderSection from './SliderSection'
import CommonLeftHeading from '../main-sidebar-tab/common/CommonLeftHeading'

const RecentSection = () => {
  const { data } = queries.useGetUserDetails()
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const { sidebarToggle, mobileMenu } = useAppSelector((state) => state.messenger)
  const { allow_status } = useAppSelector((state) => state.settings)

  useMobileMenuEffect(mobileMenu)

  const handleRightClick = () => {
    dispatch(setMobileMenu())
    if (sidebarToggle) {
      dispatch(openCloseSidebar(true))
    }
  }

  const handleToggleSidebar = () => {
    dispatch(openCloseSidebar())
  }

  return (
    <div className="recent">
      <CommonLeftHeading
        hideDefaultClose={true}
        customContent={
          <div className="img-text">
            <div className="chat-box">
              <div className="profile">
                <ChatAvatar data={data?.user} name={data?.user} customClass="user-info avatar-sm" />
              </div>
              <div className="details">
                <div className="d-flex">
                  <h5>{data?.user?.name}</h5>
                  {data?.user?.is_verified && (
                    <SvgIcon iconId="blue-tick" className="ms-1" />
                  )}
                </div>
                <p>{data?.user?.bio || t('bio_data')}</p>
              </div>
            </div>
          </div>
        }
        customActions={
          <>
            <IconButton
              variant="primary"
              className={`pull-right ms-1 mobile-back ${sidebarToggle ? 'btn-outline-light' : ''}`}
              onClick={handleRightClick}
            >
              <i className="ti-angle-right" />
            </IconButton>

            <IconButton className="pull-right left-toggle-icon ms-2" onClick={handleToggleSidebar}>
              <SvgIcon iconId="cheveron-right" />
            </IconButton>
          </>
        }
      />
      {!!allow_status && <SliderSection />}
    </div>
  )
}

export default RecentSection
