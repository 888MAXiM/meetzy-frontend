import { useEffect, useState } from 'react'
import { useAppSelector } from '../redux/hooks'
import Store from '../redux/store'
import { socket } from '../services/socket-setup'
import { SOCKET } from '../constants/socket'
import { TypingEventData } from '../types/components/chat'

const getChatIdentifier = (chat?: any): number | undefined => {
  if (!chat) return undefined
  return chat.chat_id ?? chat.id ?? chat.user_id
}

const useTypingIndicator = () => {
  const [typingUsers, setTypingUsers] = useState<{ userId: number | string; name: string }[]>([])
  const { selectedUser } = useAppSelector((store) => store.chat)
  const { user } = useAppSelector((store) => store.auth)

  const currentUserId = user?.id

  useEffect(() => {
    setTypingUsers([])
  }, [selectedUser?.id, selectedUser?.chat_id, selectedUser?.user_id])

  useEffect(() => {
    const handleTyping = (data: TypingEventData) => {
      const chatState = Store.getState().chat
      const currentSelectedChat = chatState?.selectedUser

      if (currentSelectedChat?.isBlocked) {
        return
      }

      if (!currentSelectedChat) {
        return
      }

      if (data.userId === currentUserId) {
        return
      }

      let isTypingForCurrentChat = false

      const selectedChatId = getChatIdentifier(currentSelectedChat)

      if (data.groupId && currentSelectedChat.chat_type === 'group' && selectedChatId) {
        isTypingForCurrentChat = data.groupId === selectedChatId
      } else if (data.senderId && data.recipientId && currentSelectedChat.chat_type !== 'group' && selectedChatId) {
        const isRecipient = data.recipientId === currentUserId
        const isSenderSelected = selectedChatId === data.senderId
        isTypingForCurrentChat = isRecipient && isSenderSelected
      }

      if (!isTypingForCurrentChat) {
        return
      }

      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (!prev.some((user) => user.userId === data.userId)) {
            return [...prev, { userId: data.userId, name: data.userName }]
          }
          return prev
        } else {
          return prev.filter((user) => user.userId !== data.userId)
        }
      })
    }

    socket.on(SOCKET.Listeners.Typing, handleTyping)
    return () => {
      socket.off(SOCKET.Listeners.Typing, handleTyping)
    }
  }, [currentUserId, selectedUser?.id, selectedUser?.chat_id, selectedUser?.user_id])

  const getTypingText = () => {
    if (typingUsers.length === 0) return null
    if (typingUsers.length === 1) return `${typingUsers[0].name} is typing...`
    if (typingUsers.length === 2) return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
    return 'Several people are typing'
  }

  return { typingUsers, getTypingText }
}

export default useTypingIndicator
