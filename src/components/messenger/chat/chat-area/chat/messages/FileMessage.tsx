import { Download } from 'react-feather'
import { SvgIcon } from '../../../../../../shared/icons'
import { Message } from '../../../../../../types/api'
import DecryptedMessage from './DecryptedMessage'

const FileMessage = ({ message }: { message: Message }) => {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault()
    if (message.file_url) {
      const link = document.createElement('a')
      link.href = message.file_url
      link.download = message.content || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="file-message-wrapper">
      <div className="file-message-container">
        <div className="file-icon-wrapper">
          <SvgIcon iconId="file" className="file-icon" />
        </div>
        <div className="file-info">
          <div className="file-name">{message.metadata?.original_filename}</div>
        </div>
        <button className="download-btn" onClick={handleDownload} aria-label="Download file">
          <Download size={18} />
        </button>
      </div>
      {message.content && (
        <h5>
          <DecryptedMessage message={message}>
            {(decryptedContent) => decryptedContent}
          </DecryptedMessage>
        </h5>
      )}
    </div>
  )
}

export default FileMessage
