import PrivateChat from './chat-area/index.tsx'

const ChatBoard = () => {

  return (
    <div className="meetzy-main small-sidebar">
      <div className="chat-content tabto active">
        <PrivateChat />
      </div>
    </div>
  )
}

export default ChatBoard
