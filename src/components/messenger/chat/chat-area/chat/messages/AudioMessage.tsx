import { ImageBaseUrl } from '../../../../../../constants'
import { Message } from '../../../../../../types/api'

const AudioMessage = ({ message }: { message: Message }) => {
  const audioUrl = message.file_url ? `${ImageBaseUrl || ''}${message.file_url}` : ''

  if (!audioUrl) {
    return null
  }

  return (
    <audio controls className="chat-media-audio">
      <source src={audioUrl} type="audio/mpeg" />
      <source src={audioUrl} type="audio/wav" />
      <source src={audioUrl} type="audio/ogg" />
      Your browser does not support the audio element.
    </audio>
  )
}

export default AudioMessage
