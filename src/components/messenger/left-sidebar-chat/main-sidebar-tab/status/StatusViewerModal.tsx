import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Eye, X } from 'react-feather'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap'
import { useQueryClient } from '@tanstack/react-query'
import { ImageBaseUrl } from '../../../../../constants'
import { KEYS } from '../../../../../constants/keys'
import { SvgIcon } from '../../../../../shared/icons'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import type { StatusView, StatusViewerModalProps } from '../../../../../types/components/chat'
import ViewersModal from './ViewersModal'
import StatusReplyInput from './StatusReplyInput'
import { mutations } from '../../../../../api'

const StatusViewerModal: React.FC<
  StatusViewerModalProps & {
    onViewStatus?: (statusId: string | number) => void
    isOwn?: boolean
    shouldTrackViews?: boolean
    onNextFeed?: () => void
    onPreviousFeed?: () => void
    hasNextFeed?: boolean
    hasPreviousFeed?: boolean
    userId?: number | string
    isMuted?: boolean
  }
> = ({
  isOpen,
  onClose,
  statuses,
  userName,
  userAvatar,
  isSponsored,
  formatTimeAgo,
  onViewStatus,
  isOwn = true,
  shouldTrackViews,
  onNextFeed,
  onPreviousFeed,
  hasNextFeed = false,
  hasPreviousFeed = false,
  userId,
  isMuted,
}) => {
  const queryClient = useQueryClient()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showViewersModal, setShowViewersModal] = useState(false)
  const [selectedStatusViewers, setSelectedStatusViewers] = useState<StatusView[]>([])
  const [viewedStatuses, setViewedStatuses] = useState<Set<string>>(new Set())
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef(0)
  const pausedDurationRef = useRef(0)
  const pauseStartRef = useRef(0)
  const isPausedRef = useRef(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { mutate } = mutations.useToggleMuteStatus()

  const currentStatus = statuses[currentIndex]

  // Check is_sponsored from current status (real-time) or fallback to prop
  const isCurrentStatusSponsored = currentStatus?.is_sponsored ?? isSponsored ?? false

  const pauseStatus = useCallback(() => {
    if (currentStatus?.type === 'video' && videoRef.current) {
      const video = videoRef.current
      if (!video.paused) {
        video.pause()
      }
    } else {
      if (!isPausedRef.current) {
        pauseStartRef.current = Date.now()
        isPausedRef.current = true
      }
    }
  }, [currentStatus?.type])

  const resumeStatus = useCallback(() => {
    if (currentStatus?.type === 'video' && videoRef.current) {
      const video = videoRef.current
      if (video.paused) {
        video.play().catch((err) => console.error('Video play error:', err))
      }
    } else {
      if (isPausedRef.current) {
        const pauseDur = Date.now() - pauseStartRef.current
        pausedDurationRef.current += pauseDur
        isPausedRef.current = false
        pauseStartRef.current = 0
      }
    }
  }, [currentStatus?.type])

  // Cleanup function
  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      videoRef.current.ontimeupdate = null
      videoRef.current.onended = null
      videoRef.current.onloadedmetadata = null
      videoRef.current.onpause = null
      videoRef.current.onplay = null
    }
    setProgress(0)
    startTimeRef.current = 0
    pausedDurationRef.current = 0
    pauseStartRef.current = 0
    isPausedRef.current = false
  }

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      cleanup()
      setCurrentIndex(0)
      setViewedStatuses(new Set())
      setShowViewersModal(false)
      return
    }
  }, [isOpen])

  // Track viewed statuses
  useEffect(() => {
    if (!isOpen || !shouldTrackViews || !currentStatus || isOwn) return

    if (onViewStatus && !viewedStatuses.has(currentStatus.id)) {
      setViewedStatuses((prev) => new Set(prev).add(currentStatus.id))
      onViewStatus(currentStatus.id)
    }
  }, [isOpen, currentIndex, currentStatus?.id, shouldTrackViews, isOwn, onViewStatus, viewedStatuses])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrevious()
      if (e.key === 'ArrowRight') handleNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, statuses.length])

  // Main status timer/video logic
  useEffect(() => {
    if (!currentStatus || !isOpen) return

    // Clean up previous status
    cleanup()

    const statusType = currentStatus.type

    const handleNextInternal = () => {
      if (currentIndex < statuses.length - 1) {
        setCurrentIndex((prev) => prev + 1)
      } else {
        if (hasNextFeed && onNextFeed) {
          onNextFeed()
        } else {
          onClose()
        }
      }
    }

    if (statusType === 'video' && videoRef.current) {
      const video = videoRef.current
      video.muted = true
      video.controls = false
      video.loop = false

      const setupVideo = () => {
        const dur = video.duration
        if (isNaN(dur) || dur <= 0) return

        const displayDur = Math.min(dur, 30)
        video.currentTime = 0

        video.play().catch((err) => console.error('Video play error:', err))

        video.ontimeupdate = () => {
          if (!video.paused) {
            const prog = Math.min(video.currentTime / displayDur, 1)
            setProgress(prog)

            if (video.currentTime >= displayDur) {
              video.pause()
              handleNextInternal()
            }
          }
        }

        video.onended = () => {
          handleNextInternal()
        }
      }

      if (video.readyState >= 1) {
        setupVideo()
      } else {
        video.onloadedmetadata = setupVideo
      }
    } else {
      // Image or text status - 5 second timer
      const duration = 5000
      startTimeRef.current = Date.now()
      pausedDurationRef.current = 0
      pauseStartRef.current = 0
      isPausedRef.current = false

      const interval = setInterval(() => {
        if (isPausedRef.current) return

        const now = Date.now()
        const elapsed = now - startTimeRef.current - pausedDurationRef.current
        const prog = Math.min(elapsed / duration, 1)
        setProgress(prog)

        if (prog >= 1) {
          clearInterval(interval)
          timerRef.current = null
          handleNextInternal()
        }
      }, 50)

      timerRef.current = interval
    }

    return () => {
      cleanup()
    }
  }, [currentIndex, isOpen, currentStatus, statuses.length, hasNextFeed, onNextFeed, onClose])

  const handleNext = () => {
    cleanup()

    if (currentIndex < statuses.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      if (hasNextFeed && onNextFeed) {
        onNextFeed()
      } else {
        onClose()
      }
    }
  }

  const handlePrevious = () => {
    cleanup()

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    } else {
      if (hasPreviousFeed && onPreviousFeed) {
        onPreviousFeed()
      }
    }
  }

  const handleViewersClick = (e: React.MouseEvent, views: StatusView[]) => {
    e.stopPropagation()
    setSelectedStatusViewers(views || [])
    setShowViewersModal(true)
  }

  const handleContentClick = () => {
    if (currentStatus.type === 'video' && videoRef.current) {
      const video = videoRef.current
      if (video.paused) {
        video.play().catch((err) => console.error('Video play error:', err))
      } else {
        video.pause()
      }
    } else {
      if (!isPausedRef.current) {
        pauseStartRef.current = Date.now()
        isPausedRef.current = true
      } else {
        const pauseDur = Date.now() - pauseStartRef.current
        pausedDurationRef.current += pauseDur
        isPausedRef.current = false
      }
    }
  }

  if (!isOpen || !currentStatus) return null

  const getProgressWidth = (index: number) => {
    if (index < currentIndex) return '100%'
    if (index > currentIndex) return '0%'
    return `${progress * 100}%`
  }

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

  const toggleMuteStatus = (userId: number | string | undefined) => {
    mutate(
      { target_id: userId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [KEYS.STATUS_FEED] })
          queryClient.invalidateQueries({ queryKey: [KEYS.MUTED_STATUSES] })
          onClose()
        },
      },
    )
  }

  const modalContent = (
    <>
      <div className="status-viewer-modal" onClick={onClose}>
        <div className="status-viewer-header p-3" onClick={(e) => e.stopPropagation()}>
          <div className="d-flex align-items-center">
            <ChatAvatar
              data={{
                avatar: !isCurrentStatusSponsored ? ImageBaseUrl + userAvatar : ImageBaseUrl + userAvatar,
                name: !isCurrentStatusSponsored ? userName : userName,
              }}
              customClass="avatar-lg mx-auto profile"
            />
            <div className="ms-3">
              <h6 className="mb-0">{userName}</h6>
              <small>{formatTimeAgo(currentStatus.created_at)}</small>
            </div>
          </div>
          <div className="d-flex">
            <button className="btn btn-link text-white status-viewer-btn p-2" onClick={onClose}>
              <X />
            </button>
            {!isCurrentStatusSponsored && !isOwn && (
              <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
                <DropdownToggle className="icon-btn hide-status button-effect" tag="button" color="">
                  <SvgIcon className="fill-light" iconId="header-toggle" />
                </DropdownToggle>
                <DropdownMenu end className="dropdown-menu-custom">
                  <DropdownItem className="d-flex align-items-center" onClick={() => toggleMuteStatus(userId)}>
                    <SvgIcon iconId="hide-eye" className="muted-status-icon" />
                    <h5 className="ms-2 mb-0">{isMuted ? 'Unmute' : 'Mute'}</h5>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            )}
          </div>
        </div>

        <div className="d-flex gap-1 px-3 pb-2" onClick={(e) => e.stopPropagation()}>
          {statuses.map((_, index) => (
            <div className="status-viewer-dot" key={index}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: 'white',
                  width: getProgressWidth(index),
                  transition: index !== currentIndex ? 'width 0.3s ease' : 'none',
                }}
              />
            </div>
          ))}
        </div>

        <div
          className="status-viewer-content flex-grow-1 d-flex align-items-center justify-content-center position-relative"
          onClick={(e) => e.stopPropagation()}
        >
          {(currentIndex > 0 || hasPreviousFeed) && (
            <button
              className="btn btn-link text-white position-absolute start-0 status-viewer-button"
              onClick={handlePrevious}
            >
              <ChevronLeft />
            </button>
          )}

          <div className="text-center status-viewer-current" onClick={handleContentClick}>
            {currentStatus.type === 'image' && currentStatus.file_url && (
              <img src={ImageBaseUrl + currentStatus.file_url} alt="status" />
            )}
            {currentStatus.type === 'video' && currentStatus.file_url && (
              <video ref={videoRef} src={ImageBaseUrl + currentStatus.file_url} playsInline preload="metadata" />
            )}
            {currentStatus.type === 'text' && <div className="status-viewer-text">{currentStatus.caption}</div>}

            {currentStatus.caption && currentStatus.type !== 'text' && (
              <p className="text-white mt-3 status-viewer-caption">{currentStatus.caption}</p>
            )}
            {isOwn && (
              <small
                className="text-primary d-flex align-items-center gap-1 mt-2 justify-content-center"
                onClick={(e) =>
                  currentStatus.views && currentStatus.views.length > 0 && handleViewersClick(e, currentStatus.views)
                }
                style={{ cursor: currentStatus.views && currentStatus.views.length > 0 ? 'pointer' : 'default' }}
              >
                <Eye size={14} /> {currentStatus.view_count} view{currentStatus.view_count !== 1 ? 's' : ''}
              </small>
            )}
          </div>

          {(currentIndex < statuses.length - 1 || hasNextFeed) && (
            <button
              className="btn btn-link text-white position-absolute end-0 status-viewer-index"
              onClick={handleNext}
            >
              <ChevronRight />
            </button>
          )}
        </div>

        {!isOwn && !isCurrentStatusSponsored && (
          <div className="status-reply-section" onClick={(e) => e.stopPropagation()}>
            <StatusReplyInput
              statusId={currentStatus.id}
              onFocus={pauseStatus}
              onBlur={resumeStatus}
              onSend={resumeStatus}
            />
          </div>
        )}
      </div>
      <ViewersModal
        isOpen={showViewersModal}
        onClose={() => setShowViewersModal(false)}
        viewers={selectedStatusViewers}
      />
    </>
  )

  return createPortal(modalContent, document.body)
}

export default StatusViewerModal
