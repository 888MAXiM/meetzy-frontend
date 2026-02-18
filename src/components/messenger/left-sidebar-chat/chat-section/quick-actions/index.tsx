import { Fragment } from 'react/jsx-runtime'
import { chatContactSettingListData } from '../../../../../data/messenger'
import { useAppDispatch } from '../../../../../redux/hooks'
import { setNewModal } from '../../../../../redux/reducers/messenger/messengerSlice'
import type { ChatContactSettingType } from '../../../../../types/store'
import CallModal from './Call'
import ChatModal from './Chat'
import GroupModal from './Group'
import BroadcastModal from './Broadcast'
import { useTranslation } from 'react-i18next'

const ChatContactSetting: React.FC<ChatContactSettingType> = ({ chatContact, setChatContact }) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  return (
    <Fragment>
      <ul className={`chat-cont-setting ${chatContact ? 'open' : ''}`} onClick={setChatContact}>
        {chatContactSettingListData.map((item, index) => (
          <li key={index}>
            <a
              onClick={(event) => {
                event.preventDefault()
                dispatch(setNewModal(index))
              }}
            >
              <div className={`icon-btn bg-light-${item.color} button-effect btn-sm`}>{item.icon}</div>
              <span>{t(item.title)}</span>
            </a>
          </li>
        ))}
      </ul>
      <ChatModal />
      <CallModal />
      <GroupModal />
      <BroadcastModal />
    </Fragment>
  )
}

export default ChatContactSetting
