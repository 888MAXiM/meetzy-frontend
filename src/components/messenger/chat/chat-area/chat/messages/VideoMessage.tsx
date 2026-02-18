import { ImageBaseUrl } from '../../../../../../constants'
import { Message } from '../../../../../../types/api'
import DecryptedMessage from './DecryptedMessage'

const VideoMessage = ({ message }: { message: Message }) => {
  if (!message?.file_url) return
  return (
    <>
      <div className="message-video">
        <video
          controls
          className="chat-media-video"
          onError={() => console.warn('Video failed to load:', message.file_url)}
        >
          <source src={ImageBaseUrl + message?.file_url} type="video/mp4" />
          <source src={ImageBaseUrl + message?.file_url} type="video/webm" />
          <source src={ImageBaseUrl + message?.file_url} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
        {message.content && (
          <h5>
            <DecryptedMessage message={message}>
              {(decryptedContent) => decryptedContent}
            </DecryptedMessage>
          </h5>
        )}
      </div>
    </>
  )
}

export default VideoMessage
