import { Image } from '../../../../../../shared/image'
import { Message } from '../../../../../../types/api'

const StickerMessage = ({ message }: { message: Message }) => {
  return (
    <div className="sticker-msg">
      <Image src={message.file_url} alt="sticker" className="img-fluid stickerimg-img" />
    </div>
  )
}

export default StickerMessage
