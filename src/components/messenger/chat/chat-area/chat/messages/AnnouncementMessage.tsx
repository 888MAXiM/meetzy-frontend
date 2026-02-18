import { useTranslation } from 'react-i18next'
import { TAB_TO_SCREEN_MAP } from '../../../../../../data/components'
import { useAppDispatch } from '../../../../../../redux/hooks'
import { setScreen } from '../../../../../../redux/reducers/messenger/screenSlice'
import { Image } from '../../../../../../shared/image'
import { Message } from '../../../../../../types/api'

const AnnouncementMessage = ({ message }: { message: Message }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const handleKey = () => {
    if (message?.metadata?.announcement_type === 'get_started') {
      const redirectTab = message.metadata.redirect_url

      if (!redirectTab) return

      const screen = TAB_TO_SCREEN_MAP[redirectTab]
      if (screen) {
        dispatch(setScreen(screen))
      }
    } else if (message?.metadata?.announcement_type === 'learn_more') {
      const url = message?.metadata?.action_link
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <div className="announce-preview-card">
      <div className="announce-preview-card-inner">
        {message.file_url && (
          <div className="announce-preview-content">
            <Image src={message.file_url || '/card-bg.png'} alt="Status preview" className="announce-preview-image" />
          </div>
        )}
        {message?.metadata?.title && <div className="announce-preview-card-title">{message?.metadata?.title}</div>}
        {message.content && <div className="announce-preview-card-desc">{message.content}</div>}
        {message?.metadata?.announcement_type && message?.metadata?.announcement_type !== 'none' && (
          <>
            <hr />
            <div className="d-flex justify-content-center" onClick={handleKey}>
              <button className="announce-preview-card-btn">{t(message?.metadata?.announcement_type)}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AnnouncementMessage
