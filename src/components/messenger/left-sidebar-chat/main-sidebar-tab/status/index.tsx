import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Fragment } from 'react/jsx-runtime'
import { queries } from '../../../../../api'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { openCloseSidebar, setMobileMenu } from '../../../../../redux/reducers/messenger/messengerSlice'
import { setMyStatuses, setStatuses } from '../../../../../redux/reducers/messenger/statusSlice'
import { IconButton } from '../../../../../shared/button/IconButton'
import { useStatusDelete, useStatusUpload, useTimeFormatter } from '../../../../../utils/custom-functions'
import { useMobileMenuEffect } from '../../../../../utils/useSidebarEffects'
import ContactStatus from './ContactStatus'
import MyStatusList from './MyStatusList'
import StatusAvatar from './StatusAvatar'
import StatusUploadModal from './StatusUploadModal'
import StatusViewerModal from './StatusViewerModal'

const Status = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [showViewerModal, setShowViewerModal] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0)
  const { myStatuses } = useAppSelector((store) => store.status)
  const { data: currentUserData } = queries.useGetUserDetails()
  const { sidebarToggle, mobileMenu } = useAppSelector((state) => state.messenger)
  const { data: statusData } = queries.useGetStatusFeed()

  useMobileMenuEffect(mobileMenu)

  useEffect(() => {
    if (statusData?.data) {
      const myStatuses = statusData.data.find((feed) => feed.user.id === currentUserData?.user?.id)
      dispatch(setStatuses(statusData.data))
      dispatch(setMyStatuses(myStatuses))
    }
  }, [statusData, currentUserData?.user?.id, dispatch])

  const handleRightClick = () => {
    dispatch(setMobileMenu())
    if (sidebarToggle) {
      dispatch(openCloseSidebar(true))
    }
  }

  const handleToggleSidebar = () => {
    dispatch(openCloseSidebar())
    setOpen(!open)
  }

  const {
    fileInputRef,
    uploading,
    showCaptionModal,
    selectedFile,
    caption,
    setCaption,
    handleFileSelect,
    handleUpload,
    resetUploadState,
  } = useStatusUpload()

  const { handleDeleteStatus, isDeleting } = useStatusDelete()
  const { formatTimeAgo } = useTimeFormatter()

  const currentUser = currentUserData?.user
  const latestStatus = myStatuses?.statuses?.[myStatuses?.statuses.length - 1]
  const hasStatuses = (myStatuses?.statuses?.length ?? 0) > 0

  const handleStatusClick = useCallback(
    (status: any) => {
      const index = myStatuses?.statuses.findIndex((s: any) => s.id === status.id) ?? 0
      setSelectedStatusIndex(index)
      setShowViewerModal(true)
    },
    [myStatuses?.statuses],
  )

  const getStatusText = useCallback(() => {
    if (!latestStatus) {
      return hasStatuses ? t('status_count', { count: myStatuses?.statuses!.length }) : t('status_update')
    }

    const timeAgo = formatTimeAgo(latestStatus.created_at)
    const multipleUpdates =
      myStatuses?.statuses && myStatuses?.statuses.length > 1
        ? ` • ${t('updates_count', { count: myStatuses?.statuses.length })}`
        : ''

    return timeAgo + multipleUpdates
  }, [latestStatus, hasStatuses, myStatuses?.statuses, formatTimeAgo, t])

  return (
    <Fragment>
      <div className="my-status-box">
        <div className="status-content">
          <div className="d-flex template-title">
            <StatusAvatar
              avatar={currentUser?.avatar}
              name={currentUser?.name}
              hasStatus={hasStatuses}
              handleFileSelect={handleFileSelect}
              fileInputRef={fileInputRef}
            />

            <div className="flex-grow-1">
              <h5>{t('my_status')}</h5>
              <p>{getStatusText()}</p>
            </div>

            <>
              <IconButton
                variant="primary"
                className={`pull-right ms-1 mobile-back ${sidebarToggle ? 'btn-outline-light' : ''}`}
                onClick={handleRightClick}
              >
                <i className="ti-angle-right" />
              </IconButton>

              <IconButton className="pull-right left-toggle-icon ms-2" onClick={handleToggleSidebar}>
                {!open ? <ChevronLeft /> : <ChevronRight />}
              </IconButton>
            </>
          </div>

          {myStatuses?.statuses && (
            <MyStatusList
              statuses={myStatuses?.statuses}
              onDelete={handleDeleteStatus}
              isDeleting={isDeleting}
              formatTimeAgo={formatTimeAgo}
              onStatusClick={handleStatusClick}
            />
          )}
        </div>
      </div>

      <ContactStatus currentUserId={currentUser?.id} />

      <StatusUploadModal
        isOpen={showCaptionModal}
        onClose={resetUploadState}
        selectedFile={selectedFile}
        caption={caption}
        onCaptionChange={setCaption}
        onUpload={handleUpload}
        uploading={uploading}
      />

      {myStatuses?.statuses && (
        <StatusViewerModal
          isOpen={showViewerModal}
          onClose={() => setShowViewerModal(false)}
          statuses={myStatuses?.statuses}
          initialIndex={selectedStatusIndex}
          userName={currentUser?.name || t('you')}
          userAvatar={currentUser?.avatar}
          formatTimeAgo={formatTimeAgo}
        />
      )}
    </Fragment>
  )
}

export default Status
