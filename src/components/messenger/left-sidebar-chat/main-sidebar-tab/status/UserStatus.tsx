import { useState } from 'react'
import { mutations } from '../../../../../api'
import { ImagePath } from '../../../../../constants'
import { Image } from '../../../../../shared/image'
import type { UserStatusProps } from '../../../../../types/components/chat'
import { useTimeFormatter } from '../../../../../utils/custom-functions'
import StatusViewerModal from './StatusViewerModal'
import { useAppDispatch } from '../../../../../redux/hooks'
import { addViewToStatus } from '../../../../../redux/reducers/messenger/statusSlice'
import { SvgIcon } from '../../../../../shared/icons'
import { useQueryClient } from '@tanstack/react-query'
import { KEYS } from '../../../../../constants/keys'

const UserStatus: React.FC<UserStatusProps> = ({ feed, mutedUserIds, isViewed }) => {
  const queryClient = useQueryClient()
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const viewStatusMutation = mutations.useViewStatus()
  const { formatTimeAgo } = useTimeFormatter()
  const dispatch = useAppDispatch()
  const { mutate } = mutations.useToggleMuteStatus()

  if (!feed || !feed.user || !feed.statuses || feed.statuses.length === 0) {
    return null
  }

  const handleStatusClick = () => {
    setCurrentStatusIndex(0)
    setIsViewerOpen(true)
  }

  const handleViewStatus = async (statusId: string | number) => {
    try {
      await viewStatusMutation.mutateAsync(
        { status_id: statusId },
        {
          onSuccess: () => {},
        },
      )
    } catch (error) {
      console.error('Error marking status as viewed:', error)
    }
  }

  const handleViewerClose = () => {
    setIsViewerOpen(false)
    const status = feed?.statuses[0]
    if (status && !isViewed) {
      setTimeout(() => {
        dispatch(
          addViewToStatus({
            status_id: status.id,
            viewer_id: feed.user.id,
            viewer_name: feed.user.name,
            viewed_at: new Date().toISOString(),
            view_count: status.view_count + 1,
            current_user_id: feed.user.id,
          }),
        )
      }, 300)
    }
  }

  const toggleMuteStatus = (userId: number | string | undefined) => {
    mutate(
      { target_id: userId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [KEYS.STATUS_FEED] })
          queryClient.invalidateQueries({ queryKey: [KEYS.MUTED_STATUSES] })
        },
      },
    )
  }

  const thumbnailUrl = feed?.statuses[0]?.file_url || feed?.user?.avatar
  const latestStatusTime = feed.statuses[feed.statuses.length - 1]?.created_at

  return (
    <>
      <div className={`status-content ${isViewed ? '' : 'active'}`}>
        <ul>
          <li className="user-status">
            <a
              className="lightbox profile status"
              onClick={(e) => {
                e.preventDefault()
                handleStatusClick()
              }}
            >
              <Image
                className="img-fluid bg-img"
                src={
                  feed.is_sponsored
                    ? thumbnailUrl || `${ImagePath}/avatar/placeholder.png`
                    : thumbnailUrl || `${ImagePath}/avatar/placeholder.png`
                }
                alt="status"
              />
              {!isViewed && <div className="status-ring" />}
            </a>
          </li>
          <li className="d-flex justify-content-between align-items-center flex-grow-1">
            <div>
              <h6>{feed.is_sponsored ? 'Sponsor' : feed.user.name}</h6>
              <p>{formatTimeAgo(latestStatusTime)}</p>
            </div>
            {(mutedUserIds?.has(feed.user.id) || !feed.is_sponsored) && (
              <div>
                <SvgIcon
                  iconId="hide-eye"
                  className="muted-status-icon"
                  onClick={() => toggleMuteStatus(feed.user.id)}
                />
              </div>
            )}
          </li>
        </ul>
      </div>
      <StatusViewerModal
        isOpen={isViewerOpen}
        onClose={handleViewerClose}
        statuses={feed.statuses}
        initialIndex={currentStatusIndex}
        userName={feed.user.name}
        userAvatar={feed.user.avatar}
        formatTimeAgo={formatTimeAgo}
        onViewStatus={handleViewStatus}
        isOwn={false}
        shouldTrackViews={isViewerOpen}
        isSponsored={feed.is_sponsored}
        userId={feed.user.id}
        isMuted={mutedUserIds?.has(feed.user.id)}
      />
    </>
  )
}

export default UserStatus
