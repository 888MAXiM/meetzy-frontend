import { useQueryClient } from '@tanstack/react-query'
import React, { Fragment, useCallback, useMemo, useState } from 'react'
import { X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Swiper, SwiperSlide } from 'swiper/react'
import { mutations, queries } from '../../../../api'
import { ImageBaseUrl } from '../../../../constants'
import { KEYS } from '../../../../constants/keys'
import { sliderSectionSettings } from '../../../../data/messenger'
import { useAppSelector } from '../../../../redux/hooks'
import { SvgIcon } from '../../../../shared/icons'
import ChatAvatar from '../../../../shared/image/ChatAvatar'
import type { UserStatusFeed } from '../../../../types/api'
import { StatusItem } from '../../../../types/store'
import { useTimeFormatter } from '../../../../utils/custom-functions'
import CreateStatusModal from '../main-sidebar-tab/status/CreateStatusModal'
import StatusViewerModal from '../main-sidebar-tab/status/StatusViewerModal'

const SliderSection = () => {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { isLoading } = queries.useGetStatusFeed()
  const { data: userDetails } = queries.useGetUserDetails()
  const currentUserId = userDetails?.user.id
  const { formatTimeAgo } = useTimeFormatter()
  const [isViewerOpen, setIsViewerOpen] = React.useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  const [currentFeedIndex, setCurrentFeedIndex] = React.useState(0)
  const [viewedFeeds, setViewedFeeds] = React.useState<Set<number | string>>(new Set())
  const { myStatuses, statuses } = useAppSelector((store) => store.status)
  const viewStatusMutation = mutations.useViewStatus()
  const [showMutedOnly, setShowMutedOnly] = useState(false)
  const { data: getMutedStatuses } = queries.useGetMutedStatuses()

  const myFeed: UserStatusFeed | null = useMemo(() => {
    if (!currentUserId) return null
    return {
      user: {
        id: currentUserId,
        name: userDetails?.user?.name || 'My Status',
        avatar: userDetails?.user?.avatar || null,
      },
      statuses: myStatuses?.statuses || [],
      is_viewed: true,
    }
  }, [currentUserId, userDetails?.user?.name, userDetails?.user?.avatar, myStatuses?.statuses])

  const myPlaceholderFeed = useMemo(() => {
    if (myStatuses?.statuses?.length) return null
    return {
      user: {
        id: currentUserId || 0,
        name: userDetails?.user?.name || 'My Status',
        avatar: userDetails?.user?.avatar,
      },
      statuses: [] as StatusItem[],
      is_viewed: true,
    }
  }, [myStatuses?.statuses?.length, currentUserId, userDetails?.user?.name, userDetails?.user?.avatar])

  const otherFeeds: UserStatusFeed[] = useMemo(() => {
    return (statuses || []).filter((f: UserStatusFeed) => f?.user?.id !== currentUserId)
  }, [statuses, currentUserId])

  const mutedUserIds = useMemo(() => {
    return new Set(getMutedStatuses?.data?.map((m) => m.muted_user.id) || [])
  }, [getMutedStatuses])

  const { normalFeeds, mutedFeeds } = useMemo(() => {
    const normal: UserStatusFeed[] = otherFeeds.filter((feed) => !mutedUserIds.has(feed.user.id))

    const muted: UserStatusFeed[] = (getMutedStatuses?.data || [])
      .map((item) => {
        let rawStatuses: any = []
        if (item.statuses && Array.isArray(item.statuses)) {
          rawStatuses = item.statuses
        } else if (item.latest_status) {
          rawStatuses = [item.latest_status]
        }

        const statuses: StatusItem[] = rawStatuses.map((s: any) => ({
          id: s.id,
          type: s.type,
          file_url: s.file_url,
          caption: s.caption || null,
          created_at: s.created_at,
          expires_at: s.expires_at,
          view_count: s.view_count || 0,
          views: s.views || [],
        }))

        return {
          user: item.muted_user,
          statuses,
          is_viewed: false,
          is_sponsored: false,
        } as UserStatusFeed
      })
      .filter((feed) => feed.statuses.length > 0)

    return { normalFeeds: normal, mutedFeeds: muted }
  }, [otherFeeds, getMutedStatuses, mutedUserIds])

  const displayedFeeds = useMemo(() => {
    if (showMutedOnly) {
      return mutedFeeds
    }

    const feeds = [...normalFeeds]

    const hasMutedUsers = getMutedStatuses?.data && getMutedStatuses.data.length > 0

    if (hasMutedUsers && !showMutedOnly) {
      feeds.push({
        user: {
          id: -999,
          name: 'Muted updates',
          avatar: null,
        },
        statuses: [],
        is_muted_section: true,
      } as any)
    }

    return feeds
  }, [normalFeeds, mutedFeeds, showMutedOnly, getMutedStatuses])

  const allFeedsForSlider: UserStatusFeed[] = useMemo(() => {
    if (showMutedOnly) {
      return displayedFeeds
    }
    if (myFeed) {
      return [myFeed, ...displayedFeeds]
    }
    if (myPlaceholderFeed) {
      return [myPlaceholderFeed as UserStatusFeed, ...displayedFeeds]
    }
    return displayedFeeds
  }, [myFeed, myPlaceholderFeed, displayedFeeds, showMutedOnly])

  const handleViewStatus = useCallback(
    async (statusId: number | string) => {
      const currentFeed = allFeedsForSlider[currentFeedIndex]
      if (!currentFeed) return

      try {
        await viewStatusMutation.mutateAsync({ status_id: statusId })
        if (currentFeed?.user.id && !viewedFeeds.has(currentFeed.user.id)) {
          setViewedFeeds((prev) => new Set([...prev, currentFeed.user.id]))
        }
      } catch (error) {
        console.error('Error viewing status:', error)
      }
    },
    [currentFeedIndex, allFeedsForSlider, viewStatusMutation, viewedFeeds],
  )

  const handleCreateSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [KEYS.STATUS_FEED] })
    setIsCreateModalOpen(false)
  }, [queryClient])

  const handleNextFeed = useCallback(() => {
    if (currentFeedIndex < allFeedsForSlider.length - 1) {
      setCurrentFeedIndex((prev) => prev + 1)
    } else {
      setIsViewerOpen(false)
    }
  }, [currentFeedIndex, allFeedsForSlider.length])

  const handlePreviousFeed = useCallback(() => {
    if (currentFeedIndex > 0) {
      setCurrentFeedIndex((prev) => prev - 1)
    }
  }, [currentFeedIndex])

  const handleCloseViewer = useCallback(() => {
    setIsViewerOpen(false)
  }, [])

  const isViewed = useCallback(
    (feed: UserStatusFeed) => {
      if (!feed || !feed.user) return false
      return viewedFeeds.has(feed.user.id) || feed.is_viewed || feed.user.id === currentUserId
    },
    [viewedFeeds, currentUserId],
  )

  const handleStatusClick = useCallback(
    (feedIndex: number) => {
      const feed = allFeedsForSlider[feedIndex]
      if (!feed) return

      if ((feed as UserStatusFeed).is_muted_section) {
        setShowMutedOnly(true)
        return
      }

      const isOwn = feed?.user.id === currentUserId

      if (!feed.statuses || feed.statuses.length === 0) {
        if (isOwn) {
          setIsCreateModalOpen(true)
        }
        return
      }

      setCurrentFeedIndex(feedIndex)
      setIsViewerOpen(true)
    },
    [allFeedsForSlider, currentUserId],
  )

  const handleBackFromMuted = () => {
    setShowMutedOnly(false)
    setIsViewerOpen(false)
  }

  const renderSlide = useCallback(
    (feed: UserStatusFeed, index: number) => {
      if (!feed) return null

      if ((feed as UserStatusFeed).is_muted_section) {
        return (
          <SwiperSlide key="muted-section" className="custom-recent-slider">
            <div className="recent-box" onClick={() => handleStatusClick(index)}>
              <div
                className="recent-profile cursor-pointer status-thumbnail muted-updates-box"
                onClick={() => handleStatusClick(index)}
              >
                <div className="d-flex justify-content-center align-items-center h-100">
                  <SvgIcon iconId="hide-eye" className="muted-status-icon" />
                </div>
                <h6 className="status-name">Muted</h6>
              </div>
            </div>
          </SwiperSlide>
        )
      }

      const isSponsored = feed.is_sponsored ? true : false
      const isOwn = feed.user.id === currentUserId
      const title = isOwn ? 'My Status' : isSponsored ? 'Sponsored' : feed.user.name
      const statusImageUrl = feed.statuses?.[0]?.file_url
      const hasStatusImage = !!statusImageUrl

      const backgroundImageUrl = hasStatusImage
        ? statusImageUrl.startsWith('http')
          ? statusImageUrl
          : `${ImageBaseUrl}${statusImageUrl}`
        : undefined

      const avatar = !isSponsored ? feed.user.avatar : feed.user.avatar
      const isMuted = mutedUserIds.has(feed.user.id)

      return (
        <SwiperSlide key={`${feed.user.id}-${index}`} className="custom-recent-slider">
          <div className="recent-box">
            <div
              className={`recent-profile cursor-pointer status-thumbnail ${hasStatusImage ? '' : 'no-status'} ${
                isOwn ? 'my-status' : ''
              } ${isMuted ? 'muted-status' : ''}`}
              onClick={() => handleStatusClick(index)}
              style={{
                backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="profile">
                <ChatAvatar data={{ avatar: avatar }} name={feed.user} customClass="user-info avatar-sm" />
              </div>
              {!isViewed(feed) && <div className="status-ring" />}
              <h6 className="status-name">{title}</h6>
            </div>
          </div>
        </SwiperSlide>
      )
    },
    [currentUserId, handleStatusClick, isViewed, mutedUserIds],
  )

  if (isLoading) {
    return (
      <Fragment>
        <div className="status-title">
          <h5>{t('status')}</h5>
        </div>
        <div className="recent-slider recent-chat">
          <p>{t('settings_loading')}</p>
        </div>
      </Fragment>
    )
  }

  const currentFeed = allFeedsForSlider[currentFeedIndex]

  return (
    <Fragment>
      <div className="status-title">
        <h5>{t(showMutedOnly ? 'Muted Status' : 'status')}</h5>
        {showMutedOnly && (
          <button className="btn btn-link p-0" onClick={handleBackFromMuted}>
            <X size={24} />
          </button>
        )}
      </div>
      {allFeedsForSlider.length === 0 ? (
        <div className="recent-slider recent-chat d-flex justify-content-center mt-5">
          <p>{t(showMutedOnly ? 'No Muted Status' : 'status_desc')}</p>
        </div>
      ) : (
        <>
          <div className="recent-slider recent-chat">
            <Swiper {...sliderSectionSettings} className="mySwiper">
              {allFeedsForSlider.map((feed, index) => renderSlide(feed, index))}
            </Swiper>
          </div>

          {isViewerOpen && currentFeed && currentFeed.statuses && currentFeed.statuses.length > 0 && (
            <StatusViewerModal
              key={`${currentFeed.user.id}-${currentFeedIndex}`}
              isOpen={isViewerOpen}
              onClose={handleCloseViewer}
              statuses={currentFeed.statuses}
              initialIndex={0}
              userName={currentFeed.user.name}
              userAvatar={currentFeed.user.avatar}
              isSponsored={currentFeed.is_sponsored}
              formatTimeAgo={formatTimeAgo}
              onViewStatus={handleViewStatus}
              isOwn={currentFeed.user.id === currentUserId}
              isMuted={mutedUserIds.has(currentFeed.user.id)}
              userId={currentFeed.user.id}
              shouldTrackViews={isViewerOpen}
              onNextFeed={handleNextFeed}
              onPreviousFeed={handlePreviousFeed}
              hasNextFeed={currentFeedIndex < allFeedsForSlider.length - 1}
              hasPreviousFeed={currentFeedIndex > 0}
            />
          )}

          <CreateStatusModal
            isOpen={isCreateModalOpen}
            toggle={() => setIsCreateModalOpen(false)}
            onSuccess={handleCreateSuccess}
            userAvatar={userDetails?.user?.avatar}
          />
        </>
      )}
    </Fragment>
  )
}

export default SliderSection
