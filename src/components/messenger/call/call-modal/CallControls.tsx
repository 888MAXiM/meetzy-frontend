// @ts-nocheck
import { Button } from 'reactstrap'
import { SvgIcon } from '../../../../shared/icons'
import { useAppSelector } from '../../../../redux/hooks';
import { CallState } from '../../../../types/webrtc';
import webrtcService from '../../../../services/webrtc-service';

const CallControls = ({ callState, onClose }: { callState: CallState; onClose: () => void }) => {
  const { user } = useAppSelector((store) => store.auth)
  const { allow_screen_share } = useAppSelector((state) => state.settings)
  const handleToggleVideo = async () => {
    await webrtcService.toggleVideo()
  }

  const handleToggleAudio = async () => {
    await webrtcService.toggleAudio()
  }

  const handleAcceptCall = async () => {
    if (user) {
      await webrtcService.acceptCall(callState.callId!, user)
    }
  }
  const handleDeclineCall = async () => {
    await webrtcService.declineCall(callState.callId!)
    onClose()
  }
  const handleEndCall = async () => {
    await webrtcService.endCall()
    onClose()
  }
  const handleStartScreenShare = async () => {
    await webrtcService.startScreenShare()
  }

  const handleStopScreenShare = async () => {
    await webrtcService.stopScreenShare()
  }

  const handleToggleAudioOutput = async () => {
    await webrtcService.toggleAudioOutput()
  }

  return (
    <div className="call-controls">
      {callState.callStatus === 'ringing' && !callState.isInitiator ? (
        /* Incoming Call Controls */
        <div className="incoming-call-controls">
          <Button color="success" size="lg" onClick={handleAcceptCall} className="control-btn accept-btn">
            <SvgIcon iconId="phone" />
          </Button>
          <Button color="danger" size="lg" onClick={handleDeclineCall} className="control-btn decline-btn">
            <SvgIcon iconId="end-call-vc" className='common-svg-hw' />
          </Button>
        </div>
      ) : (
        /* Active Call Controls */
        <div className="active-call-controls">
          <Button
            color={callState.isAudioEnabled ? 'secondary' : 'danger'}
            onClick={handleToggleAudio}
            className="control-btn"
            title={callState.isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            <SvgIcon iconId={callState.isAudioEnabled ? 'mic' : 'mic-off'} />
          </Button>

          {/* Speaker/Microphone Toggle */}
          {callState.callStatus === 'connected' && (
            <Button
              color={callState.audioOutputMode === 'speaker' ? 'primary' : 'secondary'}
              onClick={handleToggleAudioOutput}
              className="control-btn"
              title={callState.audioOutputMode === 'speaker' ? 'Switch to microphone' : 'Switch to speaker'}
            >
              {callState.audioOutputMode === 'speaker' ? (
                <SvgIcon iconId="speaker" />
              ) : (
                <SvgIcon iconId="speaker-off" />
              )}
            </Button>
          )}

          {callState.callType === 'video' && (
            <>
              <Button
                color={callState.isVideoEnabled ? 'primary' : 'danger'}
                onClick={handleToggleVideo}
                className="control-btn"
                title={callState.isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                <SvgIcon iconId={callState.isVideoEnabled ? 'video' : 'video-off'} />
              </Button>
              {callState.callStatus === 'connected' && allow_screen_share && (
                  <Button
                    color="button-glass"
                    onClick={callState.isScreenSharing ? handleStopScreenShare : handleStartScreenShare}
                    className="control-btn"
                    title={callState.isScreenSharing ? 'Stop sharing' : 'Share screen'}
                  >
                    <SvgIcon iconId={callState.isScreenSharing ? 'monitor-off' : 'monitor'} />
                  </Button>
                )}
            </>
          )}
          <Button color="danger" onClick={handleEndCall} className="control-btn end-call-btn" title="End call">
            <SvgIcon iconId="end-call-vc" className='common-svg-hw' />
          </Button>
        </div>
      )}
    </div>
  )
}

export default CallControls
