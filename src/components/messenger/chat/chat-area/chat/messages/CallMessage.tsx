import { useEffect, useState } from 'react'
import { Button } from 'reactstrap'
import { SvgIcon } from '../../../../../../shared/icons'
import { Message } from '../../../../../../types/api'
import { getMetadata } from '../../../../../../utils'
import webrtcService from '../../../../../../services/webrtc-service'
import { useAppSelector } from '../../../../../../redux/hooks'
import { ChatType } from '../../../../../../constants'

const CallMessage = ({ message, isSent }: { message: Message; isSent: boolean }) => {
  const metadata: Message['metadata'] = getMetadata(message) ?? {}
  const { user } = useAppSelector((store) => store.auth)
  const [elapsedTime, setElapsedTime] = useState<string>('')
  const [showJoinButton, setShowJoinButton] = useState(false)
  const callType = metadata.call_type || 'audio'
  const durationInSeconds = typeof metadata.duration === 'number' ? metadata.duration : 0
  const action = metadata.action || ''
  const callId = metadata.call_id
  const callMode = metadata.call_mode || 'direct'
  const joinedCount = metadata.joined_count ?? 0
  const acceptedTime = metadata.accepted_time
  const isActuallyOngoing = callMode === 'group' 
    ? joinedCount >= 2 && action !== 'ended'
    : action === 'ongoing' || action === 'accepted'
  
  const isOngoing = action === 'ongoing' || action === 'accepted'

  const hasDuration = durationInSeconds > 0
  const isInitiated = action === 'initiated'

  useEffect(() => {
    if (isActuallyOngoing) {
      const updateTimer = () => {
        let startTime: Date | null = null
        
        if (callId) {
          const callState = webrtcService.getCallState()
          if (callState.isInCall && callState.callId === String(callId) && callState.callStartTime) {
            startTime = callState.callStartTime
          }
        }
        
        // If not in call, try to get accepted_time from metadata
        if (!startTime && acceptedTime) {
          try {
            const parsed = new Date(acceptedTime)
            if (!isNaN(parsed.getTime())) {
              startTime = parsed
            }
          } catch (e) {
            // Invalid date
          }
        }

        if (!startTime && message.updated_at) {
          const updated = new Date(message.updated_at)
          const now = new Date()
          const diff = now.getTime() - updated.getTime()
          if (!isNaN(updated.getTime()) && diff > 0 && diff < 3600000) {
            startTime = updated
          }
        }
        
        if (startTime && !isNaN(startTime.getTime())) {
          const now = new Date()
          const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startTime.getTime()) / 1000))
          const mins = Math.floor(elapsedSeconds / 60)
          const secs = elapsedSeconds % 60
          setElapsedTime(`${mins}:${secs.toString().padStart(2, '0')}`)
        } else {
          setElapsedTime('0:00')
        }
      }

      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    } else {
      setElapsedTime('')
    }
  }, [isActuallyOngoing, acceptedTime, callId, message.updated_at])

  useEffect(() => {
    if (callMode === 'group' && isActuallyOngoing && callId && user) {
      const callState = webrtcService.getCallState()
      const isUserInCall = callState.isInCall && callState.callId === String(callId)
      setShowJoinButton(!isUserInCall)
    } else if (callMode === 'direct' && isOngoing && callId && user) {
      const callState = webrtcService.getCallState()
      const isUserInCall = callState.isInCall && callState.callId === String(callId)
      setShowJoinButton(!isUserInCall)
    } else {
      setShowJoinButton(false)
    }
  }, [callMode, joinedCount, callId, user, action, isActuallyOngoing, isOngoing])

  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds === 0) return 'Call'
    const mins = Math.floor(Math.floor(seconds) / 60)
    const secs = Math.floor(seconds) % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const iconBgClass = 
    (action === 'ended' && durationInSeconds > 0)
      ? 'bg-success'
      : isActuallyOngoing
      ? 'bg-success'
      : (action === 'missed' || action === 'declined')
      ? 'bg-danger'
      : 'bg-danger'

  const iconColorClass = 
    isSent || (action === 'ended' && durationInSeconds > 0) || isActuallyOngoing || (action === 'missed' || action === 'declined')
      ? 'stroke-white'
      : 'stroke-primary'

  const getStatusText = () => {
    if (isActuallyOngoing) {
      if (callMode === 'group') {
        return `Ongoing • ${elapsedTime || '0:00'} • ${joinedCount} in call`
      }
      return `Ongoing • ${elapsedTime || '0:00'}`
    }
    
    if (action === 'missed') {
      return isSent ? 'No Answer' : 'Missed call'
    }
    if (action === 'declined') {
      return 'No Answer'
    }
    if (action === 'ended') {
      if (hasDuration) {
        return `Duration: ${formatDuration(durationInSeconds)}`
      }
      if (callMode === 'group' && joinedCount > 0) {
        return 'Call ended'
      }
      return 'Call ended'
    }
    if (isInitiated) {
      const isIncomingCall = !isSent
      return isIncomingCall ? 'Incoming call' : 'Outgoing call'
    }
    return 'Call'
  }

  const handleJoinCall = async () => {
    if (!callId || !user) return

    try {
      const chatId = message.group_id || message.recipient_id || message.sender_id
      const chatName = message.group?.name || message.sender?.name || 'Call'
      const chatType = message.group_id ? 'group' : 'direct'
      const safeUser = {
        id: user.id,
        name: user.name ?? undefined,
        avatar: user.avatar ?? undefined,
      }
   
      const success = await webrtcService.joinOngoingCall(
        String(callId),
        chatId,
        chatName,
        chatType === 'group' ? ChatType.group : ChatType.DM,
        callType as 'audio' | 'video',
        safeUser,
      )

      if (!success) {
        console.error('Failed to join ongoing call')
      }
    } catch (error) {
      console.error('Failed to join call:', error)
    }
  }

  return (
    <div
      className={`call-message d-flex align-items-center gap-2 p-2 py-sm-2 py-1 rounded call-msg-round ${
        isSent ? 'bg-primary text-white' : 'bg-light'
      }`}
    >
      <div className={`svg-wrapper rounded-circle d-flex align-items-center justify-content-center ${iconBgClass}`}>
        <SvgIcon className={iconColorClass} iconId={callType === 'video' ? 'video-call' : 'call'} />
      </div>

      <div className="flex-grow-1">
        <div className="fw-semibold text-capitalize">{callType === 'video' ? 'Video Call' : 'Voice Call'}</div>
        <div className={isSent ? 'text-white-50' : 'text-muted'}>{getStatusText()}</div>
      </div>

      {showJoinButton && (
        <Button 
          color="success" 
          size="sm" 
          onClick={handleJoinCall}
          className="ms-2"
        >
          Join Now
        </Button>
      )}
    </div>
  )
}

export default CallMessage
