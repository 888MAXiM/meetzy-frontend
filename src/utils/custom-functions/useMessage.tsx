import { Message } from '../../types/api'

export const isFirstInSystemMessageGroup = (messages: Message[], currentIndex: number): boolean => {
  if (!messages || currentIndex < 0 || currentIndex >= messages.length) {
    return false
  }

  const currentMessage = messages[currentIndex]

  if (currentMessage.message_type !== 'system') {
    return false
  }

  const prevMessage = messages[currentIndex - 1]
  return !prevMessage || prevMessage.message_type !== 'system'
}

export const getConsecutiveSystemMessages = (messages: Message[], currentIndex: number): Message[] => {
  const consecutiveMessages: Message[] = []

  if (!messages || currentIndex < 0 || currentIndex >= messages.length) {
    return consecutiveMessages
  }

  const currentMessage = messages[currentIndex]

  if (currentMessage.message_type !== 'system') {
    return consecutiveMessages
  }

  let startIndex = currentIndex
  while (startIndex > 0 && messages[startIndex - 1].message_type === 'system') {
    startIndex--
  }

  let index = startIndex
  while (index < messages.length && messages[index].message_type === 'system') {
    consecutiveMessages.push(messages[index])
    index++
  }

  return consecutiveMessages
}
