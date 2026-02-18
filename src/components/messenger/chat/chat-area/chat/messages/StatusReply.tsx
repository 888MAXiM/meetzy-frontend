import { ImageBaseUrl } from '../../../../../../constants'
import { Message } from '../../../../../../types/api'
import { SvgIcon } from '../../../../../../shared/icons'
import { useAppSelector } from '../../../../../../redux/hooks'
import { Image } from '../../../../../../shared/image'

const StatusReply = ({ message }: { message: Message }) => {
  const { user } = useAppSelector((store) => store.auth)
  const statusType = message.metadata?.status_type
  const statusFileUrl = message.metadata?.status_file_url
  const statusCaption = message.metadata?.status_caption
  const statusOwnerName = (user?.id === message.recipient?.id ? 'You' : message.recipient?.name) || 'Status'

  return (
    <div className="status-reply-message">
      <div className="status-reply-message-bar" />
      <div className="status-reply-message-content">
        <div className="status-reply-message-body">
          <div className="status-info">
            <div className="status-reply-message-header">
              <span className="status-reply-owner">{statusOwnerName + ' · Status'}</span>
            </div>
            {statusType === 'text' && <div className="status-reply-text-preview">{statusCaption || 'Text status'}</div>}
            {statusCaption && statusType !== 'text' && <p className="status-reply-caption">{statusCaption}</p>}
          </div>
          {statusType === 'image' && (
            <div className="status-reply-thumbnail">
              {statusFileUrl && <Image src={ImageBaseUrl + statusFileUrl} alt="status" />}
            </div>
          )}
          {statusType === 'video' && (
            <div className="status-reply-thumbnail">
              <video src={ImageBaseUrl + statusFileUrl} playsInline muted />
              <div className="status-reply-play-overlay">
                <SvgIcon iconId="play" className="status-reply-play-icon" />
              </div>
            </div>
          )}
        </div>
        {message.content && <div className="status-reply-user-message">{message.content}</div>}
      </div>
    </div>
  )
}

export default StatusReply
