// @ts-nocheck
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { STORAGE_KEYS } from '../../../constants/storageKeys'
import { Message } from '../../../types/api'
import type { Contact, ContactItem, RecentChat } from '../../../types/components/chat'
import type { ActiveCallUserTypes, ChatMembersType, ChatSliceType, SelectedChat } from '../../../types/store'
import { getSelectedUserIdFromStorage, getStorage, saveSelectedUserIdToStorage, stringify } from '../../../utils'

const storage = getStorage()
const formatDateLabel = (isoDate: string): string => {
  const date = new Date(isoDate)
  const now = new Date()

  const isToday =
    date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isToday) {
    return 'Today'
  } else if (isYesterday) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
}

const getDateKey = (isoDate: string): string => {
  return new Date(isoDate).toISOString().split('T')[0]
}

const transformNewMessage = (newMsg: any, currentUserId?: number): Message => {
  const isOutgoing = newMsg.sender_id === currentUserId
  const recipientId = isOutgoing ? newMsg.recipient_id : newMsg.sender_id
  const status = isOutgoing ? 'sent' : 'delivered'

  let statuses = newMsg.statuses || []

  if (statuses.length === 0 && isOutgoing && !newMsg.group_id && recipientId) {
    statuses = [
      {
        user_id: recipientId,
        status: 'sent',
        updated_at: newMsg.created_at,
      },
    ]
  }

  let metadata: any = newMsg.metadata
  if (newMsg.message_type === 'call' && typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata)
    } catch {
      metadata = {}
    }
  }

  let messageType = newMsg.message_type

  if ((!messageType || messageType === 'file') && newMsg.file_url && newMsg.file_type) {
    if (newMsg.file_type.startsWith('image/')) {
      messageType = 'image'
    } else if (newMsg.file_type.startsWith('audio/')) {
      messageType = 'audio'
    } else if (newMsg.file_type.startsWith('video/')) {
      messageType = 'video'
    } else {
      messageType = 'file'
    }
  }

  const isForwarded =
    typeof newMsg.isForwarded === 'boolean'
      ? newMsg.isForwarded
      : newMsg.actions?.some((action: any) => action.action_type === 'forward') ?? false

  return {
    id: newMsg.id,
    content: newMsg.content,
    message_type: messageType,
    parent_id: newMsg.parent_id,
    group_id: newMsg.group_id,
    sender_id: newMsg.sender_id,
    file_url: newMsg.file_url,
    created_at: newMsg.created_at,
    recipient_id: newMsg.recipient_id,
    sender: newMsg.sender,
    recipient: newMsg.recipient,
    statuses,
    reactions: newMsg.reactions || [],
    mentions: newMsg.mentions || null,
    has_unread_mentions: newMsg.has_unread_mentions || false,
    parentMessage: newMsg.parentMessage || newMsg.parent || null,
    metadata,
    isDeleted: false,
    isDeletedForEveryone: false,
    deletedBy: null,
    isEdited: false,
    isForwarded,
    isStarred: false,
    is_encrypted:
      newMsg.is_encrypted === true ||
      newMsg.is_encrypted === 1 ||
      newMsg.is_encrypted === 'true' ||
      newMsg.is_encrypted === '1' ||
      newMsg.is_encrypted ||
      false,
    ...(newMsg.sender?.email
      ? { sender: { ...newMsg.sender, email: newMsg.sender.email } }
      : { sender: { ...newMsg.sender, email: '' } }),
    ...(newMsg.recipient?.email
      ? { recipient: { ...newMsg.recipient, email: newMsg.recipient.email } }
      : { recipient: { ...newMsg.recipient, email: '' } }),
  }
}

const findMessageIndexById = (messages: any[], id: number) => {
  for (let groupIdx = 0; groupIdx < messages.length; groupIdx++) {
    const msgIdx = messages[groupIdx].messages.findIndex((m: Message) => m.id == id)
    if (msgIdx !== -1) {
      return { groupIdx, msgIdx }
    }
  }
  return { groupIdx: -1, msgIdx: -1 }
}

const sortMessagesByDate = (messages: Message[]) => {
  return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
}

const sortGroupsByDate = (groups: any[]) => {
  return [...groups].sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}

const hydrateParentMessages = (groups: any[]) => {
  const messageMap = new Map<number, any>()

  groups.forEach((group) => {
    group.messages.forEach((message: any) => {
      messageMap.set(message.id, message)
    })
  })

  return groups.map((group) => ({
    ...group,
    messages: group.messages.map((message: any) => {
      if (message.parentMessage) {
        return message
      }

      if (message.parent) {
        return { ...message, parentMessage: message.parent }
      }

      if (message.parent_id && messageMap.has(message.parent_id)) {
        return { ...message, parentMessage: messageMap.get(message.parent_id) }
      }

      return message
    }),
  }))
}

const sortRecentChats = (chats: RecentChat[]) => {
  const toTimestamp = (value?: string | null) => {
    if (!value) return 0
    const ms = new Date(value).getTime()
    return Number.isFinite(ms) ? ms : 0
  }

  const getLastMessageTs = (chat: RecentChat) => {
    if (chat.latest_message_at) return toTimestamp(chat.latest_message_at)
    if (chat.lastMessage?.created_at) return toTimestamp(chat.lastMessage.created_at)
    return 0
  }

  return chats
    .map((chat, index) => ({ chat, index }))
    .sort((a, b) => {
      const aPinned = Boolean(a.chat.isPinned)
      const bPinned = Boolean(b.chat.isPinned)

      if (aPinned && bPinned) {
        const diff = toTimestamp(b.chat.pinned_at) - toTimestamp(a.chat.pinned_at)
        if (diff !== 0) return diff
      }

      if (aPinned !== bPinned) {
        return aPinned ? -1 : 1
      }

      const timeDiff = getLastMessageTs(b.chat) - getLastMessageTs(a.chat)
      if (timeDiff !== 0) return timeDiff

      return a.index - b.index
    })
    .map((entry) => entry.chat)
}

const initialState: ChatSliceType = {
  allMembers: [],
  chatMembers: [],
  chats: [],
  currentUser: null,
  selectedUser: storage.getItem(STORAGE_KEYS.SELECTED_USER) || null,
  isTyping: false,
  activeCallUser: null,
  replyMessage: null,
  editMessage: null,
  selectedChatMessages: [],
  currentCallStatus: '',
  openReportModal: false,
  callParticipants: { participants: [], channelId: null, chatType: '' },
  selectedChat: (() => {
    try {
      const stored = storage.getItem(STORAGE_KEYS.SELECTED_CHAT)
      if (stored && typeof stored === 'object' && 'id' in stored && 'type' in stored) {
        return stored as SelectedChat
      }
      return null
    } catch {
      return null
    }
  })(),
  targetMessageId: null,
  highlightedMessageId: null,
  recentChats: [],
  recentChatsLoading: false,
  selectedUserProfile: null,
}

export const transformContactToChatMember = (contact: Contact): ChatMembersType => ({
  id: contact.id,
  chat_id: contact.id,
  name: contact.name,
  email: contact.email || '',
  profile_color: contact.profile_color,
  thumb: contact.avatar,
  avatar: contact.avatar,
  onlineStatus: contact.onlineStatus,
  status: contact.status,
  mesg: contact.mesg,
  lastSeenDate: contact.lastSeenDate,
  typing: contact.typing,
  chatStatus: contact.messageStatus,
  profileImg: contact.avatar,
  chat_type: contact.chatType,
})

const ChatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    selectChat: (state, action: PayloadAction<SelectedChat | null>) => {
      state.selectedChat = action.payload
      if (action.payload) {
        storage.setItem(STORAGE_KEYS.SELECTED_CHAT, action.payload)
      } else {
        storage.removeItem(STORAGE_KEYS.SELECTED_CHAT)
      }
    },
    setAllMembers: (state, action: PayloadAction<ContactItem[]>) => {
      if (!Array.isArray(action.payload)) {
        console.error('setAllMembers received non-array payload:', action.payload)
        return
      }
      state.allMembers = action.payload

      const savedUserId = getSelectedUserIdFromStorage()
      if (savedUserId && !state.selectedUser) {
        const user = state.allMembers.find((m) => m.id === savedUserId)
        if (user) {
          state.selectedUser = user
        }
      }

      if (state.selectedUser && state.selectedUser.chat_type === 'direct') {
        const matchingMember = state.allMembers.find(
          (member) => member.id === state.selectedUser?.chat_id || member.id === state.selectedUser?.id,
        )
        if (matchingMember && matchingMember.disappearing) {
          state.selectedUser = {
            ...state.selectedUser,
            disappearing: matchingMember.disappearing,
          }
          storage.setItem(STORAGE_KEYS.SELECTED_USER, state.selectedUser)
        }
      }
    },
    setCurrentUser: (state, action) => {
      if (!action.payload) {
        console.error('setCurrentUser received null/undefined payload')
        return
      }
      state.currentUser = transformContactToChatMember(action.payload)
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload
      if (action.payload) {
        storage.setItem(STORAGE_KEYS.SELECTED_USER, action.payload)
      } else {
        storage.removeItem(STORAGE_KEYS.SELECTED_USER)
      }
      if (action.payload?.chatType === 'group') {
        saveSelectedUserIdToStorage(null)
      } else {
        saveSelectedUserIdToStorage(action.payload?.chat_id || null)
      }
    },
    setSelectedChatMessages: (state, action) => {
      const newMessages = hydrateParentMessages(action.payload)
      if (stringify(state.selectedChatMessages) === stringify(newMessages)) {
        return
      }
      state.selectedChatMessages = newMessages
    },
    addOrUpdateMessage: (state, action: PayloadAction<{ message: any; currentUserId?: number | string }>) => {
      const { message: newMsg, currentUserId } = action.payload
      if (!newMsg || !newMsg.id) return

      const selectedUser = state.selectedUser
      if (!selectedUser) return

      let messageMetadata = newMsg.metadata
      if (typeof messageMetadata === 'string') {
        try {
          messageMetadata = JSON.parse(messageMetadata)
        } catch (e) {
          messageMetadata = {}
        }
      }

      const isAnnouncementMessage = newMsg.message_type === 'announcement'

      if (isAnnouncementMessage) {
        const isAnnouncementMatch =
          selectedUser.isAnnouncement === true &&
          (selectedUser.chat_id === String(newMsg.sender_id) || selectedUser.id === String(newMsg.sender_id))
        if (!isAnnouncementMatch) {
          return
        }
      } else if (newMsg.group_id) {
        const isGroupMatch =
          selectedUser.chat_type === 'group' &&
          (selectedUser.chat_id === String(newMsg.group_id) || selectedUser.id === String(newMsg.group_id))
        if (!isGroupMatch) {
          return
        }
      } else if (messageMetadata?.is_broadcast && messageMetadata?.broadcast_id) {
        const broadcastId = messageMetadata.broadcast_id
        const isMergedMessage = Array.isArray(newMsg.recipients) && newMsg.recipients.length > 0
        const isSenderReceivingIndividualMessage =
          newMsg.sender_id === currentUserId && newMsg.recipient_id && !isMergedMessage

        if (isSenderReceivingIndividualMessage) {
          return
        }

        const isBroadcastMatch =
          (selectedUser.isBroadcast || selectedUser.chat_type === 'broadcast') &&
          (selectedUser.chat_id == String(broadcastId) || selectedUser.id == String(broadcastId))

        const otherUserId = newMsg.sender_id === currentUserId ? newMsg.recipient_id : newMsg.sender_id
        const isDirectMatch =
          selectedUser.chat_type === 'direct' &&
          otherUserId &&
          (selectedUser.chat_id == otherUserId || selectedUser.id == otherUserId)

        if (!isBroadcastMatch && !isDirectMatch) {
          return
        }
      } else {
        const otherUserId = newMsg.sender_id === currentUserId ? newMsg.recipient_id : newMsg.sender_id
        const isDirectMatch =
          selectedUser.chat_type === 'direct' &&
          otherUserId &&
          (selectedUser.chat_id == otherUserId || selectedUser.id == otherUserId)
        if (!isDirectMatch) {
          return
        }
      }

      const dateKey = getDateKey(newMsg.created_at)
      const transformed = transformNewMessage(newMsg, currentUserId)
      const isE2EEncrypted = newMsg.is_encrypted === true || 
                            newMsg.is_encrypted === 1 || 
                            newMsg.is_encrypted === 'true' || 
                            newMsg.is_encrypted === '1' ||
                            transformed.is_encrypted
      
      let removedOptimisticMessage = false
      if (newMsg.sender_id == currentUserId && !newMsg.isOptimistic) {
        const messageTime = new Date(newMsg.created_at).getTime()
        const timeWindowAgo = isE2EEncrypted ? messageTime - 300000 : messageTime - 120000 // 5 min for E2E, 2 min otherwise
        const messageType = newMsg.message_type || 'text'
        const messageParentId = String(newMsg.parent_id || '')
        
        state.selectedChatMessages = state.selectedChatMessages.map((group) => ({
          ...group,
          messages: group.messages.filter((msg: Message) => {
            if (!msg.isOptimistic || String(msg.sender_id) != String(currentUserId)) {
              return true
            }
            
            const optimisticTime = new Date(msg.created_at).getTime()
            const optimisticType = msg.message_type || 'text'
            const optimisticParentId = String(msg.parent_id || '')
            
            const timeWindowAfter = isE2EEncrypted ? messageTime + 30000 : messageTime + 15000
            const isWithinTimeWindow = optimisticTime >= timeWindowAgo && optimisticTime <= timeWindowAfter
            
            const typesMatch = optimisticType === messageType
            
            const parentIdsMatch = optimisticParentId === messageParentId
            if (isWithinTimeWindow && typesMatch && parentIdsMatch) {
              removedOptimisticMessage = true
              if (msg.file_url && msg.file_url.startsWith('blob:')) {
                try {
                  URL.revokeObjectURL(msg.file_url)
                } catch (e) {
                }
              }
              return false
            }
            
            return true
          }),
        }))
        
        state.selectedChatMessages = state.selectedChatMessages.filter(
          (group) => group.messages.length > 0
        )
      }

      const existingIndex = findMessageIndexById(state.selectedChatMessages, newMsg.id)
      if (existingIndex.groupIdx !== -1) {
        const targetGroup = state.selectedChatMessages[existingIndex.groupIdx]
        const targetMsg = targetGroup.messages[existingIndex.msgIdx]
        
        if (targetMsg.isOptimistic) {
          if (targetMsg.file_url && targetMsg.file_url.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(targetMsg.file_url)
            } catch (e) {
            }
          }
          targetGroup.messages.splice(existingIndex.msgIdx, 1)
          if (targetGroup.messages.length === 0) {
            state.selectedChatMessages.splice(existingIndex.groupIdx, 1)
          }
        } else {
          const targetGroup = state.selectedChatMessages[existingIndex.groupIdx]
          const targetMsg = targetGroup.messages[existingIndex.msgIdx]
          if (newMsg.deleted_at) {
            targetMsg.isDeleted = true
            targetMsg.deleted_at = newMsg.deleted_at
            if (newMsg.deletedBy?.includes(currentUserId || 0)) {
              targetMsg.isDeletedForEveryone = true
              targetGroup.messages.splice(existingIndex.msgIdx, 1)
              if (targetGroup.messages.length === 0) {
                state.selectedChatMessages.splice(existingIndex.groupIdx, 1)
              }
            }
          } else if (newMsg.updated_at && newMsg.updated_at > targetMsg.created_at) {
            targetMsg.content = newMsg.content
            targetMsg.isEdited = true
            targetMsg.updated_at = newMsg.updated_at
          } else {
            if (newMsg.statuses) targetMsg.statuses = newMsg.statuses
            if (newMsg.reactions) targetMsg.reactions = newMsg.reactions
            if (newMsg.isForwarded !== undefined) {
              targetMsg.isForwarded = newMsg.isForwarded
            } else if (newMsg.actions?.some((action: any) => action.action_type === 'forward')) {
              targetMsg.isForwarded = true
            }
          }
          targetGroup.messages = sortMessagesByDate(targetGroup.messages)
          return
        }
      }

      let groupIndex = state.selectedChatMessages.findIndex((g) => g.dateKey === dateKey)
      if (groupIndex === -1) {
        const label = formatDateLabel(newMsg.created_at)
        state.selectedChatMessages.push({
          label,
          dateKey,
          messages: [transformed],
        })
        state.selectedChatMessages = sortGroupsByDate(state.selectedChatMessages)
      } else {
        // Update the label in case it changed (e.g., old date -> "Today" when message from today is added)
        const updatedLabel = formatDateLabel(newMsg.created_at)
        state.selectedChatMessages[groupIndex].label = updatedLabel
        state.selectedChatMessages[groupIndex].messages.push(transformed)
        state.selectedChatMessages[groupIndex].messages = sortMessagesByDate(
          state.selectedChatMessages[groupIndex].messages,
        )
      }

      if (newMsg.parent_id) {
        const parentIndex = findMessageIndexById(state.selectedChatMessages, newMsg.parent_id)
        if (parentIndex.groupIdx !== -1) {
          const parentMsg = state.selectedChatMessages[parentIndex.groupIdx].messages[parentIndex.msgIdx]
          const newGroupIndex = state.selectedChatMessages.findIndex((g) => g.dateKey === dateKey)
          if (newGroupIndex === -1) return
          const newMsgIndex = state.selectedChatMessages[newGroupIndex].messages.findIndex((m) => m.id === newMsg.id)
          if (newMsgIndex !== -1) {
            state.selectedChatMessages[newGroupIndex].messages[newMsgIndex].parentMessage = parentMsg
          }
        } else if (newMsg.parent || newMsg.parentMessage) {
          const parentData = newMsg.parentMessage || newMsg.parent
          const newGroupIndex = state.selectedChatMessages.findIndex((g) => g.dateKey === dateKey)
          if (newGroupIndex === -1) return
          const newMsgIndex = state.selectedChatMessages[newGroupIndex].messages.findIndex((m) => m.id === newMsg.id)
          if (newMsgIndex !== -1) {
            state.selectedChatMessages[newGroupIndex].messages[newMsgIndex].parentMessage = parentData
          }
        }
      }
    },
    updateMessageReactions: (state, action: PayloadAction<{ messageId: string; reactions: any }>) => {
      const { messageId, reactions } = action.payload
      state.selectedChatMessages = state.selectedChatMessages.map((section) => ({
        ...section,
        messages: section.messages.map((msg: Message) =>
          msg.id === messageId ? { ...msg, reactions: reactions } : msg,
        ),
      }))
    },
    updateMessageStarred: (state, action: PayloadAction<{ messageIds: (number | string)[]; isStarred: boolean }>) => {
      const { messageIds, isStarred } = action.payload
      state.selectedChatMessages = state.selectedChatMessages.map((section) => ({
        ...section,
        messages: section.messages.map((msg: Message) => (messageIds.includes(msg.id) ? { ...msg, isStarred } : msg)),
      }))
    },
    updateMessagePin: (state, action: PayloadAction<{ messageId: number | string; isPinned: boolean }>) => {
      const { messageIds, duration, isPinned } = action.payload
      state.selectedChatMessages = state.selectedChatMessages.map((section) => ({
        ...section,
        messages: section.messages.map((msg: Message) => (messageIds === msg.id ? { ...msg, isPinned } : msg)),
      }))
    },
    updateMessageStatus: (state, action: PayloadAction<{ messageId: number | string; status: string; userId: number | string }>) => {
      const { messageId, status, userId } = action.payload
      const index = findMessageIndexById(state.selectedChatMessages, messageId)

      const now = new Date().toISOString()
      const normalizedStatus = status === 'read' ? 'seen' : status

      // Update message status in selectedChatMessages
      if (index.groupIdx !== -1) {
        const targetMessage = state.selectedChatMessages[index.groupIdx].messages[index.msgIdx]

        if (!targetMessage.statuses) {
          targetMessage.statuses = []
        }

        const statuses = targetMessage.statuses
        let statusIdx = statuses.findIndex((s: any) => s.user_id === userId)

        if (statusIdx === -1) {
          statuses.push({ user_id: userId, status: normalizedStatus, updated_at: now })
        } else {
          const currentStatus = statuses[statusIdx].status
          const statusPriority = { sent: 1, delivered: 2, seen: 3, read: 3, blocked: 0 }
          const currentPriority = statusPriority[currentStatus as keyof typeof statusPriority] || 0
          const newPriority = statusPriority[normalizedStatus as keyof typeof statusPriority] || 0

          if (newPriority >= currentPriority) {
            statuses[statusIdx].status = normalizedStatus
            statuses[statusIdx].updated_at = now
          }
        }
      }

      // Update lastMessage statuses in recentChats if this message is the last message
      state.recentChats = state.recentChats.map((chat) => {
        if (chat.lastMessage && chat.lastMessage.id === messageId) {
          let lastMessageStatuses = chat.lastMessage.statuses || []

          // Parse statuses if it's a string
          if (typeof lastMessageStatuses === 'string') {
            try {
              lastMessageStatuses = JSON.parse(lastMessageStatuses)
            } catch {
              lastMessageStatuses = []
            }
          }

          // Ensure it's an array
          if (!Array.isArray(lastMessageStatuses)) {
            lastMessageStatuses = lastMessageStatuses ? [lastMessageStatuses] : []
          }

          let statusIdx = lastMessageStatuses.findIndex((s: any) => s?.user_id === userId)

          if (statusIdx === -1) {
            lastMessageStatuses.push({ user_id: userId, status: normalizedStatus, updated_at: now })
          } else {
            const currentStatus = lastMessageStatuses[statusIdx]?.status
            const statusPriority = { sent: 1, delivered: 2, seen: 3, read: 3, blocked: 0 }
            const currentPriority = statusPriority[currentStatus as keyof typeof statusPriority] || 0
            const newPriority = statusPriority[normalizedStatus as keyof typeof statusPriority] || 0

            if (newPriority >= currentPriority) {
              lastMessageStatuses[statusIdx] = {
                ...lastMessageStatuses[statusIdx],
                status: normalizedStatus,
                updated_at: now,
              }
            }
          }

          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              statuses: lastMessageStatuses,
            },
          }
        }
        return chat
      })
    },
    setChats: (state, action: PayloadAction<ChatsTypes[]>) => {
      state.chats = action.payload
    },
    setRecentChats: (state, action: PayloadAction<RecentChat[]>) => {
      const normalized = action.payload.map((chat) => ({
        ...chat,
        isArchived: chat.isArchived ?? false,
        pinned_at: chat.pinned_at ?? null,
      }))
      state.recentChats = sortRecentChats(normalized)

      if (state.selectedUser) {
        const matchingChat = normalized.find(
          (chat) => chat.chat_id === state.selectedUser?.chat_id && chat.chat_type === state.selectedUser?.chat_type,
        )
        if (matchingChat) {
          state.selectedUser = {
            ...state.selectedUser,
            ...matchingChat,
            disappearing: matchingChat.disappearing || state.selectedUser.disappearing,
          }
          storage.setItem(STORAGE_KEYS.SELECTED_USER, state.selectedUser)
        }
      }
    },
    setRecentChatsLoading: (state, action: PayloadAction<boolean>) => {
      state.recentChatsLoading = action.payload
    },
    setActiveCallUser: (state, action: PayloadAction<ActiveCallUserTypes | null>) => {
      state.activeCallUser = action.payload
    },
    setReplyMessage: (state, action: PayloadAction<Message | null>) => {
      state.replyMessage = action.payload
    },
    setEditMessage: (state, action: PayloadAction<Message | null>) => {
      state.editMessage = action.payload
    },
    deleteMessage: (
      state,
      action: PayloadAction<{
        messageId: number
        deleteType?: 'delete-for-me' | 'delete-for-everyone'
      }>,
    ) => {
      const { messageId, deleteType = 'delete-for-everyone' } = action.payload

      if (state.editMessage?.id === messageId) {
        state.editMessage = null
      }
      if (state.replyMessage?.id === messageId) {
        state.replyMessage = null
      }

      // Update selectedChatMessages
      state.selectedChatMessages = state.selectedChatMessages
        .map((section: any) => {
          const updatedMessages = section.messages
            .map((msg: Message) => {
              // Loose comparison to handle string/number ID mismatch
              if (String(msg.id) !== String(messageId)) {
                return msg
              }

              if (deleteType === 'delete-for-me') {
                return null
              }

              return {
                ...msg,
                isDeleted: true,
                isDeletedForEveryone: true,
                content: '',
                file_url: null,
              }
            })
            .filter(Boolean)

          return { ...section, messages: updatedMessages }
        })
        .filter((section: any) => section.messages.length > 0)

      // Update recentChats
      state.recentChats = state.recentChats.map((chat) => {
        if (chat.lastMessage && String(chat.lastMessage.id) === String(messageId)) {
          if (deleteType === 'delete-for-me') {
            return {
              ...chat,
              lastMessage: {
                ...chat.lastMessage,
                isDeleted: true,
                content: '',
                file_url: null,
              },
            }
          }

          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              isDeleted: true,
              isDeletedForEveryone: true,
              content: '',
              file_url: null,
            },
          }
        }
        return chat
      })
    },
    setCurrentCallStatus: (state, action) => {
      state.currentCallStatus = action.payload
    },
    setCallParticipants: (state, action) => {
      state.callParticipants = action.payload
    },
    setHighlightedMessageId: (
      state,
      action: PayloadAction<{ id: number | string; timestamp?: string } | number | string | null>,
    ) => {
      if (action.payload === null || typeof action.payload === 'string' || typeof action.payload === 'number') {
        state.highlightedMessageId = action.payload
      } else {
        state.highlightedMessageId = action.payload.id
        state.highlightedMessageTimestamp = action.payload.timestamp
      }
    },
    togglePinChat: (
      state,
      action: PayloadAction<{ id: number | string; type: string; pinned: boolean; pinned_at?: string | null }>,
    ) => {
      const { id, type, pinned, pinned_at } = action.payload

      const targetId = String(id)
      const targetType = String(type)
      const normalizedPinned = Boolean(typeof pinned === 'string' ? pinned === 'true' || pinned === '1' : pinned)
      const normalizedPinnedAt = normalizedPinned ? pinned_at ?? new Date().toISOString() : null

      const updatedChats = state.recentChats.map((chat) =>
        String(chat.chat_id) === targetId && String(chat.chat_type) === targetType
          ? { ...chat, isPinned: normalizedPinned, pinned_at: normalizedPinnedAt }
          : chat,
      )

      state.recentChats = sortRecentChats(updatedChats)

      if (
        state.selectedChat &&
        String(state.selectedChat.id) === targetId &&
        String(state.selectedChat.type) === targetType
      ) {
        state.selectedChat = { ...state.selectedChat, pinned: normalizedPinned }
        storage.setItem(STORAGE_KEYS.SELECTED_CHAT, state.selectedChat)
      }
    },
    setRecentChatBlockedStatus: (
      state,
      action: PayloadAction<{ chatId: number | string | undefined; isBlocked: boolean }>,
    ) => {
      const { chatId, isBlocked } = action.payload
      if (!chatId) return

      state.recentChats = state.recentChats.map((chat) =>
        chat.chat_type === 'direct' && chat.chat_id === chatId ? { ...chat, isBlocked } : chat,
      )
    },
    setRecentChatFavoriteStatus: (
      state,
      action: PayloadAction<{ chatId: number | string | undefined; chatType: 'direct' | 'group'; isFavorite: boolean }>,
    ) => {
      const { chatId, chatType, isFavorite } = action.payload
      if (!chatId) return

      state.recentChats = state.recentChats.map((chat) =>
        chat.chat_id === chatId && chat.chat_type === chatType ? { ...chat, isFavorite } : chat,
      )

      if (state.selectedUser && state.selectedUser.chat_id === chatId && state.selectedUser.chat_type === chatType) {
        state.selectedUser = { ...state.selectedUser, isFavorite }
      }
    },
    setRecentChatLockStatus: (
      state,
      action: PayloadAction<{
        chatId: number | string
        chatType: 'direct' | 'group' | 'announcement' | 'broadcast'
        isLocked: boolean
      }>,
    ) => {
      const { chatId, chatType, isLocked } = action.payload

      // Helper to check if chat matches (handles announcements)
      const isMatchingChat = (chat: any) => {
        if (chatType === 'announcement') {
          return chat.chat_id === chatId && chat.isAnnouncement === true
        }
        if (chatType === 'broadcast') {
          return chat.chat_id === chatId && (chat.isBroadcast === true || chat.chat_type === 'broadcast')
        }
        return chat.chat_id === chatId && chat.chat_type === chatType
      }

      state.recentChats = state.recentChats.map((chat) => (isMatchingChat(chat) ? { ...chat, isLocked } : chat))

      // Update selectedUser if it matches
      const isSelectedUserMatch =
        state.selectedUser &&
        ((chatType === 'announcement' && state.selectedUser.isAnnouncement && state.selectedUser.chat_id === chatId) ||
          (chatType === 'broadcast' &&
            (state.selectedUser.isBroadcast || state.selectedUser.chat_type === 'broadcast') &&
            state.selectedUser.chat_id === chatId) ||
          (chatType !== 'announcement' &&
            chatType !== 'broadcast' &&
            state.selectedUser.chat_type === chatType &&
            state.selectedUser.chat_id === chatId))

      if (isSelectedUserMatch) {
        state.selectedUser = { ...state.selectedUser, isLocked }
      }
    },
    selSelectedUserProfile: (state, action) => {
      state.selectedUserProfile = action.payload
    },
    toggleMuteChat: (state, action: PayloadAction<{ chatId: number | string; chatType: string; isMuted: boolean }>) => {
      const { chatId, chatType, isMuted } = action.payload

      state.recentChats = state.recentChats.map((chat) =>
        chat.chat_id === chatId && chat.chat_type === chatType ? { ...chat, isMuted } : chat,
      )

      const currentChatId =
        chatType === 'direct' ? state.selectedUser?.chat_id || state.selectedUser?.id : state.selectedUser?.id

      if (currentChatId === chatId && state.selectedUser?.chat_type === chatType) {
        state.selectedUser = { ...state.selectedUser, isMuted }
      }
    },
    decrementUnreadCount: (
      state,
      action: PayloadAction<{ chatId: number; chatType: 'direct' | 'group'; amount?: number }>,
    ) => {
      const { chatId, chatType, amount = 1 } = action.payload
      state.recentChats = state.recentChats.map((chat) =>
        chat.chat_id === chatId && chat.chat_type === chatType
          ? { ...chat, unreadCount: Math.max(0, chat.unreadCount - amount) }
          : chat,
      )
    },
    updateMentionStatus: (
      state,
      action: PayloadAction<{ chatId: number; chatType: 'direct' | 'group'; hasMentions: boolean }>,
    ) => {
      const { chatId, chatType, hasMentions } = action.payload
      state.recentChats = state.recentChats.map((chat) =>
        chat.chat_id === chatId && chat.chat_type === chatType ? { ...chat, is_unread_mentions: hasMentions } : chat,
      )
    },
    incrementUnreadCount: (
      state,
      action: PayloadAction<{ chatId: number; chatType: 'direct' | 'group'; amount?: number }>,
    ) => {
      const { chatId, chatType, amount = 1 } = action.payload
      const index = state.recentChats.findIndex((chat) => chat.chat_id === chatId && chat.chat_type === chatType)

      if (index !== -1) {
        state.recentChats[index] = {
          ...state.recentChats[index],
          unreadCount: state.recentChats[index].unreadCount + amount,
        }
      } else {
        state.recentChats = [
          {
            chat_type: chatType,
            chat_id: chatId,
            name: 'Unknown',
            lastMessage: null,
            unreadCount: amount,
            isMuted: false,
            isPinned: false,
            pinned_at: null,
            isArchived: false,
            latest_message_at: new Date().toISOString(),
            avatar: undefined,
            status: undefined,
            is_unread_mentions: false,
            is_verified: false,
          },
          ...state.recentChats,
        ]
      }
    },
    updateLastMessage: (
      state,
      action: PayloadAction<{
        chatId: number
        chatType: 'direct' | 'group' | 'broadcast'
        lastMessage: any
        chatMeta?: Partial<RecentChat>
      }>,
    ) => {
      const { chatId, chatType, lastMessage, chatMeta } = action.payload
      const index = chatMeta?.isAnnouncement
        ? state.recentChats.findIndex(
            (chat) => chat.chat_id === chatId && chat.chat_type === chatType && chat.isAnnouncement === true,
          )
        : state.recentChats.findIndex((chat) => chat.chat_id === chatId && chat.chat_type === chatType)

      const existingChat = index !== -1 ? state.recentChats[index] : null
      const mergedMeta: Partial<RecentChat> = {
        name: chatMeta?.name || 'Unknown',
        avatar: chatMeta?.avatar,
        isMuted: chatMeta?.isMuted ?? existingChat?.isMuted ?? false,
        isPinned: chatMeta?.isPinned ?? existingChat?.isPinned ?? false,
        pinned_at: chatMeta?.pinned_at ?? existingChat?.pinned_at ?? null,
        isArchived: chatMeta?.isArchived ?? existingChat?.isArchived ?? false,
        status: chatMeta?.status ?? existingChat?.status,
        is_unread_mentions: chatMeta?.is_unread_mentions ?? existingChat?.is_unread_mentions ?? false,
        is_verified: chatMeta?.is_verified ?? existingChat?.is_verified ?? false,
        sender: chatMeta?.sender ?? existingChat?.sender,
        isLocked: chatMeta.isLocked,
      }

      if (chatMeta?.unreadCount !== undefined) {
        mergedMeta.unreadCount = chatMeta.unreadCount
      } else if (existingChat) {
        mergedMeta.unreadCount = existingChat.unreadCount
      } else {
        mergedMeta.unreadCount = 0
      }

      if (index !== -1) {
        const updatedChat: RecentChat = {
          ...state.recentChats[index],
          ...mergedMeta,
          lastMessage,
          latest_message_at: lastMessage.created_at,
          isAnnouncement: chatMeta?.isAnnouncement ?? state.recentChats[index].isAnnouncement ?? false,
        }
        const updatedChats = state.recentChats.map((chat, idx) => (idx === index ? updatedChat : chat))
        state.recentChats = sortRecentChats(updatedChats)
      } else {
        const newChat: RecentChat = {
          chat_type: chatType,
          chat_id: chatId,
          name: mergedMeta.name || 'Unknown',
          lastMessage,
          unreadCount: mergedMeta.unreadCount ?? 0,
          isMuted: mergedMeta.isMuted ?? false,
          isPinned: mergedMeta.isPinned ?? false,
          pinned_at: mergedMeta.pinned_at ?? null,
          isArchived: mergedMeta.isArchived ?? false,
          latest_message_at: lastMessage.created_at,
          status: mergedMeta.status,
          avatar: mergedMeta.avatar,
          is_unread_mentions: mergedMeta.is_unread_mentions ?? false,
          is_verified: mergedMeta.is_verified ?? false,
          sender: mergedMeta.sender,
          isAnnouncement: chatMeta?.isAnnouncement ?? false,
        }
        state.recentChats = sortRecentChats([...state.recentChats, newChat])
      }
    },
    toggleArchiveChat: (
      state,
      action: PayloadAction<{ chatId: number | string; chatType: string; isArchived: boolean }>,
    ) => {
      const { chatId, chatType, isArchived } = action.payload

      state.recentChats = state.recentChats.map((chat) =>
        chat.chat_id === chatId && chat.chat_type === chatType ? { ...chat, isArchived } : chat,
      )

      if (state.selectedChat && state.selectedChat.id === chatId && state.selectedChat.type === chatType) {
        state.selectedChat = { ...state.selectedChat, isArchived }
        storage.setItem(STORAGE_KEYS.SELECTED_CHAT, state.selectedChat)
      }
    },
    resetUnreadCount: (state, action: PayloadAction<{ chatId: number | string; chatType: 'direct' | 'group' }>) => {
      const { chatId, chatType } = action.payload
      state.recentChats = state.recentChats.map((chat) =>
        chat.chat_id === chatId && chat.chat_type === chatType
          ? { ...chat, unreadCount: 0, is_unread_mentions: false }
          : chat,
      )
    },
    removeRecentChat: (state, action: PayloadAction<{ chatId: number | string; chatType: 'direct' | 'group' }>) => {
      const { chatId, chatType } = action.payload
      state.recentChats = state.recentChats.filter((chat) => !(chat.chat_id === chatId && chat.chat_type === chatType))
    },
    updateChatMetadata: (
      state,
      action: PayloadAction<{
        chatId: number | string
        chatType: 'direct' | 'group' | 'broadcast'
        metadata: Partial<Pick<RecentChat, 'name' | 'avatar' | 'is_verified'>>
      }>,
    ) => {
      const { chatId, chatType, metadata } = action.payload
      const index = state.recentChats.findIndex((chat) => chat.chat_id === chatId && chat.chat_type === chatType)

      if (index !== -1) {
        state.recentChats[index] = {
          ...state.recentChats[index],
          ...metadata,
        }
      }
    },
    setOpenReportModal: (state) => {
      state.openReportModal = !state.openReportModal
    },
    resetChatState: (state) => {
      // Reset all chat-related state to initial values
      state.allMembers = []
      state.chatMembers = []
      state.chats = []
      state.currentUser = null
      state.selectedUser = null
      state.isTyping = false
      state.activeCallUser = null
      state.replyMessage = null
      state.editMessage = null
      state.selectedChatMessages = []
      state.currentCallStatus = ''
      state.openReportModal = false
      state.callParticipants = { participants: [], channelId: null, chatType: '' }
      state.selectedChat = null
      state.targetMessageId = null
      state.highlightedMessageId = null
      state.recentChats = []
      state.recentChatsLoading = false
      state.selectedUserProfile = null

      // Clear storage items
      storage.removeItem(STORAGE_KEYS.SELECTED_USER)
      storage.removeItem(STORAGE_KEYS.SELECTED_CHAT)
      saveSelectedUserIdToStorage(null)
    },
  },
})

export const {
  setAllMembers,
  setCurrentUser,
  setSelectedUser,
  setSelectedChatMessages,
  addOrUpdateMessage,
  updateMessageReactions,
  updateMessageStatus,
  setChats,
  setRecentChats,
  setRecentChatsLoading,
  setActiveCallUser,
  setReplyMessage,
  setEditMessage,
  deleteMessage,
  setCurrentCallStatus,
  setCallParticipants,
  selectChat,
  setHighlightedMessageId,
  togglePinChat,
  updateMessagePin,
  toggleMuteChat,
  setRecentChatBlockedStatus,
  setRecentChatFavoriteStatus,
  setRecentChatLockStatus,
  toggleArchiveChat,
  selSelectedUserProfile,
  decrementUnreadCount,
  updateMentionStatus,
  incrementUnreadCount,
  updateLastMessage,
  resetUnreadCount,
  removeRecentChat,
  updateChatMetadata,
  updateMessageStarred,
  setOpenReportModal,
  resetChatState,
} = ChatSlice.actions

export default ChatSlice.reducer
