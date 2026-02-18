/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from 'react'
import { ChevronLeft } from 'react-feather'
import { ImagePath } from '../../../../constants'
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks'
import { setChats, setEditMessage, setReplyMessage } from '../../../../redux/reducers/messenger/chatSlice'
import { setMobileMenu } from '../../../../redux/reducers/messenger/messengerSlice'
import { Image } from '../../../../shared/image'
import Chat from './chat'
import ChatHeader from './chat-header'
import MessageInput from './message-input'

const PrivateChat = () => {
  const { chats, selectedUser, replyMessage, editMessage } = useAppSelector((state) => state.chat)
  const dispatch = useAppDispatch()
  const { chatPinVerified } = useAppSelector((state) => state.userSettings)

  useEffect(() => {
    if (chats.length > 0) {
      dispatch(setChats(chats))
    }
  }, [dispatch, chats.length])

  const handleMobileMenu = () => {
    dispatch(setMobileMenu())
  }

  return (
    <div className={`messages custom-scroll active`}>
      {((selectedUser?.isLocked && chatPinVerified) || !selectedUser?.isLocked) && <ChatHeader />}
      {(selectedUser?.isLocked && chatPinVerified) || !selectedUser?.isLocked ? (
        <Chat />
      ) : (
        <div className="call-list-center">
          <button
            className="icon-btn bg-light-primary button-effect mobile-sidebar"
            onClick={handleMobileMenu}
            type="button"
          >
            <ChevronLeft />
          </button>
          <Image src={`${ImagePath}/chat.gif`} alt="#" />
          <h2 className="text-center">You locked this chat!</h2>
          <p className="text-center">Add your pin and start chatting with {selectedUser?.name}!</p>
        </div>
      )}
      {((selectedUser?.isLocked && chatPinVerified) || !selectedUser?.isLocked) && (
        <div className="message-composer-wrapper">
          <MessageInput
            replyTo={replyMessage}
            editTo={editMessage}
            onReplySent={() => dispatch(setReplyMessage(null))}
            onEditSent={() => dispatch(setEditMessage(null))}
          />
        </div>
      )}
    </div>
  )
}

export default PrivateChat
