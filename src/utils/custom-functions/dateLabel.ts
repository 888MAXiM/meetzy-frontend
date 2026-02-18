import { format, isToday, isYesterday } from 'date-fns'
import { Message } from '../../types/api'

export const mergeAndGroupMessages = (messages: any[]) => {
  if (!messages?.length) {
    return []
  }

  try {
    const grouped = new Map()

    messages.forEach((message) => {
      const messageDate = new Date(message.created_at)
      const dateKey = format(messageDate, 'yyyy-MM-dd')

      let dateLabel
      if (isToday(messageDate)) {
        dateLabel = 'Today'
      } else if (isYesterday(messageDate)) {
        dateLabel = 'Yesterday'
      } else {
        dateLabel = format(messageDate, 'EEEE, MMMM d, yyyy')
      }

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          label: dateLabel,
          dateKey: dateKey, 
          messages: [],
        })
      }

      grouped.get(dateKey).messages.push(message)
    })

    return Array.from(grouped.values())
  } catch (error) {
    console.error('❌ Error in mergeAndGroupMessages:', error)
    return []
  }
}

export const mergeMessagesFromPages = (pages: any[]) => {
  if (!pages?.length) return []

  const allMessages: Message[] = []

  pages.forEach((page, pageIndex) => {
    const dateGroups = page.messages || []

    dateGroups.forEach((dateGroup: any) => {
      const groups = dateGroup.messageGroups || []

      groups.forEach((group: any) => {
        const msgs = group.messages || []

        if (pageIndex === 0) {
          allMessages.push(...msgs)
        } else {
          allMessages.unshift(...msgs)
        }
      })
    })
  })

  return allMessages
}
