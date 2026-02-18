import { Message } from "../api"

export interface DeletedMessagePayload {
  messageId: number
  newPrevMessage?: Message | null
  deletedMessage: {
    sender_id: number
    group_id?: string | number
    recipient_id?: number
  }
  wasUnread?: boolean
  deleteType?: 'delete-for-me' | 'delete-for-everyone'
  hasUnreadMentions?: boolean
  group_id?: number
  sender_id?: number
  recipient_id?: number
  created_at?: string
}