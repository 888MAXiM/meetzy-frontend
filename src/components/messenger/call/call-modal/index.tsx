import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Button, Modal, ModalBody } from 'reactstrap'
import { ChatType, ImageBaseUrl } from '../../../../constants'
import { CHAT_CONSTANTS } from '../../../../constants/web'
import { useAppSelector } from '../../../../redux/hooks'
import { setCallParticipants, setCurrentCallStatus } from '../../../../redux/reducers/messenger/chatSlice'
import webrtcService from '../../../../services/webrtc-service'
import { SvgIcon } from '../../../../shared/icons'
import { Image } from '../../../../shared/image'
import { CallModalProps } from '../../../../types/components/chat'
import { CallParticipant, CallState } from '../../../../types/webrtc'
import CallControls from './CallControls'

const CallModal: FC<CallModalProps> = ({ isOpen, onClose, isMinimized, onMinimize, onMaximize }) => {
  const [callState, setCallState] = useState<CallState>(webrtcService.getCallState())
  const [participants, setParticipants] = useState<Map<string, CallParticipant>>(new Map())
  const [callDuration, setCallDuration] = useState<string>('00:00')
  const [isMaximized, setIsMaximized] = useState<boolean>(false)
  const [isManuallyMaximized, setIsManuallyMaximized] = useState<boolean>(false)
  const { user } = useAppSelector((store) => store.auth)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const screenShareViewRef = useRef<HTMLVideoElement>(null)
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const remoteAudiosRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const autoOpenedScreenShareRef = useRef(false)
  const dispatch = useDispatch()

  const attachLocalStream = useCallback(() => {
    const video = localVideoRef.current
    if (!video) return
    video.srcObject = null

    if (callState.isScreenSharing && callState.screenShareStream) {
      video.srcObject = callState.screenShareStream
    } else if (callState.callType === 'video' && callState.localStream && callState.isVideoEnabled) {
      video.srcObject = callState.localStream
    } else {
      video.srcObject = null
    }
    video.play().catch((error) => console.warn('Local video play error:', error))
  }, [
    callState.isScreenSharing,
    callState.screenShareStream,
    callState.callType,
    callState.localStream,
    callState.isVideoEnabled,
  ])

  const attachScreenShareView = useCallback(() => {
    const video = screenShareViewRef.current
    if (!video) return

    if (callState.isScreenSharing && callState.screenShareStream) {
      video.srcObject = callState.screenShareStream
      video.play().catch((error) => console.warn('Screen share view play error:', error))
    } else {
      video.srcObject = null
    }
  }, [callState.isScreenSharing, callState.screenShareStream])

  const attachRemoteVideos = useCallback(() => {
    if (callState.callType === 'video') {
      participants.forEach((participant) => {
        const participantIdStr = String(participant.userId)
        const currentUserIdStr = String(user?.id)

        if (participant.stream && participantIdStr !== currentUserIdStr) {
          const videoElement = remoteVideosRef.current.get(participantIdStr)
          if (videoElement && videoElement.srcObject !== participant.stream) {
            videoElement.srcObject = participant.stream
            videoElement.onloadedmetadata = () => {
              videoElement.play().catch((error) => console.warn('Remote video play error:', error))
            }
          }
        }
      })
    }
  }, [participants, user?.id, callState.callType])

  useEffect(() => {
    participants.forEach((participant) => {
      const participantIdStr = String(participant.userId)
      const currentUserIdStr = String(user?.id)

      if (participantIdStr === currentUserIdStr) return

      if (participant.stream) {
        let audioElement = remoteAudiosRef.current.get(participantIdStr)

        if (!audioElement) {
          audioElement = document.createElement('audio')
          audioElement.autoplay = true
          audioElement.setAttribute('playsinline', '')
          remoteAudiosRef.current.set(participantIdStr, audioElement)
        }

        if (audioElement.srcObject !== participant.stream) {
          // Clean up old stream if exists
          if (audioElement.srcObject) {
            const oldStream = audioElement.srcObject as MediaStream
            oldStream.getTracks().forEach(track => {
              track.stop()
              oldStream.removeTrack(track)
            })
          }
          
          audioElement.srcObject = participant.stream
          
          // Ensure audio is playing
          audioElement.play().catch((error) => {
            console.warn(`Audio play error for user ${participantIdStr}:`, error)
            // Retry after a short delay
            setTimeout(() => {
              audioElement?.play().catch(err => 
                console.warn(`Audio play retry failed for user ${participantIdStr}:`, err)
              )
            }, 100)
          })
        } else if (audioElement.paused) {
          // If audio element exists but is paused, try to play it
          audioElement.play().catch((error) => {
            console.warn(`Audio resume error for user ${participantIdStr}:`, error)
          })
        }
      }
    })

    const currentParticipantIds = new Set(Array.from(participants.keys()).map((id) => String(id)))

    remoteAudiosRef.current.forEach((audioElement, userId) => {
      if (!currentParticipantIds.has(String(userId))) {
        if (audioElement.srcObject) {
          const stream = audioElement.srcObject as MediaStream
          stream.getTracks().forEach(track => {
            track.stop()
            stream.removeTrack(track)
          })
        }
        audioElement.pause()
        audioElement.srcObject = null
        audioElement.load() // Reset audio element
        remoteAudiosRef.current.delete(userId)
      }
    })
  }, [participants, user?.id])

  // Apply audio output mode (speaker/microphone) to all remote audio elements
  useEffect(() => {
    if (callState.callStatus !== 'connected') return

    const applyAudioOutput = async () => {
      try {
        // Request permission to access device labels (required for accurate device enumeration)
        await navigator.mediaDevices.getUserMedia({ audio: true })
        
        // Get available audio output devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
        
        let targetDeviceId: string | null = null
        
        if (callState.audioOutputMode === 'speaker') {
          // Find speaker device - prioritize devices with 'speaker' in label
          const speakerDevice = audioOutputs.find(device => 
            device.label.toLowerCase().includes('speaker') || 
            device.label.toLowerCase().includes('loudspeaker')
          )
          // If no specific speaker found, use default or first available
          targetDeviceId = speakerDevice?.deviceId || audioOutputs.find(d => d.deviceId === 'default')?.deviceId || audioOutputs[0]?.deviceId || 'default'
        } else {
          // For microphone/earpiece mode, find earpiece or headset
          const earpieceDevice = audioOutputs.find(device => {
            const label = device.label.toLowerCase()
            return label.includes('earpiece') ||
                   label.includes('receiver') ||
                   label.includes('headset') ||
                   label.includes('phone')
          })
          // If no earpiece found, use the first non-speaker device or default
          targetDeviceId = earpieceDevice?.deviceId || 
                          audioOutputs.find(d => !d.label.toLowerCase().includes('speaker'))?.deviceId ||
                          audioOutputs[0]?.deviceId || 
                          'default'
        }

        // Apply to all remote audio elements
        const promises = Array.from(remoteAudiosRef.current.values()).map(async (audioElement) => {
          if (audioElement && 'setSinkId' in audioElement) {
            try {
              await (audioElement as any).setSinkId(targetDeviceId || 'default')
            } catch (error) {
              console.warn('Failed to set audio sink:', error)
            }
          }
        })
        
        await Promise.all(promises)
      } catch (error) {
        console.warn('Failed to enumerate audio devices:', error)
        // Fallback: try to set default for all audio elements
        remoteAudiosRef.current.forEach(async (audioElement) => {
          if (audioElement && 'setSinkId' in audioElement) {
            try {
              await (audioElement as any).setSinkId('default')
            } catch (err) {
              console.warn('Failed to set default audio sink:', err)
            }
          }
        })
      }
    }

    applyAudioOutput()
  }, [callState.audioOutputMode, callState.callStatus])

  useEffect(() => {
    setParticipants(new Map())
    remoteVideosRef.current.forEach((video) => {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream
        stream.getTracks().forEach((track) => {
          track.stop()
          stream.removeTrack(track)
        })
        video.srcObject = null
        video.load() // Reset video element
      }
    })
    remoteVideosRef.current.clear()
    remoteAudiosRef.current.forEach((audio) => {
      if (audio.srcObject) {
        const stream = audio.srcObject as MediaStream
        stream.getTracks().forEach((track) => {
          track.stop()
          stream.removeTrack(track)
        })
        audio.srcObject = null
      }
      audio.pause()
      audio.load() // Reset audio element
    })
    remoteAudiosRef.current.clear()
  }, [callState.callId])

  useEffect(() => {
    const unsubscribeState = webrtcService.onStateChange(setCallState)
    const unsubscribeParticipants = webrtcService.onParticipantUpdate(setParticipants)

    return () => {
      unsubscribeState()
      unsubscribeParticipants()
    }
  }, [])

  useEffect(() => {
    dispatch(
      setCallParticipants({
        participants: Array.from(participants.values()).map((p) => p.userId),
        channelId: callState.chatId,
        chatType: callState.chatType,
      }),
    )
  }, [participants, dispatch, callState.chatId, callState.chatType])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (callState.callStatus === 'connected') {
      const startTime = new Date()

      interval = setInterval(() => {
        const now = new Date()
        const diff = now.getTime() - startTime.getTime()
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }, 1000)
    } else {
      setCallDuration('00:00')
    }

    return () => clearInterval(interval)
  }, [callState.callStatus])

  useEffect(() => {
    let timer: NodeJS.Timeout

    const attachStream = () => {
      const video = localVideoRef.current
      if (video && callState.callType === 'video' && (callState.localStream || callState.screenShareStream)) {
        if (callState.isScreenSharing && callState.screenShareStream) {
          video.srcObject = callState.screenShareStream
        } else {
          video.srcObject = callState.localStream
        }
        video.onloadedmetadata = () => {
          video.play().catch((error) => console.warn('Local video play error:', error))
        }
      } else if (callState.localStream || callState.screenShareStream) {
        timer = setTimeout(attachStream, 100)
      }
    }

    attachStream()
    return () => clearTimeout(timer)
  }, [callState.localStream, callState.screenShareStream, callState.callType, isMinimized, callState.isScreenSharing])

  useEffect(() => {
    if (callState.callType === 'video') {
      participants.forEach((participant) => {
        const participantIdStr = String(participant.userId)
        const currentUserIdStr = String(user?.id)

        if (participant.stream && participantIdStr !== currentUserIdStr) {
          const videoElement = remoteVideosRef.current.get(participantIdStr)
          if (videoElement) {
            videoElement.srcObject = participant.stream
            videoElement.onloadedmetadata = () => {
              videoElement.play().catch((error) => console.warn('Remote video play error:', error))
            }
          }
        }
      })
    }
  }, [participants, user?.id, callState.callType, isMinimized])

  useEffect(() => {
    if (!isMinimized && callState.callType === 'video') {
      const timer = setTimeout(() => {
        attachLocalStream()
        attachRemoteVideos()
        attachScreenShareView()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isMinimized, attachLocalStream, attachRemoteVideos, attachScreenShareView, callState.callType])

  useEffect(() => {
    if (callState.callStatus === 'ringing' && !callState.isInitiator) {
      const timer = setTimeout(() => {
        handleDeclineCall()
      }, CHAT_CONSTANTS.AUTO_DECLINE_CALL)
      return () => clearTimeout(timer)
    }
  }, [callState.callStatus, callState.isInitiator])

  useEffect(() => {
    if (callState.callStatus === 'calling' && callState.isInitiator) {
      const timer = setTimeout(() => {
        handleEndCall()
      }, CHAT_CONSTANTS.AUTO_DECLINE_CALL)
      return () => clearTimeout(timer)
    }
  }, [callState.callStatus, callState.isInitiator])

  const handleEndCall = async () => {
    await webrtcService.endCall()
    onClose()
  }

  const handleDeclineCall = async () => {
    await webrtcService.declineCall(callState.callId!)
    onClose()
  }

  const handleMaximizeScreen = () => {
    setIsMaximized(true)
    setIsManuallyMaximized(true)
  }

  const handleRestoreScreen = () => {
    setIsMaximized(false)
    setIsManuallyMaximized(false)
  }

  useEffect(() => {
    attachLocalStream()
  }, [attachLocalStream])

  useEffect(() => {
    attachScreenShareView()
  }, [attachScreenShareView])

  useEffect(() => {
    const video = localVideoRef.current
    if (!video) return
    if (!callState.isScreenSharing && !callState.isVideoEnabled) {
      video.srcObject = null
      video.load()
    }
  }, [callState.isScreenSharing, callState.isVideoEnabled])

  useEffect(() => {
    const isAnyoneScreenSharing =
      callState.isScreenSharing ||
      Array.from(participants.values()).some((participant) => {
        const participantIdStr = String(participant.userId)
        const currentUserIdStr = String(user?.id)
        return participant.isScreenSharing && participantIdStr !== currentUserIdStr
      })
    if (isAnyoneScreenSharing && !autoOpenedScreenShareRef.current) {
      setIsMaximized(true)
      autoOpenedScreenShareRef.current = true
    } else if (!isAnyoneScreenSharing && !isManuallyMaximized) {
      autoOpenedScreenShareRef.current = false
      setIsMaximized(false)
    }
  }, [callState.isScreenSharing, callState.screenShareStream, participants, user?.id, isManuallyMaximized])

  const getCallStatusText = () => {
    switch (callState.callStatus) {
      case 'calling':
        return 'Calling...'
      case 'ringing':
        return 'Incoming call'
      case 'connected':
        return callDuration
      default:
        return ''
    }
  }

  useEffect(() => {
    dispatch(setCurrentCallStatus(callState.callStatus))
  }, [callState.callStatus, dispatch])

  const getCallerName = () => {
    if (
      callState.chatType === ChatType.DM &&
      !callState.isInitiator &&
      callState.callStatus === 'connected' &&
      user?.id
    ) {
      const caller = Array.from(participants.values()).find((p) => {
        const participantIdStr = String(p.userId)
        const currentUserIdStr = String(user.id)
        return participantIdStr !== currentUserIdStr
      })
      return caller?.name || 'Caller'
    }
    return callState.chatName || 'Unknown'
  }

  const remoteParticipants = useMemo(() => {
    if (!user?.id || !callState.callId) return []
    const currentUserIdStr = String(user?.id)
    return Array.from(participants.values()).filter((p) => {
      return String(p.userId) !== currentUserIdStr
    })
  }, [participants, user?.id, callState.callId])

  // Check if local user is screen sharing
  const isLocalScreenSharing = callState.isScreenSharing && callState.screenShareStream

  if (!isOpen || !callState.callId) return null

  if (isMinimized) {
    return (
      <div className="call-minimized">
        <div className="minimized-call-info">
          <div className="call-avatar">
            {callState.callType === 'video' && (callState.localStream || callState.screenShareStream) ? (
              <video ref={localVideoRef} autoPlay muted playsInline className="minimized-video" />
            ) : (
              <div className="avatar-placeholder">{user?.name?.charAt(0)}</div>
            )}
          </div>
          <div className="call-details">
            <span className="caller-name">{getCallerName()}</span>
            <span className="call-time">{callDuration}</span>
          </div>
          <div className="minimized-controls">
            <Button color="link" size="sm" onClick={onMaximize} className="expand-btn btn-primary">
              <SvgIcon iconId="expand" />
            </Button>
            <Button color="danger" size="sm" onClick={handleEndCall} className="end-call-btns">
              <SvgIcon iconId="end-call-vc" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      toggle={() => {}}
      size="sm"
      centered
      backdrop="static"
      keyboard={false}
      className={`call-modal ${isMaximized ? 'maximize-screen' : ''}`}
    >
      <ModalBody className="p-0">
        <div className="call-container">
          <div className="call-header">
            <div className="name-aligns">
              <span className="call-duration">{getCallStatusText()}</span>
            </div>
            <div className="call-actions">
              {callState.callType === 'video' && (
                <>
                  {isMaximized ? (
                    <Button
                      color="link"
                      size="sm"
                      onClick={handleRestoreScreen}
                      className="expand-btn btn-button-glass"
                      title="Restore"
                    >
                      <SvgIcon iconId="minimize" />
                    </Button>
                  ) : (
                    <Button
                      color="link"
                      size="sm"
                      onClick={handleMaximizeScreen}
                      className="expand-btn btn-button-glass"
                      title="Maximize"
                    >
                      <SvgIcon iconId="expand" />
                    </Button>
                  )}
                </>
              )}
              {(callState.callType === 'audio' || !isMaximized) && (
                <Button
                  color="link"
                  size="sm"
                  onClick={onMinimize}
                  className="minimize-btn btn-button-glass"
                  title="Minimize"
                >
                  <SvgIcon iconId="minimize" />
                </Button>
              )}
            </div>
          </div>

          <div className="video-area">
            {callState.callType === 'video' ? (
              <div
                key={`call-${callState.callId}`}
                className={`video-grid custom-scrollbar ${
                  callState.isVideoEnabled || remoteParticipants.some((p) => p.isVideoEnabled) ? 'both-videos-on' : ''
                }`}
              >
                {/* Large Screen Share View for Local User */}
                {isLocalScreenSharing && (
                  <div className="video-container local-video shared-screen">
                    <video ref={screenShareViewRef} autoPlay muted playsInline className="video-element" />
                    <div className="video-overlay">
                      <span className="participant-name">You (Screen Sharing)</span>
                    </div>
                  </div>
                )}

                {/* Local Video - Only show when NOT screen sharing */}
                {!isLocalScreenSharing && (
                  <div className="video-container local-video no-screen-shared">
                    {callState.localStream ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`video-element${!callState.isVideoEnabled ? ' video-disabled' : ''}`}
                        style={{ cursor: callState.isVideoEnabled ? 'pointer' : 'default' }}
                      />
                    ) : null}
                    {!callState.isVideoEnabled && (
                      <div className="video-placeholder">
                        {user?.avatar ? (
                          <Image
                            src={ImageBaseUrl + user.avatar}
                            alt={user.name || 'user-avatar'}
                            className="avatar-img"
                          />
                        ) : (
                          <div className="avatar-placeholder">{user?.name?.charAt(0)}</div>
                        )}
                        {!callState.isAudioEnabled && <SvgIcon iconId="mic-off" className="muted-indicator" />}
                        <SvgIcon iconId="video-off" className="video-off-indicator" />
                      </div>
                    )}
                    <div className="video-overlay">
                      <span className="participant-name">You</span>
                    </div>
                  </div>
                )}

                {/* Remote Videos */}
                {remoteParticipants.length > 0 &&
                  remoteParticipants.map((participant) => (
                    <div
                      key={`${callState.callId}-participant-${participant.userId}`}
                      className={`video-container remote-video-${participant.userId} ${
                        participant.isScreenSharing ? 'shared-screen' : 'no-screen-shared'
                      }`}
                    >
                      {participant.stream ? (
                        <video
                          ref={(el) => {
                            if (el) remoteVideosRef.current.set(String(participant.userId), el)
                          }}
                          autoPlay
                          playsInline
                          className={`video-element${
                            !(participant.isVideoEnabled || participant.isScreenSharing) ? ' video-disabled' : ''
                          }`}
                          style={{
                            cursor: participant.isVideoEnabled || participant.isScreenSharing ? 'pointer' : 'default',
                          }}
                        />
                      ) : null}
                      {!(participant.isVideoEnabled || participant.isScreenSharing) && (
                        <div className="video-placeholder">
                          {participant.avatar ? (
                            <Image
                              src={ImageBaseUrl + participant.avatar}
                              alt={participant.name}
                              className="avatar-img"
                            />
                          ) : (
                            <div className="avatar-placeholder">{participant.name?.charAt(0)}</div>
                          )}
                          {!participant.isAudioEnabled && <SvgIcon iconId="mic-off" className="muted-indicator" />}
                          {callState.callType === 'video' &&
                            !(participant.isVideoEnabled || participant.isScreenSharing) && (
                              <SvgIcon iconId="video-off" className="video-off-indicator" />
                            )}
                        </div>
                      )}
                      <div className="video-overlay">
                        <span className="participant-name">
                          {participant.name} {participant.isScreenSharing ? '(Screen Sharing)' : ''}
                          {!participant.isAudioEnabled && participant.isVideoEnabled && (
                            <SvgIcon iconId="mic-off" className="muted-indicator" />
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              /* Audio Call UI */
              <div className="audio-call-ui">
                <div className="audio-participants custom-scrollbar-side-panel">
                  <div className="participant-avatar local">
                    <div className="avatar-circle">
                      {user?.avatar ? (
                        <Image src={ImageBaseUrl + user.avatar} alt={user.name || 'user-avatar'} />
                      ) : (
                        user?.name?.charAt(0)
                      )}
                    </div>
                    <span className="participant-name">You</span>
                    {!callState.isAudioEnabled && <SvgIcon iconId="mic-off" className="muted-indicator" />}
                  </div>
                  {remoteParticipants.map((participant) => (
                    <div key={participant.userId} className="participant-avatar remote">
                      <div className="avatar-circle">
                        {participant.avatar ? (
                          <Image src={ImageBaseUrl + participant.avatar} alt={participant.name} />
                        ) : (
                          participant.name?.charAt(0)
                        )}
                      </div>
                      <span className="participant-name">{participant.name}</span>
                      {!participant.isAudioEnabled && <SvgIcon iconId="mic-off" className="muted-indicator" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <CallControls callState={callState} onClose={onClose} />
        </div>
      </ModalBody>
    </Modal>
  )
}

export default CallModal
