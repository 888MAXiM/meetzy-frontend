import { ChatType } from '../../../../../../constants'
import { useUserFeatures } from '../../../../../../hooks/useUserFeatures'
import { useAppSelector } from '../../../../../../redux/hooks'
import webrtcService from '../../../../../../services/webrtc-service'
import { SvgIcon } from '../../../../../../shared/icons'
import type { ContactType } from '../../../../../../types/components/chat'
import { getChatId } from '../../../../../../utils'
import QuickAction from './QuickAction'

const Contact: React.FC<ContactType> = ({ search, setSearch }) => {
  const { selectedUser } = useAppSelector((state) => state.chat)
  const { user } = useAppSelector((state) => state.auth)
  const { audio_calls_enabled, video_calls_enabled } = useAppSelector((state) => state.settings)
  const { video_calls_enabled: allow_video_calls } = useUserFeatures()
  const chatId = getChatId(selectedUser)
  const canCall = !!selectedUser && !!user && !!chatId

  const handleInitiate = async (type: 'audio' | 'video') => {
    if (!canCall || !chatId) {
      return
    }

    const callChatType = selectedUser.chat_type === 'group' ? ChatType.group : ChatType.DM
    const chatName = selectedUser.name || 'Chat'

    try {
      await webrtcService.initiateCall(chatId, chatName, callChatType, type, {
        id: user!.id || '',
        name: user!.name || '',
        avatar: (user as any).avatar || null,
      })
    } catch (error) {
      console.error('Failed to initiate call:', error)
    }
  }

  return (
    <ul className="calls text-end">
      <li>
        <a className="icon-btn search search-right" onClick={() => setSearch(!search)}>
          <SvgIcon className="stroke-primary" iconId="search-toggle" />
        </a>
      </li>
      {!!video_calls_enabled && allow_video_calls && !selectedUser?.isAnnouncement && !selectedUser?.isBroadcast && (
        <li>
          <a
            className="icon-btn button-effect"
            onClick={(e) => {
              e.preventDefault()
              handleInitiate('video')
            }}
          >
            <SvgIcon className="stroke-primary" iconId="video-call" />
          </a>
        </li>
      )}
      {!!audio_calls_enabled && !selectedUser?.isAnnouncement && !selectedUser?.isBroadcast && (
        <li>
          <a
            className="icon-btn button-effect"
            onClick={(e) => {
              e.preventDefault()
              handleInitiate('audio')
            }}
          >
            <SvgIcon className="stroke-primary" iconId="call" />
          </a>
        </li>
      )}
      <QuickAction />
    </ul>
  )
}

export default Contact
