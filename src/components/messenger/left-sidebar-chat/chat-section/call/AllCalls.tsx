import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video } from 'react-feather'
import { queries } from '../../../../../api'
import {
  CallDirection,
  CallFilter,
  CallStatus,
  CallsType,
  ChatType,
  ICON_SIZE,
  ImagePath,
  ITEMS_PER_PAGE,
} from '../../../../../constants'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { setActiveCallUser } from '../../../../../redux/reducers/messenger/chatSlice'
import webrtcService from '../../../../../services/webrtc-service'
import { Image } from '../../../../../shared/image'
import { CallHistoryItem } from '../../../../../types/api'
import { AllCallProps } from '../../../../../types/components/chat'
import { formatTime } from '../../../../../utils'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'

const AllCall: React.FC<AllCallProps> = ({ filter, searchTerm }) => {
  const dispatch = useAppDispatch()
  const { activeCallUser } = useAppSelector((state) => state.chat)
  const { user } = useAppSelector((state) => state.auth)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const { data: callHistory, isLoading, isError } = queries.useGetCallHistory(page, ITEMS_PER_PAGE, filter, searchTerm)

  const getCallIcon = useCallback((call: CallHistoryItem) => {
    if (call.status === CallStatus.Missed) {
      return <PhoneMissed size={ICON_SIZE.SMALL} className="text-danger" />
    }
    return call.direction === CallDirection.Incoming ? (
      <PhoneIncoming size={ICON_SIZE.SMALL} className="text-success" />
    ) : (
      <PhoneOutgoing size={ICON_SIZE.SMALL} className="text-primary" />
    )
  }, [])

  const getCallStatusColor = useCallback((call: CallHistoryItem): string => {
    if (call.status === CallStatus.Missed) return 'danger'
    return call.direction === CallDirection.Incoming ? 'success' : 'primary'
  }, [])

  const getCallTypeIcon = useCallback((callType: CallsType) => {
    return callType === CallsType.Video ? <Video size={ICON_SIZE.MEDIUM} /> : <Phone size={ICON_SIZE.MEDIUM} />
  }, [])

  const getParticipantName = useCallback((call: CallHistoryItem): string => {
    return call.isGroupCall && call.group ? call.group.name : call.participantNames[0] || 'Unknown'
  }, [])

  const getParticipantAvatar = useCallback((call: CallHistoryItem): string | null => {
    if (call.isGroupCall && call.group?.avatar) {
      return call.group.avatar
    }
    const participant = call.direction === CallDirection.Incoming ? call.initiator : call.receiver
    return participant?.avatar || null
  }, [])

  const handleCallClick = useCallback(
    (call: CallHistoryItem) => {
      const participantId = call.isGroupCall
        ? call.group?.id
        : call.direction === CallDirection.Incoming
        ? call.initiator.id
        : call.receiver?.id
      dispatch(
        setActiveCallUser({
          userName: getParticipantName(call),
          userId: participantId || 0,
          userImage: getParticipantAvatar(call) || '',
        }),
      )
    },
    [dispatch, getParticipantName, getParticipantAvatar],
  )

  const handleInitiateCall = useCallback(
    async (e: React.MouseEvent, call: CallHistoryItem) => {
      e.stopPropagation() // Prevent triggering handleCallClick
      if (!user) return

      // Determine chatId based on call type and direction
      let chatId: number | string | undefined
      if (call.isGroupCall) {
        chatId = call.group?.id
      } else {
        // For direct calls, use the other participant's ID
        chatId = call.direction === CallDirection.Incoming ? call.initiator.id : call.receiver?.id
      }

      if (!chatId) return

      const chatName = getParticipantName(call)
      const chatType = call.callMode === 'group' ? ChatType.group : ChatType.DM
      const callType = call.callType === CallsType.Video ? 'video' : 'audio'

      try {
        await webrtcService.initiateCall(chatId, chatName, chatType, callType, {
          id: user.id || '',
          name: user.name || '',
          avatar: (user as any).avatar || null,
        })
      } catch (error) {
        console.error('Failed to initiate call:', error)
      }
    },
    [user, getParticipantName],
  )

  const handleLoadMore = useCallback(() => {
    setPage((prev) => prev + 1)
  }, [])

  const emptyStateMessage = useMemo(() => {
    const filterText = filter !== CallFilter.All ? ` ${filter}` : ''
    if (searchTerm) {
      return `No matching${filterText} calls found`
    }
    return (
      <div className="empty-state text-center">
        <div className="mb-3">
          <Image src={`${ImagePath}/gif/download.gif`} />
        </div>
        <h5>No {filterText} calls found</h5>
        <p className="text-muted">You don't have any {filterText} calls at the moment</p>
      </div>
    )
  }, [filter, searchTerm])

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (isError || !callHistory) {
    return <div className="text-center p-4 text-danger">Failed to load call history</div>
  }

  if (Object.keys(callHistory.calls).length === 0) {
    return <div className="text-center p-4 text-muted">{emptyStateMessage}</div>
  }

  return (
    <ul className="call-log-main custom-scroll">
      {Object.entries(callHistory.calls).map(([dateLabel, calls]) => (
        <Fragment key={dateLabel}>
          <li className="call-date-separator">
            <span className="text-muted small">{dateLabel}</span>
          </li>
          {calls.map((call) => {
            const participantAvatar = getParticipantAvatar(call)
            const participantName = getParticipantName(call)
            const isActive = activeCallUser?.userId === call.id
            return (
              <li className={isActive ? 'active' : ''} key={call.id} onClick={() => handleCallClick(call)}>
                <div className="call-box call-tabs">
                  <div className="profile">
                    <ChatAvatar
                      data={{ avatar: participantAvatar, name: participantName }}
                      name={{ name: participantName }}
                    />
                  </div>
                  <div className="details">
                    <h4>{participantName}</h4>
                    {call.isGroupCall && <span className="badge bg-secondary small">Group</span>}
                    <p>
                      {getCallIcon(call)}
                      <span className="ms-1">{call.duration || formatTime(call.timestamp)}</span>
                    </p>
                  </div>
                  <div className="call-status">
                    <div
                      className={`icon-btn bg-light-${getCallStatusColor(call)} button-effect btn-sm`}
                      onClick={(e) => handleInitiateCall(e, call)}
                    >
                      {getCallTypeIcon(call.callType)}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </Fragment>
      ))}
      {callHistory.pagination.hasNext && (
        <li className="text-center p-3">
          <button className="btn btn-sm btn-outline-primary" onClick={handleLoadMore}>
            Load More
          </button>
        </li>
      )}
    </ul>
  )
}

export default AllCall
