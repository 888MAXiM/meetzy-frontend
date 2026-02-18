// @ts-nocheck
import { useEffect } from 'react'
import { useQueryClient, type QueryKey } from '@tanstack/react-query'
import { KEYS } from '../../constants/keys'
import { CHAT_CONSTANTS } from '../../constants/web'
import { SOCKET } from '../../constants/socket'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import {
  addOrUpdateMessage,
  deleteMessage,
  togglePinChat,
  toggleArchiveChat,
  toggleMuteChat,
  updateMessageReactions,
  updateMessageStatus,
  decrementUnreadCount,
  updateMentionStatus,
  incrementUnreadCount,
  updateLastMessage,
  resetUnreadCount,
  setRecentChats,
  setRecentChatBlockedStatus,
  setSelectedChatMessages,
  updateMessageStarred,
  selSelectedUserProfile,
  setSelectedUser,
  updateMessagePin,
  updateChatMetadata,
  resetChatState,
  selectChat,
} from '../../redux/reducers/messenger/chatSlice'
import type { UserStatus } from '../../redux/reducers/messenger/userStatusSlice'
import { updateBulkUserStatuses, updateUserStatus } from '../../redux/reducers/messenger/userStatusSlice'
import { setUserSetting } from '../../redux/reducers/userSettingSlice'
import { setSetting } from '../../redux/reducers/settingSlice'
import Store from '../../redux/store'
import { socket } from '../../services/socket-setup'
import type { Message, SelectedUserProfile, StarredMessage } from '../../types/api'
import { NotificationService, NotificationServiceClass } from '../../services/notification-service'
import { DeletedMessagePayload } from '../../types/components/socket'
import {
  deleteStatusFromFeed,
  addMyStatus,
  addStatusToFeed,
  addViewToStatus,
} from '../../redux/reducers/messenger/statusSlice'
import { logout } from '../../redux/reducers/authSlice'
import { decryptMessageIfNeeded } from '../../utils/e2e-helpers'

const getMessagePreview = (message: Message): string => {
  if (message.message_type === 'text' && message.content) {
    return message.content
  }

  switch (message.message_type) {
    case 'image':
      return 'Image message'
    case 'file':
      return 'File attachment'
    case 'sticker':
      return 'Sticker message'
    default:
      return message.content || 'New message'
  }
}

const getDecryptedMessagePreview = async (message: Message, currentUserId?: number): Promise<string> => {
  const isEncrypted =
    message.is_encrypted === true ||
    message.is_encrypted === 1 ||
    message.is_encrypted === 'true' ||
    message.is_encrypted === '1'

  let looksEncrypted = false
  if (message.content) {
    try {
      const parsed = JSON.parse(message.content)
      if (parsed && typeof parsed === 'object') {
        looksEncrypted =
          ('encryptedKey' in parsed && 'iv' in parsed && 'encryptedData' in parsed) ||
          ('sender' in parsed && 'recipient' in parsed) ||
          ('sender' in parsed && 'members' in parsed && typeof parsed.members === 'object')
      }
    } catch {}
  }

  const shouldDecrypt = isEncrypted || looksEncrypted

  if (shouldDecrypt && message.content) {
    try {
      const isSent = !!currentUserId && (message.sender?.id === currentUserId || message.sender_id === currentUserId)
      const decrypted = await decryptMessageIfNeeded(
        message.content,
        true,
        isSent,
        message.sender?.id || message.sender_id,
        message.isForwarded,
        currentUserId,
      )

      if (message.message_type === 'text') {
        return decrypted
      }
    } catch (error) {
      console.error('Error decrypting message for notification:', error)
    }
  }

  return getMessagePreview(message)
}

export const useSocketHandler = () => {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { user, token } = useAppSelector((store) => store.auth)

  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null
    const processedMessageIds = new Set<string | number>()

    if (user && token) {
      const handleBulkUserStatusUpdate = (
        userStatuses: Array<{ userId: number; status: string; lastSeen: string | null }>,
      ) => {
        const formattedStatuses: UserStatus[] = userStatuses.map((us) => ({
          userId: us.userId,
          status: us.status === 'online' ? 'online' : 'offline',
          lastSeen: us.lastSeen,
        }))
        dispatch(updateBulkUserStatuses(formattedStatuses))
      }

      const handleStatusUploaded = (data) => {
        const statusData = {
          status: {
            id: data.status?.id,
            type: data.status?.type,
            file_url: data.status?.file_url,
            caption: data.status?.caption,
            is_sponsored: data.status.is_sponsored,
            created_at: data.status?.created_at,
            expires_at: data.status?.expires_at,
            view_count: data.status?.view_count || 0,
            views: data.status?.views || [],
          },
          user: {
            id: data.status?.user_id || data.user?.id,
            name: data.user?.name || user?.name,
            avatar: data.user?.avatar || user?.avatar,
          },
        }

        dispatch(addStatusToFeed(statusData))

        if (statusData.user.id == user?.id) {
          dispatch(addMyStatus(statusData))
        }
      }

      const handleStatusDeleted = (data: { status_id: string; user_id: string }) => {
        dispatch(
          deleteStatusFromFeed({
            status_id: data.status_id,
            user_id: data.user_id,
          }),
        )

        if (user?.id === data.user_id) {
          queryClient.invalidateQueries({ queryKey: [KEYS.STATUS_FEED] })
        }

        queryClient.invalidateQueries({ queryKey: [KEYS.MUTED_STATUSES] })
      }

      const handleStatusViewed = (data) => {
        dispatch(
          addViewToStatus({
            status_id: data.status_id,
            viewer_id: data.viewer_id,
            viewer_name: data.viewer_name,
            viewed_at: data.viewed_at,
            view_count: data.view_count,
            current_user_id: user?.id,
          }),
        )
      }
      const handleUserStatusUpdate = (data: { userId: number; status: string; lastSeen: string | null }) => {
        dispatch(
          updateUserStatus({
            userId: data.userId,
            status: data.status === 'online' ? 'online' : 'offline',
            lastSeen: data.lastSeen,
          }),
        )
      }

      const sendStatusHeartbeat = () => {
        if (!socket.connected || !user?.id) return
        socket.emit(SOCKET.Emitters.Set_Online)
        socket.emit(SOCKET.Emitters.Request_Status_Update)
      }

      const emitDelivered = (message: Message) => {
        if (!socket.connected || !message?.id || !message?.sender_id) return
        const authenticatedUserId = Store.getState().auth.user?.id
        if (!authenticatedUserId || message.sender_id === authenticatedUserId) return

        socket.emit(SOCKET.Emitters.Message_Delivered, {
          messageId: message.id,
          senderId: message.sender.id,
        })
      }

      const emitSeen = (message: Message) => {
        if (!socket.connected || !message?.id) return
        const authenticatedUserId = Store.getState().auth.user?.id
        if (!authenticatedUserId) return

        if (message.sender_id === authenticatedUserId) return

        // Check read receipts privacy setting - don't send read receipts if disabled
        const currentUserSetting = Store.getState().userSettings.userSetting
        if (currentUserSetting?.read_receipts === false) return

        if (message.group_id) {
          socket.emit(SOCKET.Emitters.Mark_Last_Message_Seen, {
            lastMessageId: message.id,
            groupId: message.group_id,
          })
        } else if (message.sender_id) {
          socket.emit(SOCKET.Emitters.Mark_Last_Message_Seen, {
            lastMessageId: message.id,
            recipientId: message.sender_id,
          })
        } else if (message.recipient_id && message.sender_id !== authenticatedUserId) {
          socket.emit(SOCKET.Emitters.Mark_Last_Message_Seen, {
            lastMessageId: message.id,
            recipientId: message.sender_id || message.recipient_id,
          })
        }
      }

      const groupLeaveTimes = new Map<number, number>()

      const processMessage = (message: Message) => {
        if (message.id && processedMessageIds.has(message.id)) {
          console.warn('Duplicate message detected, skipping:', message.id)
          return
        }
        if (message.id) {
          processedMessageIds.add(message.id)
          if (processedMessageIds.size > 1000) {
            const firstId = processedMessageIds.values().next().value
            processedMessageIds.delete(firstId)
          }
        }

        if (message.sender_id && typeof message.sender_id === 'object')
          message.sender_id = message.sender_id._id || message.sender_id.id
        if (message.recipient_id && typeof message.recipient_id === 'object')
          message.recipient_id = message.recipient_id._id || message.recipient_id.id

        const state = Store.getState()
        const authenticatedUserId = state.auth.user?.id

        if (message.group?.id && authenticatedUserId) {
          if (message.message_type === 'system' && message.metadata) {
            let metadata = message.metadata
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata)
              } catch (e) {
                metadata = {}
              }
            }

            if (metadata.system_action === 'member_left' && metadata.user_id === authenticatedUserId) {
              const leaveTime = new Date(message.created_at).getTime()
              groupLeaveTimes.set(message.group_id, leaveTime)
            }
          }

          if (message.message_type !== 'system') {
            const leaveTime = groupLeaveTimes.get(message?.group?.id)
            if (leaveTime) {
              const messageTime = new Date(message.created_at).getTime()
              if (messageTime > leaveTime) {
                return
              }
            }

            const selectedChat = state.chat.selectedUser
            if (selectedChat?.chat_type === 'group' && String(selectedChat?.id) === String(message?.group?.id)) {
              const selectedChatMessages = state.chat.selectedChatMessages
              const allMessages = selectedChatMessages.flatMap((section: any) => section.messages || [])

              const leaveMessage = allMessages
                .filter((msg: Message) => msg.message_type === 'system' && msg?.group?.id === message?.group?.id)
                .find((msg: Message) => {
                  if (!msg.metadata) return false
                  let metadata = msg.metadata
                  if (typeof metadata === 'string') {
                    try {
                      metadata = JSON.parse(metadata)
                    } catch {
                      return false
                    }
                  }
                  return metadata.system_action === 'member_left' && metadata.user_id === authenticatedUserId
                })

              if (leaveMessage) {
                const leaveTime = new Date(leaveMessage.created_at).getTime()
                const messageTime = new Date(message.created_at).getTime()

                if (messageTime > leaveTime) {
                  return
                }

                groupLeaveTimes.set(message.group_id, leaveTime)
              }
            }
          }
        }

        let messageMetadata = message.metadata
        if (typeof messageMetadata === 'string') {
          try {
            messageMetadata = JSON.parse(messageMetadata)
          } catch (e) {
            messageMetadata = {}
          }
        }
        const isBroadcast = messageMetadata?.is_broadcast && messageMetadata?.broadcast_id
        const broadcastId = isBroadcast ? messageMetadata.broadcast_id : null
        const isAnnouncement = message.message_type === 'announcement'

        let _targetId: number | undefined
        if (message.group?.id) {
          _targetId = message.group?.id
        } else if (isBroadcast && broadcastId) {
          _targetId = broadcastId
        } else if (isAnnouncement) {
          _targetId = message.sender_id
        } else if (message.recipient_id && message.sender_id) {
          _targetId = message.sender_id === user?.id ? message.recipient_id : message.sender_id
        } else {
          _targetId = message.recipient_id || message.sender_id
        }

        const selectedChat = state.chat.selectedUser
        const selectedChatMessages = state.chat.selectedChatMessages
        const isIncoming = authenticatedUserId ? message.sender_id !== authenticatedUserId : true
        const windowHidden = typeof document !== 'undefined' ? document.hidden : false

        let isCurrentChat = false

        if (isAnnouncement) {
          isCurrentChat =
            selectedChat?.isAnnouncement === true &&
            (String(selectedChat?.chat_id) === String(message.sender_id) ||
              String(selectedChat?.id) === String(message.sender_id))
        } else if (message.group?.id) {
          isCurrentChat = selectedChat?.chat_type === 'group' && selectedChat?.chat_id == message.group?.id
        } else if (isBroadcast && broadcastId) {
          const isBroadcastChat =
            (selectedChat?.isBroadcast || selectedChat?.chat_type === 'broadcast') &&
            (String(selectedChat?.chat_id) === String(broadcastId) || String(selectedChat?.id) === String(broadcastId))

          const otherUserId = message.sender_id === authenticatedUserId ? message.recipient_id : message.sender_id
          const isDirectChat =
            selectedChat?.chat_type === 'direct' &&
            otherUserId &&
            (selectedChat?.chat_id == otherUserId || selectedChat?.id == otherUserId)

          isCurrentChat = Boolean(isBroadcastChat || isDirectChat)
        } else {
          const otherUserId = message.sender_id == authenticatedUserId ? message.recipient_id : message.sender_id
          if (selectedChat?.chat_type !== 'group' && otherUserId) {
            isCurrentChat = selectedChat?.id == otherUserId
          }
        }

        let chatType: string
        let chatId: number | string | undefined

        if (isAnnouncement) {
          chatType = 'direct'
          chatId = message.sender_id
        } else if (message.group_id) {
          chatType = 'group'
          chatId = message.group_id
        } else if (isBroadcast && broadcastId) {
          const isMergedMessage = Array.isArray(message.recipients) && message.recipients.length > 0

          if (message.sender_id === authenticatedUserId) {
            if (isMergedMessage) {
              chatType = 'broadcast'
              chatId = broadcastId
            } else {
              chatType = 'direct'
              chatId = message.recipient_id
            }
          } else {
            chatType = 'direct'
            chatId = message.sender_id
          }
        } else {
          chatType = 'direct'
          chatId = _targetId
        }

        if (!chatId) {
          return
        }

        const recentChatState = state.chat.recentChats
        const existingRecent = isAnnouncement
          ? recentChatState.find(
              (chat) => chat.chat_id === chatId && chat.chat_type === chatType && chat.isAnnouncement === true,
            )
          : recentChatState.find((chat) => chat.chat_id === chatId && chat.chat_type === chatType)
        const isChatMuted = existingRecent?.isMuted || false

        if (isIncoming) {
          if (isChatMuted) {
            NotificationServiceClass.stopTabHighlight()
          } else {
            if (!isCurrentChat || windowHidden) {
              const recentChats = state.chat.recentChats
              const totalUnreadCount = recentChats.reduce((total, chat) => {
                return total + (chat.unreadCount || 0)
              }, 0)

              const finalUnreadCount = totalUnreadCount + (isIncoming ? 1 : 0)

              // Decrypt message content for notification
              const notificationTitle = isAnnouncement
                ? state.settings?.app_name || 'Announcements'
                : message.sender?.name || 'New message'

              getDecryptedMessagePreview(message, authenticatedUserId)
                .then((decryptedPreview) => {
                  NotificationService.notifyMessage({
                    title: notificationTitle,
                    body: decryptedPreview,
                    tag: `message-${message.id}`,
                    userName: notificationTitle,
                    messagePreview: decryptedPreview,
                    unreadCount: finalUnreadCount,
                    highlightLabel: notificationTitle,
                    forceNotification: windowHidden,
                  }).catch((error) => {
                    console.warn('Failed to display message notification:', error)
                  })
                })
                .catch((error) => {
                  console.error('Failed to decrypt message for notification:', error)
                  // Fallback to regular preview if decryption fails
                  NotificationService.notifyMessage({
                    title: notificationTitle,
                    body: getMessagePreview(message),
                    tag: `message-${message.id}`,
                    userName: notificationTitle,
                    messagePreview: getMessagePreview(message),
                    unreadCount: finalUnreadCount,
                    highlightLabel: notificationTitle,
                    forceNotification: windowHidden,
                  }).catch((notifError) => {
                    console.warn('Failed to display message notification:', notifError)
                  })
                })
            }
          }
        } else {
          NotificationServiceClass.stopTabHighlight()
        }

        if (message.id && chatId) {
          let participantName = existingRecent?.name || ''
          let participantAvatar = existingRecent?.avatar

          if (!participantName || isAnnouncement) {
            if (isAnnouncement) {
              const appName = state.settings?.app_name || 'Announcements'
              participantName = appName
              participantAvatar = null
            } else if (chatType === 'group') {
              participantName = message?.group?.name || 'Unnamed group'
              participantAvatar = message?.group?.avatar || null
            } else if (chatType === 'broadcast') {
              participantName = existingRecent?.name || 'Broadcast'
              participantAvatar = existingRecent?.avatar || null
            } else {
              const otherParticipant = message.sender_id === authenticatedUserId ? message.recipient : message.sender
              participantName = otherParticipant?.name || 'Unknown user'
              participantAvatar = otherParticipant?.avatar || null
            }
          }

          let messageContent = message.content || ''
          if (message.message_type === 'system' && message.metadata) {
            let metadata = message.metadata
            if (typeof metadata === 'string') {
              try {
                metadata = JSON.parse(metadata)
              } catch (e) {
                metadata = {}
              }
            }

            if (metadata.system_action) {
              const systemAction = metadata.system_action
              if (systemAction === 'member_left' && metadata.user_id === authenticatedUserId) {
                messageContent = 'You left the group'
              } else if (systemAction === 'group_created' && metadata.creator_user_id === authenticatedUserId) {
                messageContent = 'You created this group.'
              }
            }
          }

          const lastMessage = {
            id: message.id,
            sender_id: message.sender_id,
            group_id: message.group_id || null,
            recipient_id: message.recipient_id || null,
            parent_id: message.parent_id || null,
            content: messageContent,
            message_type: message.message_type,
            file_url: message.file_url || null,
            file_type: message.file_type || null,
            metadata: message.metadata || null,
            created_at: message.created_at,
            updated_at: message.updated_at,
            deleted_at: message.deleted_at || null,
            sender: message.sender,
            recipient: message.recipient,
            group: message.group,
            statuses: message.statuses || [],
          }

          let verifiedStatus = existingRecent?.is_verified ?? false
          let senderInfo = existingRecent?.sender

          if (chatType === 'direct' && !message.group_id) {
            if (isIncoming) {
              verifiedStatus = Boolean(message.sender?.is_verified)
              if (message.sender) {
                senderInfo = {
                  id: message.sender.id || message.sender_id,
                  name: message.sender.name || participantName,
                  avatar: message.sender.avatar || null,
                  is_verified: message.sender.is_verified || false,
                }
              }
            } else {
              verifiedStatus = Boolean(message.recipient?.is_verified)
              if (message.recipient) {
                senderInfo = {
                  id: message.recipient.id || message.recipient_id,
                  name: message.recipient.name || participantName,
                  avatar: message.recipient.avatar || null,
                  is_verified: message.recipient.is_verified || false,
                }
              }
            }
          }

          const shouldIncrementUnread =
            isIncoming &&
            message.id &&
            message.sender_id &&
            message.message_type !== 'system' &&
            message.message_type !== 'announcement' &&
            (!isCurrentChat || windowHidden) &&
            chatId

          const chatMeta: Partial<RecentChat> = {
            name: participantName,
            avatar: participantAvatar,
            isMuted: existingRecent?.isMuted ?? false,
            isPinned: existingRecent?.isPinned ?? false,
            status: existingRecent?.status,
            is_unread_mentions: existingRecent?.is_unread_mentions ?? false,
            is_verified: verifiedStatus,
            sender: senderInfo,
            isAnnouncement: isAnnouncement || existingRecent?.isAnnouncement || false,
            isLocked: message.isLocked,
          }

          if (typeof message.unreadCount === 'number') {
            chatMeta.unreadCount = message.unreadCount
          } else {
            chatMeta.unreadCount = existingRecent?.unreadCount ?? 0
          }

          dispatch(
            updateLastMessage({
              chatId,
              chatType,
              lastMessage,
              chatMeta,
            }),
          )
        }

        if (isIncoming && message.id && message.sender_id && message.message_type !== 'system') {
          if (!isAnnouncement) {
            emitDelivered(message)

            if (isCurrentChat && !windowHidden) {
              emitSeen(message)
            } else if (!isCurrentChat || windowHidden) {
              if (typeof message.unreadCount !== 'number' && chatId) {
                dispatch(incrementUnreadCount({ chatId, chatType }))
              }
            }
          } else {
            if (!isCurrentChat || windowHidden) {
              if (typeof message.unreadCount !== 'number' && chatId) {
                dispatch(incrementUnreadCount({ chatId, chatType }))
              }
            }
          }

          if (message.mentions && Array.isArray(message.mentions) && message.mentions.includes(authenticatedUserId)) {
            if (message.group_id) {
              dispatch(updateMentionStatus({ chatId: message.group_id, chatType: 'group', hasMentions: true }))
            } else if (_targetId) {
            }
          }
        }

        if (isAnnouncement && isCurrentChat) {
          dispatch(
            addOrUpdateMessage({
              message,
              currentUserId: authenticatedUserId ?? '',
            }),
          )
        } else if (!isAnnouncement) {
          dispatch(
            addOrUpdateMessage({
              message,
              currentUserId: authenticatedUserId ?? '',
            }),
          )
        }
      }

      const handleReceiveMessage = (data: Message | Message[]) => {
        if (Array.isArray(data)) {
          data.forEach(processMessage)
        } else {
          processMessage(data)
        }
      }

      const handleMessageUpdated = (updatedMessage: Message) => {
        // Update infinite query cache (used by Chat component)
        const infiniteQueryKey = updatedMessage.group_id
          ? [KEYS.GET_MESSAGES, updatedMessage.group_id, 'group']
          : [KEYS.GET_MESSAGES, updatedMessage.recipient_id || updatedMessage.sender_id, 'direct']

        queryClient.setQueryData(infiniteQueryKey, (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData

          const updatedPages = oldData.pages.map((page: any) => {
            if (!page.messages || !Array.isArray(page.messages)) return page

            const updatedMessages = page.messages.map((msg: Message) =>
              msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg,
            )

            return {
              ...page,
              messages: updatedMessages,
            }
          })

          return {
            ...oldData,
            pages: updatedPages,
          }
        })

        // Also update the regular messages query cache (for backward compatibility)
        const regularQueryKey = updatedMessage.group_id
          ? [KEYS.MESSAGES, 'group', updatedMessage.group_id]
          : [KEYS.MESSAGES, 'direct', updatedMessage.recipient_id || updatedMessage.sender_id]

        queryClient.setQueryData(regularQueryKey, (oldData: any) => {
          if (!oldData) return oldData

          if (Array.isArray(oldData.messages)) {
            const updatedMessages = oldData.messages.map((msg: Message) =>
              msg.id === updatedMessage.id ? { ...msg, ...updatedMessage, isEdited: true } : msg,
            )
            return {
              ...oldData,
              messages: updatedMessages,
            }
          }

          return oldData
        })

        dispatch(
          addOrUpdateMessage({
            message: updatedMessage,
            currentUserId: user?.id,
          }),
        )
      }

      const handleMessageReactionUpdated = (data: {
        messageId: number
        reactions: Array<{ emoji: string; count: number; users: number[] }>
      }) => {
        dispatch(updateMessageReactions(data))
      }

      const handleMessageStatusUpdated = (data: {
        messageId: number
        userId: number
        status: string
        updated_at?: string
      }) => {
        if (!data?.messageId || !data?.userId || !data?.status) {
          return
        }

        dispatch(
          updateMessageStatus({
            messageId: data.messageId,
            userId: data.userId,
            status: data.status as 'sent' | 'delivered' | 'read' | 'seen',
          }),
        )

        const state = Store.getState()
        const selectedUser = state.chat.selectedUser
        if (!selectedUser) return

        const isGroupChat = selectedUser.chat_type === 'group'
        const queryKey = isGroupChat
          ? [KEYS.MESSAGES, 'group', selectedUser.chat_id]
          : [KEYS.MESSAGES, 'direct', selectedUser.chat_id]

        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData

          const updateMessagesRecursive = (messages: any[]): any[] => {
            return messages.map((msg: any) => {
              if (msg.id === data.messageId) {
                const statuses = msg.statuses || []
                const statusIndex = statuses.findIndex((s: any) => s.user_id === data.userId)

                if (statusIndex !== -1) {
                  statuses[statusIndex] = {
                    ...statuses[statusIndex],
                    status: data.status,
                    updated_at: data.updated_at || new Date().toISOString(),
                  }
                } else {
                  statuses.push({
                    user_id: data.userId,
                    status: data.status,
                    updated_at: data.updated_at || new Date().toISOString(),
                  })
                }

                return { ...msg, statuses: [...statuses] }
              }

              if (msg.messages && Array.isArray(msg.messages)) {
                return { ...msg, messages: updateMessagesRecursive(msg.messages) }
              }

              if (msg.messageGroups && Array.isArray(msg.messageGroups)) {
                return {
                  ...msg,
                  messageGroups: msg.messageGroups.map((group: any) => ({
                    ...group,
                    messages: group.messages ? updateMessagesRecursive(group.messages) : [],
                  })),
                }
              }

              return msg
            })
          }

          if (Array.isArray(oldData.messages)) {
            return {
              ...oldData,
              messages: updateMessagesRecursive(oldData.messages),
            }
          }

          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                messages: Array.isArray(page.messages) ? updateMessagesRecursive(page.messages) : page.messages,
              })),
            }
          }

          return oldData
        })
      }

      const handleMessageDeleted = (
        data: DeletedMessagePayload & {
          messageIds?: number[]
          isBroadcast?: boolean
          broadcastId?: number
          deletedBy?: number
        },
      ) => {
        const deleteType = (data as any).deleteType || 'delete-for-everyone'
        const isBroadcast = (data as any).isBroadcast === true
        const broadcastId = (data as any).broadcastId
        const deletedBy = (data as any).deletedBy
        const rawMessageIds = (data as any).messageIds || [
          data.messageId || (data as any)._id || (data as any).deletedMessage?.id || (data as any).deletedMessage?._id,
        ]
        const messageIds = Array.isArray(rawMessageIds) ? rawMessageIds : [rawMessageIds]

        if (isBroadcast && broadcastId) {
          messageIds.forEach((msgId: number) => {
            dispatch(
              deleteMessage({
                messageId: msgId,
                deleteType,
              }),
            )
          })

          const broadcastQueryKey: QueryKey = [KEYS.GET_MESSAGES, broadcastId, 'broadcast']
          queryClient.setQueryData(broadcastQueryKey, (oldData: any) => {
            if (!oldData) return oldData

            const updateMessagesRecursive = (messages: any[]): any[] => {
              return messages
                .map((msg: any) => {
                  if (messageIds.includes(msg.id)) {
                    if (deleteType === 'delete-for-me') {
                      return null
                    } else {
                      return {
                        ...msg,
                        isDeleted: true,
                        isDeletedForEveryone: true,
                        content: '',
                        file_url: null,
                      }
                    }
                  }

                  if (msg.messages && Array.isArray(msg.messages)) {
                    const updatedMessages = updateMessagesRecursive(msg.messages).filter(Boolean)
                    return { ...msg, messages: updatedMessages }
                  }

                  if (msg.messageGroups && Array.isArray(msg.messageGroups)) {
                    const updatedGroups = msg.messageGroups.map((group: any) => {
                      if (group.messages && Array.isArray(group.messages)) {
                        const updatedGroupMessages = updateMessagesRecursive(group.messages).filter(Boolean)
                        return { ...group, messages: updatedGroupMessages }
                      }
                      return group
                    })
                    return { ...msg, messageGroups: updatedGroups }
                  }

                  return msg
                })
                .filter(Boolean)
            }

            if (oldData.pages) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  messages: Array.isArray(page.messages) ? updateMessagesRecursive(page.messages) : page.messages,
                })),
              }
            }

            if (Array.isArray(oldData.messages)) {
              const updatedMessages = updateMessagesRecursive(oldData.messages)
              return {
                ...oldData,
                messages: updatedMessages,
              }
            }

            return oldData
          })

          const state = Store.getState()
          const recentChats = state.chat.recentChats
          const broadcastChat = recentChats.find(
            (chat) => chat.chat_type === 'broadcast' && chat.chat_id === broadcastId,
          )

          if (broadcastChat && broadcastChat.lastMessage) {
            const lastMessageTime = broadcastChat.lastMessage.created_at
              ? new Date(broadcastChat.lastMessage.created_at).getTime()
              : 0

            const isLastMessageDeletedById = messageIds.includes(broadcastChat.lastMessage.id)

            const broadcastQueryKey: QueryKey = [KEYS.GET_MESSAGES, broadcastId, 'broadcast']
            const queryData = queryClient.getQueryData(broadcastQueryKey)

            const extractMessages = (data: any): any[] => {
              if (!data) return []
              const messages: any[] = []

              if (data.pages) {
                data.pages.forEach((page: any) => {
                  if (Array.isArray(page.messages)) {
                    page.messages.forEach((group: any) => {
                      if (group.messages && Array.isArray(group.messages)) {
                        messages.push(...group.messages)
                      } else if (group.id) {
                        messages.push(group)
                      }
                    })
                  }
                })
              } else if (Array.isArray(data.messages)) {
                data.messages.forEach((group: any) => {
                  if (group.messages && Array.isArray(group.messages)) {
                    messages.push(...group.messages)
                  } else if (group.id) {
                    messages.push(group)
                  }
                })
              }

              return messages
            }

            const allQueryMessages = extractMessages(queryData)
            const deletedMessagesInQuery = allQueryMessages.filter((msg: any) => messageIds.includes(msg.id))

            const selectedChatMessages = state.chat.selectedChatMessages
            const allSelectedMessages = selectedChatMessages.flatMap((section: any) => section.messages || [])
            const deletedMessagesInSelected = allSelectedMessages.filter((msg: Message) => messageIds.includes(msg.id))

            const allDeletedMessages = [...deletedMessagesInQuery, ...deletedMessagesInSelected]
            const isLastMessageDeletedByMatch = allDeletedMessages.some((msg: any) => {
              if (!broadcastChat.lastMessage.created_at || !msg.created_at) return false
              const msgTime = new Date(msg.created_at).getTime()
              const timeMatch = Math.abs(msgTime - lastMessageTime) < 5000
              const contentMatch =
                !broadcastChat.lastMessage.content ||
                msg.content === broadcastChat.lastMessage.content ||
                (broadcastChat.lastMessage.file_url && msg.file_url === broadcastChat.lastMessage.file_url)
              return timeMatch && (contentMatch || !broadcastChat.lastMessage.content)
            })

            // Also check if lastMessage has broadcast metadata matching the deleted broadcast
            const lastMessageMetadata =
              typeof broadcastChat.lastMessage.metadata === 'string'
                ? JSON.parse(broadcastChat.lastMessage.metadata || '{}')
                : broadcastChat.lastMessage.metadata || {}
            const isBroadcastMessage =
              lastMessageMetadata.is_broadcast &&
              lastMessageMetadata.broadcast_id === broadcastId &&
              broadcastChat.lastMessage.sender_id === deletedBy

            // Fallback: if lastMessage is from the same sender and broadcast, and timestamp is recent (within last 5 minutes), update it
            const now = Date.now()
            const isRecentMessage = lastMessageTime > 0 && now - lastMessageTime < 5 * 60 * 1000 // 5 minutes
            const isFromSameSenderAndBroadcast =
              broadcastChat.lastMessage.sender_id === deletedBy &&
              (isBroadcastMessage ||
                (lastMessageMetadata.is_broadcast && lastMessageMetadata.broadcast_id === broadcastId))

            // Update if any match found
            if (
              isLastMessageDeletedById ||
              isLastMessageDeletedByMatch ||
              isBroadcastMessage ||
              (isRecentMessage && isFromSameSenderAndBroadcast)
            ) {
              const isDeletedByCurrentUser = deletedBy === user?.id
              const deletedMessageText = isDeletedByCurrentUser
                ? 'You deleted this message'
                : 'This message was deleted'

              const deletedLastMessage = {
                ...broadcastChat.lastMessage,
                isDeleted: true,
                isDeletedForEveryone: deleteType === 'delete-for-everyone',
                content: deletedMessageText,
                file_url: null,
              }

              dispatch(
                updateLastMessage({
                  chatId: broadcastId,
                  chatType: 'broadcast',
                  lastMessage: deletedLastMessage,
                  chatMeta: {
                    name: broadcastChat.name,
                    avatar: broadcastChat.avatar,
                    isMuted: broadcastChat.isMuted ?? false,
                    isPinned: broadcastChat.isPinned ?? false,
                    pinned_at: broadcastChat.pinned_at ?? null,
                    status: broadcastChat.status,
                    unreadCount: 0,
                    is_unread_mentions: broadcastChat.is_unread_mentions ?? false,
                    is_verified: broadcastChat.is_verified ?? false,
                  },
                }),
              )
            }
          }

          if (deleteType === 'delete-for-everyone' && deletedBy && isBroadcast && broadcastId) {
            recentChats.forEach((directChat) => {
              if (directChat.chat_type !== 'direct' || !directChat.lastMessage) {
                return
              }

              const lastMessageTime = directChat.lastMessage.created_at
                ? new Date(directChat.lastMessage.created_at).getTime()
                : 0

              const isLastMessageDeletedById = messageIds.includes(directChat.lastMessage.id)

              // Check if lastMessage has broadcast metadata matching the deleted broadcast
              const lastMessageMetadata =
                typeof directChat.lastMessage.metadata === 'string'
                  ? JSON.parse(directChat.lastMessage.metadata || '{}')
                  : directChat.lastMessage.metadata || {}

              const isBroadcastMessage =
                lastMessageMetadata.is_broadcast &&
                lastMessageMetadata.broadcast_id === broadcastId &&
                directChat.lastMessage.sender_id === deletedBy

              const directChatQueryKey: QueryKey = [KEYS.GET_MESSAGES, directChat.chat_id, 'direct']
              const queryData = queryClient.getQueryData(directChatQueryKey)

              const extractMessages = (data: any): any[] => {
                if (!data) return []
                const messages: any[] = []

                if (data.pages) {
                  data.pages.forEach((page: any) => {
                    if (Array.isArray(page.messages)) {
                      page.messages.forEach((group: any) => {
                        if (group.messages && Array.isArray(group.messages)) {
                          messages.push(...group.messages)
                        } else if (group.id) {
                          messages.push(group)
                        }
                      })
                    }
                  })
                } else if (Array.isArray(data.messages)) {
                  data.messages.forEach((group: any) => {
                    if (group.messages && Array.isArray(group.messages)) {
                      messages.push(...group.messages)
                    } else if (group.id) {
                      messages.push(group)
                    }
                  })
                }

                return messages
              }

              const allQueryMessages = extractMessages(queryData)
              const deletedMessagesInQuery = allQueryMessages.filter((msg: any) => messageIds.includes(msg.id))

              const selectedChatMessages = state.chat.selectedChatMessages
              const allSelectedMessages = selectedChatMessages.flatMap((section: any) => section.messages || [])
              const deletedMessagesInSelected = allSelectedMessages.filter((msg: Message) =>
                messageIds.includes(msg.id),
              )

              const allDeletedMessages = [...deletedMessagesInQuery, ...deletedMessagesInSelected]

              const isLastMessageDeletedByMatch = allDeletedMessages.some((msg: any) => {
                if (!directChat.lastMessage.created_at || !msg.created_at) return false
                const msgTime = new Date(msg.created_at).getTime()
                const timeMatch = Math.abs(msgTime - lastMessageTime) < 5000 // 5 second tolerance

                const contentMatch =
                  (!directChat.lastMessage.content && !msg.content) ||
                  (directChat.lastMessage.content &&
                    msg.content &&
                    (msg.content === directChat.lastMessage.content ||
                      msg.content.includes(directChat.lastMessage.content) ||
                      directChat.lastMessage.content.includes(msg.content))) ||
                  (directChat.lastMessage.file_url && msg.file_url && msg.file_url === directChat.lastMessage.file_url)

                return timeMatch && (contentMatch || !directChat.lastMessage.content)
              })

              const now = Date.now()
              const isRecentMessage = lastMessageTime > 0 && now - lastMessageTime < 5 * 60 * 1000 // 5 minutes
              const isFromSameSenderAndBroadcast =
                directChat.lastMessage.sender_id === deletedBy &&
                (isBroadcastMessage ||
                  (lastMessageMetadata.is_broadcast && lastMessageMetadata.broadcast_id === broadcastId))

              if (
                isLastMessageDeletedById ||
                isLastMessageDeletedByMatch ||
                isBroadcastMessage ||
                (isRecentMessage && isFromSameSenderAndBroadcast)
              ) {
                const deletedLastMessage = {
                  ...directChat.lastMessage,
                  isDeleted: true,
                  isDeletedForEveryone: true,
                  content: 'This message was deleted',
                  file_url: null,
                }

                dispatch(
                  updateLastMessage({
                    chatId: directChat.chat_id,
                    chatType: 'direct',
                    lastMessage: deletedLastMessage,
                    chatMeta: {
                      name: directChat.name,
                      avatar: directChat.avatar,
                      isMuted: directChat.isMuted ?? false,
                      isPinned: directChat.isPinned ?? false,
                      pinned_at: directChat.pinned_at ?? null,
                      status: directChat.status,
                      unreadCount: directChat.unreadCount ?? 0,
                      is_unread_mentions: directChat.is_unread_mentions ?? false,
                      is_verified: directChat.is_verified ?? false,
                    },
                  }),
                )
              }
            })
          }
          return
        }
        messageIds.forEach((msgId: number | string) => {
          if (!msgId) return
          dispatch(
            deleteMessage({
              messageId: msgId as number, // Reducer will handle string conversion if needed based on my previous fix, or I should rely on loose comparison there. Casting to number for TS satisfaction if signature demands it, though runtime it's string.
              deleteType,
            }),
          )
        })

        if (data.wasUnread) {
          if (data.deletedMessage.group_id) {
            const groupId =
              typeof data.deletedMessage.group_id === 'string'
                ? data.deletedMessage.group_id
                : data.deletedMessage.group_id
            dispatch(decrementUnreadCount({ chatId: groupId, chatType: 'group' }))
            const currentState = Store.getState().chat
            const deletedMsg = currentState.selectedChatMessages
              .flatMap((section: any) => section.messages || [])
              .find((msg: Message) => msg.id == data.messageId)
            if (deletedMsg?.mentions?.includes(user?.id)) {
              dispatch(updateMentionStatus({ chatId: groupId, chatType: 'group', hasMentions: false }))
            }
          } else if (data.deletedMessage.recipient_id || data.deletedMessage.sender_id) {
            const otherUserId =
              data.deletedMessage.sender_id == user?.id
                ? data.deletedMessage.recipient_id
                : data.deletedMessage.sender_id

            if (otherUserId) {
              dispatch(decrementUnreadCount({ chatId: otherUserId, chatType: 'direct' }))
            }
          }
        }

        let queryKey: QueryKey | null = null

        if (data.deletedMessage.group_id) {
          const groupId =
            typeof data.deletedMessage.group_id == 'string'
              ? data.deletedMessage.group_id
              : data.deletedMessage.group_id
          queryKey = [KEYS.GET_MESSAGES, groupId, 'group']
        } else if (data.deletedMessage.recipient_id || data.deletedMessage.sender_id) {
          const otherUserId =
            data.deletedMessage.sender_id == user?.id ? data.deletedMessage.recipient_id : data.deletedMessage.sender_id

          if (otherUserId) {
            queryKey = [KEYS.GET_MESSAGES, otherUserId, 'direct']
          }
        }

        if (queryKey) {
          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (!oldData) return oldData

            const deleteType = (data as any).deleteType || 'delete-for-everyone'

            const updateMessagesRecursive = (messages: any[]): any[] => {
              return messages
                .map((msg: any) => {
                  // Check if msg.id matches any of the IDs in messageIds (using loose comparison)
                  if (messageIds.some((id: any) => String(id) === String(msg.id))) {
                    if (deleteType === 'delete-for-me') {
                      return null
                    } else {
                      return {
                        ...msg,
                        isDeleted: true,
                        isDeletedForEveryone: true,
                        content: '',
                        file_url: null,
                      }
                    }
                  }

                  if (msg.messages && Array.isArray(msg.messages)) {
                    const updatedMessages = updateMessagesRecursive(msg.messages).filter(Boolean)
                    return { ...msg, messages: updatedMessages }
                  }

                  if (msg.messageGroups && Array.isArray(msg.messageGroups)) {
                    const updatedGroups = msg.messageGroups.map((group: any) => {
                      if (group.messages && Array.isArray(group.messages)) {
                        const updatedGroupMessages = updateMessagesRecursive(group.messages).filter(Boolean)
                        return { ...group, messages: updatedGroupMessages }
                      }
                      return group
                    })
                    return { ...msg, messageGroups: updatedGroups }
                  }

                  return msg
                })
                .filter(Boolean)
            }

            if (oldData.pages) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  messages: Array.isArray(page.messages) ? updateMessagesRecursive(page.messages) : page.messages,
                })),
              }
            }

            if (Array.isArray(oldData.messages)) {
              const updatedMessages = updateMessagesRecursive(oldData.messages)
              return {
                ...oldData,
                messages: updatedMessages,
              }
            }

            queryClient.invalidateQueries({ queryKey })
            return oldData
          })
        } else {
          queryClient.invalidateQueries({
            queryKey: [KEYS.GET_MESSAGES],
            exact: false,
          })
        }

        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
      }

      const handlePinUnpinChat = (data: any) => {
        const rawPinned = data.pin ?? data.pinned ?? data.isPinned ?? data.is_pinned
        const normalizedPinned =
          typeof rawPinned === 'string'
            ? rawPinned === 'true' || rawPinned === '1'
            : rawPinned !== undefined
            ? Boolean(rawPinned)
            : false
        const pinnedAt = data.pinned_at ?? data.pinnedAt ?? null

        dispatch(
          togglePinChat({
            id: data.targetId,
            type: data.type,
            pinned: normalizedPinned,
            pinned_at: pinnedAt,
          }),
        )
      }

      const handleArchiveUpdated = (data: { targetId: number; type: 'direct' | 'group'; isArchived: boolean }) => {
        dispatch(
          toggleArchiveChat({
            chatId: data.targetId,
            chatType: data.type,
            isArchived: data.isArchived,
          }),
        )
      }

      const handleMessageFavorite = (data: {
        messageId: number | string | (number | string)[]
        isStarred: boolean
      }) => {
        const ids = Array.isArray(data.messageId) ? data.messageId : [data.messageId]
        dispatch(
          updateMessageStarred({
            messageIds: ids,
            isStarred: Boolean(data.isStarred),
          }),
        )

        const state = Store.getState()
        const selectedUserProfile = state.chat.selectedUserProfile
        const selectedChatMessages = state.chat.selectedChatMessages

        if (selectedUserProfile) {
          const messagesToUpdate: Message[] = []
          selectedChatMessages.forEach((section: any) => {
            if (section.messages && Array.isArray(section.messages)) {
              section.messages.forEach((msg: Message) => {
                if (ids.includes(msg.id)) {
                  messagesToUpdate.push(msg)
                }
              })
            }
          })

          let updatedStarredMessages = [...(selectedUserProfile.starred_messages || [])]

          messagesToUpdate.forEach((message) => {
            if (data.isStarred) {
              const exists = updatedStarredMessages.some((sm) => sm.id === message.id || sm.message_id === message.id)
              if (!exists && message.sender) {
                updatedStarredMessages.push({
                  id: message.id,
                  message_id: message.id,
                  content: message.content || '',
                  date: message.created_at || new Date().toISOString(),
                  sender: {
                    id: message.sender.id || message.sender_id,
                    name: message.sender.name || '',
                    avatar: message.sender.avatar || '',
                  },
                })
              }
            } else {
              updatedStarredMessages = updatedStarredMessages.filter(
                (sm) => sm.id !== message.id && sm.message_id !== message.id,
              )
            }
          })

          dispatch(
            selSelectedUserProfile({
              ...selectedUserProfile,
              starred_messages: updatedStarredMessages,
            }),
          )
        }
      }

      const handleMessagePin = (data: { message_id: number | number[]; isPinned: boolean }) => {
        const id = data.message_id
        dispatch(
          updateMessagePin({
            messageIds: id,
            isPinned: Boolean(data.isPinned),
          }),
        )
      }

      const handleChatMuted = (data: { userId: number; targetId: number; targetType: string }) => {
        const state = Store.getState()
        const currentUserId = state.auth.user?.id

        if (currentUserId && data.userId === currentUserId) {
          const chatType = data.targetType === 'group' ? 'group' : 'direct'
          dispatch(
            toggleMuteChat({
              chatId: data.targetId,
              chatType,
              isMuted: true,
            }),
          )
        }
      }

      const handleChatUnmuted = (data: { userId: number; targetId: number; targetType: string }) => {
        const state = Store.getState()
        const currentUserId = state.auth.user?.id

        if (currentUserId && data.userId === currentUserId) {
          const chatType = data.targetType === 'group' ? 'group' : 'direct'
          dispatch(
            toggleMuteChat({
              chatId: data.targetId,
              chatType,
              isMuted: false,
            }),
          )
        }
      }

      socket.on(SOCKET.Listeners.Bulk_Status_Update, handleBulkUserStatusUpdate)
      socket.on(SOCKET.Listeners.User_Status_Update, handleUserStatusUpdate)
      socket.on(SOCKET.Listeners.Status_Uploaded, handleStatusUploaded)
      socket.on(SOCKET.Listeners.Status_Deleted, handleStatusDeleted)
      socket.on(SOCKET.Listeners.Status_Viewed, handleStatusViewed)

      socket.on(SOCKET.Listeners.Receive_Message, (data) => {
        handleReceiveMessage(data)

        const state = Store.getState()
        const authenticatedUserId = state.auth.user?.id
        const selectedChat = state.chat.selectedUser

        let isCurrentChat = false

        let messageMetadata = data.metadata
        if (typeof messageMetadata === 'string') {
          try {
            messageMetadata = JSON.parse(messageMetadata)
          } catch (e) {
            messageMetadata = {}
          }
        }

        if (data.group_id) {
          isCurrentChat =
            selectedChat?.chat_type === 'group' &&
            (String(selectedChat?.chat_id) === String(data.group_id) ||
              String(selectedChat?.id) === String(data.group_id))
        } else if (messageMetadata?.is_broadcast && messageMetadata?.broadcast_id) {
          const broadcastId = messageMetadata.broadcast_id
          const isMergedMessage = Array.isArray(data.recipients) && data.recipients.length > 0
          const isSenderReceivingIndividualMessage =
            data.sender_id === authenticatedUserId && data.recipient_id && !isMergedMessage

          if (isSenderReceivingIndividualMessage) {
            isCurrentChat = false
          } else {
            const isBroadcastChat =
              (selectedChat?.isBroadcast || selectedChat?.chat_type === 'broadcast') &&
              (String(selectedChat?.chat_id) === String(broadcastId) ||
                String(selectedChat?.id) === String(broadcastId))

            const otherUserId = data.sender_id === authenticatedUserId ? data.recipient_id : data.sender_id
            const isDirectChat =
              selectedChat?.chat_type === 'direct' &&
              otherUserId &&
              (selectedChat?.chat_id == otherUserId || selectedChat?.id == otherUserId)

            isCurrentChat = isBroadcastChat || isDirectChat
          }
        } else {
          const otherUserId = data.sender_id === authenticatedUserId ? data.recipient_id : data.sender_id
          isCurrentChat =
            selectedChat?.chat_type === 'direct' &&
            otherUserId &&
            (selectedChat?.chat_id == otherUserId || selectedChat?.id == otherUserId)
        }

        if (isCurrentChat) {
          dispatch(
            addOrUpdateMessage({
              message: data,
              currentUserId: user?.id,
            }),
          )
        }
      })
      socket.on(SOCKET.Listeners.Message_Updated, handleMessageUpdated)
      socket.on(SOCKET.Listeners.Message_Reaction_Updated, handleMessageReactionUpdated)
      socket.on(SOCKET.Listeners.Message_Favorite, handleMessageFavorite)
      socket.on(SOCKET.Listeners.Message_Pin, handleMessagePin)
      socket.on(SOCKET.Listeners.Message_Status_Updated, handleMessageStatusUpdated)
      socket.on(SOCKET.Listeners.Message_Deleted, handleMessageDeleted)

      const handleAnnouncementDelete = (data: { id: string[] | number[] }) => {
        const messageIds = Array.isArray(data.id) ? data.id : [data.id]
        messageIds.forEach((msgId: string | number) => {
          dispatch(
            deleteMessage({
              messageId: msgId,
              deleteType: 'delete-for-everyone',
            }),
          )
        })

        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })

        const state = Store.getState()
        const selectedChat = state.chat.selectedUser

        if (selectedChat?.isAnnouncement) {
          dispatch(setSelectedChatMessages([]))
          dispatch(setSelectedUser(null))
          dispatch(selectChat(null))
          queryClient.invalidateQueries({
            queryKey: [KEYS.GET_MESSAGES, selectedChat.chat_id, 'direct'],
          })
        }
      }
      socket.on(SOCKET.Listeners.Announcement_Delete, handleAnnouncementDelete)

      const handleGroupMemberAdded = (data: {
        groupId: number
        addedBy: number
        addedMembers: number[]
        group: any
      }) => {
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_MEMBERS, data.groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, data.groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
      }

      // Handle group member removed
      const handleGroupMemberRemoved = (data: { groupId: number; userId: number }) => {
        const state = Store.getState()
        const currentUser = state.chat.currentUser
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_MEMBERS, data.groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, data.groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
        queryClient.invalidateQueries({ queryKey: [KEYS.USER_GROUPS] })
        if (currentUser?.id == data.userId) {
          dispatch(setSelectedUser(null))
        }
      }

      // Handle member left group
      const handleMemberLeftGroup = (data: { groupId: number; userId: number }) => {
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_MEMBERS, data.groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, data.groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
        queryClient.invalidateQueries({ queryKey: [KEYS.USER_GROUPS] })
      }

      const handleGroupLeft = (data: { groupId: number; userId: number }) => {
        const state = Store.getState()
        const authenticatedUserId = state.auth.user?.id
        if (!authenticatedUserId || data.userId !== authenticatedUserId) return

        queryClient.setQueriesData({ queryKey: [KEYS.GROUP_MEMBERS, data.groupId] }, (oldData: any) => {
          if (!oldData?.members) return oldData
          return {
            ...oldData,
            members: oldData.members.filter((m: any) => m.id !== authenticatedUserId),
          }
        })

        queryClient.setQueryData([KEYS.GROUP_INFO, data.groupId], (oldData: any) => {
          if (!oldData?.group) return oldData
          return {
            ...oldData,
            group: {
              ...oldData.group,
              myRole: null,
            },
          }
        })

        queryClient.invalidateQueries({ queryKey: [KEYS.FAVORITES] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_MEMBERS, data.groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, data.groupId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.USER_GROUPS] })
        queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
      }

      const handleMemberRoleUpdated = (data: { groupId: number; userId: number; newRole: string }) => {
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_MEMBERS, data.groupId] })
      }

      // Handle block/unblock status updates (sent to blocker)
      const handleBlockStatusUpdated = (data: {
        blockType: 'group' | 'user'
        targetId: number
        action: 'block' | 'unblock'
      }) => {
        // Only update if this affects current selection or recent list
        const state = Store.getState()
        const selectedChat = state.chat.selectedUser
        const isGroup = data.blockType === 'group'

        // Update selected chat
        if (
          selectedChat &&
          ((isGroup && selectedChat.chat_type === 'group' && selectedChat.chat_id === data.targetId) ||
            (!isGroup && selectedChat.chat_type !== 'group' && selectedChat.chat_id === data.targetId))
        ) {
          dispatch(setSelectedUser({ ...selectedChat, isBlocked: data.action === 'block' }))
        }

        // Update recent chats store
        dispatch(
          setRecentChatBlockedStatus({
            chatId: data.targetId,
            isBlocked: data.action === 'block',
          }),
        )

        // Invalidate relevant queries to keep in sync
        if (isGroup) {
          queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, data.targetId] })
          queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES, 'group', data.targetId] })
        } else {
          queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES, 'direct', data.targetId] })
        }
      }

      const handleGroupSettingsUpdated = (data: { groupId: number; settings: any }) => {
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, data.groupId] })
      }

      const handleGroupDeleted = (data: { id: number; name: string }) => {
        const state = Store.getState()
        const selectedChat = state.chat.selectedUser

        if (selectedChat?.chat_type === 'group' && selectedChat?.chat_id === data.id) {
          dispatch(setSelectedUser(null))
        }

        const currentChats = state.chat.recentChats
        const updatedChats = currentChats.filter((chat) => !(chat.chat_type === 'group' && chat.chat_id === data.id))
        dispatch(setRecentChats(updatedChats))

        queryClient.setQueryData([KEYS.RECENT_CHATS, 1, 20], (oldData: any) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            chats:
              oldData.chats?.filter((chat: any) => !(chat.chat_type === 'group' && chat.chat_id === data.id)) || [],
          }
        })

        queryClient.invalidateQueries({ queryKey: [KEYS.USER_GROUPS] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_INFO, data.id] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GROUP_MEMBERS, data.id] })

        if (selectedChat?.chat_type === 'group' && selectedChat?.chat_id === data.id) {
          queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES] })
        }
      }

      socket.on(SOCKET.Listeners.Chat_Pin_Updated, handlePinUnpinChat)
      socket.on(SOCKET.Listeners.Chat_Archive_Updated, handleArchiveUpdated)
      socket.on(SOCKET.Listeners.Chat_Muted, handleChatMuted)
      socket.on(SOCKET.Listeners.Chat_Unmuted, handleChatUnmuted)
      const handleNewGroup = (groupData: any) => {
        if (!groupData?.id || !groupData?.name) return

        const state = Store.getState()
        const existingChat = state.chat.recentChats.find(
          (chat) => chat.chat_id === groupData.id && chat.chat_type === 'group',
        )

        if (existingChat) {
          dispatch(
            updateChatMetadata({
              chatId: groupData.id,
              chatType: 'group',
              metadata: {
                name: groupData.name,
                avatar: groupData.avatar || null,
              },
            }),
          )
        } else {
          queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
        }

        queryClient.invalidateQueries({ queryKey: [KEYS.USER_GROUPS] })
      }

      const handleAccountDeactivation = (data) => {
        if (user.id == data?.id) {
          queryClient.clear()
          Store.dispatch(resetChatState())
          Store.dispatch(logout())
        }
      }

      socket.on(SOCKET.Listeners.Group_Member_Added, handleGroupMemberAdded)
      socket.on(SOCKET.Listeners.Group_Member_Removed, handleGroupMemberRemoved)
      socket.on(SOCKET.Listeners.Member_Left_Group, handleMemberLeftGroup)
      socket.on(SOCKET.Listeners.Group_Left, handleGroupLeft)
      socket.on(SOCKET.Listeners.Block_Status_Updated, handleBlockStatusUpdated)
      socket.on(SOCKET.Listeners.Member_Role_Updated, handleMemberRoleUpdated)
      socket.on(SOCKET.Listeners.Group_Settings_Updated, handleGroupSettingsUpdated)
      socket.on(SOCKET.Listeners.Group_Deleted, handleGroupDeleted)
      socket.on(SOCKET.Listeners.New_Group, handleNewGroup)
      socket.on(SOCKET.Listeners.Admin_Banned_User, handleAccountDeactivation)

      const handleBroadcastRecipientsAdded = (data: {
        broadcast_id: number
        added_count: number
        recipients: Array<{ id: number; name: string; avatar?: string }>
      }) => {
        const state = Store.getState()
        const selectedUser = state.chat.selectedUser

        if (
          selectedUser &&
          (selectedUser.isBroadcast || selectedUser.chat_type === 'broadcast') &&
          (selectedUser.chat_id === data.broadcast_id || selectedUser.id === data.broadcast_id)
        ) {
          dispatch(
            setSelectedUser({
              ...selectedUser,
              recipients: data.recipients,
            }),
          )
        }
      }

      const handleBroadcastRecipientsRemoved = (data: {
        broadcast_id: number
        removed_count: number
        recipients: Array<{ id: number; name: string; avatar?: string }>
      }) => {
        const state = Store.getState()
        const selectedUser = state.chat.selectedUser

        if (
          selectedUser &&
          (selectedUser.isBroadcast || selectedUser.chat_type === 'broadcast') &&
          (selectedUser.chat_id === data.broadcast_id || selectedUser.id === data.broadcast_id)
        ) {
          dispatch(
            setSelectedUser({
              ...selectedUser,
              recipients: data.recipients,
            }),
          )
        }
      }

      socket.on(SOCKET.Listeners.Broadcast_Recipients_Added, handleBroadcastRecipientsAdded)
      socket.on(SOCKET.Listeners.Broadcast_Recipients_Removed, handleBroadcastRecipientsRemoved)

      const handleMessagesRead = (data: {
        readerId?: number | string
        groupId?: number | string
        chatId?: number | string
        chatType?: 'direct' | 'group'
      }) => {
        const state = Store.getState()
        const currentUserId = state.auth.user?.id

        if (!currentUserId) return

        if (data.chatId && data.chatType) {
          dispatch(resetUnreadCount({ chatId: data.chatId, chatType: data.chatType }))
          return
        }

        if (data.groupId) {
          dispatch(resetUnreadCount({ chatId: data.groupId, chatType: 'group' }))
        } else if (data.readerId) {
          dispatch(resetUnreadCount({ chatId: data.readerId, chatType: 'direct' }))
        }
      }
      socket.on(SOCKET.Listeners.Messages_Read, handleMessagesRead)

      const handleChatsDeletedAll = (data: { userId: number; deletedCount: number }) => {
        if (data.userId === user?.id) {
          queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
        }
      }
      socket.on(SOCKET.Listeners.Chats_Deleted_All, handleChatsDeletedAll)

      const handleChatsClearedAll = (data: { userId: number; clearedCount: number }) => {
        if (data.userId === user?.id) {
          const state = Store.getState()
          const updatedChats = state.chat.recentChats.map((chat) => ({
            ...chat,
            lastMessage: null,
            latest_message_at: null,
          }))
          dispatch(setRecentChats(updatedChats))
          dispatch(setSelectedChatMessages([]))
          queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
        }
      }
      socket.on(SOCKET.Listeners.Chats_Cleared_All, handleChatsClearedAll)

      const handleChatCleared = (data: {
        userId: number | string
        recipientId: number | null
        groupId: number | null
        broadcastId: number | null
      }) => {
        if (String(data.userId) === String(user?.id)) {
          const state = Store.getState()
          const selectedUser = state.chat.selectedUser

          if (selectedUser) {
            const isDirectMatch =
              data.recipientId && selectedUser.chat_type === 'direct' && selectedUser.chat_id === data.recipientId
            const isGroupMatch =
              data.groupId && selectedUser.chat_type === 'group' && selectedUser.chat_id === data.groupId
            const isBroadcastMatch =
              data.broadcastId &&
              (selectedUser.chat_type === 'broadcast' || selectedUser.isBroadcast) &&
              selectedUser.chat_id === data.broadcastId

            if (isDirectMatch || isGroupMatch || isBroadcastMatch) {
              dispatch(setSelectedChatMessages([]))
            }
          }

          const updatedChats = state.chat.recentChats.map((chat) => {
            const isDirectMatch = data.recipientId && chat.chat_type === 'direct' && chat.chat_id === data.recipientId
            const isGroupMatch = data.groupId && chat.chat_type === 'group' && chat.chat_id === data.groupId
            const isBroadcastMatch =
              data.broadcastId &&
              (chat.chat_type === 'broadcast' || (chat as any).isBroadcast) &&
              chat.chat_id === data.broadcastId

            if (isDirectMatch || isGroupMatch || isBroadcastMatch) {
              return {
                ...chat,
                lastMessage: null,
                latest_message_at: null,
              }
            }
            return chat
          })
          dispatch(setRecentChats(updatedChats))

          queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES] })
        }
      }
      socket.on(SOCKET.Listeners.Chat_Cleared, handleChatCleared)

      const handleNewNotification = (notificationData: any) => {
        // Invalidate notifications query to refetch and show new notification
        queryClient.invalidateQueries({ queryKey: [KEYS.NOTIFICATIONS] })

        // If it's a friend request notification, also invalidate pending friend requests
        if (notificationData.type === 'friend_request') {
          queryClient.invalidateQueries({ queryKey: [KEYS.PENDING_FRIEND_REQUESTS] })
        }

        // Show browser notification if window is not focused or user is not viewing notifications
        const windowHidden = typeof document !== 'undefined' ? document.hidden : false
        if (windowHidden || !document.hasFocus()) {
          const state = Store.getState()
          const recentChats = state.chat.recentChats
          const totalUnreadCount = recentChats.reduce((total, chat) => {
            return total + (chat.unreadCount || 0)
          }, 0)

          NotificationService.notifyMessage({
            title: notificationData.title || 'New Notification',
            body: notificationData.message || '',
            tag: `notification-${notificationData.id}`,
            userName: notificationData.title || 'New Notification',
            messagePreview: notificationData.message || '',
            unreadCount: totalUnreadCount,
            highlightLabel: notificationData.title || 'New Notification',
            forceNotification: true,
          }).catch((error) => {
            console.warn('Failed to display notification:', error)
          })
        }
      }
      socket.on(SOCKET.Listeners.New_Notification, handleNewNotification)

      const handleUserSettingsUpdated = (data: { userId: number; settings: any }) => {
        const state = Store.getState()
        const currentUserId = state.auth.user?.id
        const selectedUserProfile = state.chat.selectedUserProfile
        const selectedChat = state.chat.selectedUser
        const recentChats = state.chat.recentChats

        // If it's the current user's own settings update, update the user settings in Redux
        if (currentUserId && data.userId === currentUserId) {
          dispatch(setUserSetting(data.settings))
        }

        // Invalidate profile query for the user whose settings changed
        // The backend will return bio as null if display_bio is false
        queryClient.invalidateQueries({ queryKey: [KEYS.PROFILE_INFO, data.userId] })

        // If we're currently viewing this user's profile, refetch and update it immediately
        if (selectedUserProfile && selectedUserProfile.id === data.userId) {
          queryClient.refetchQueries({ queryKey: [KEYS.PROFILE_INFO, data.userId] }).then(() => {
            // Get the updated profile data from the cache after refetch
            const updatedProfile = queryClient.getQueryData<SelectedUserProfile>([KEYS.PROFILE_INFO, data.userId])
            if (updatedProfile) {
              dispatch(selSelectedUserProfile(updatedProfile))
            }
          })
        }

        // Invalidate contact list queries as privacy settings may affect what's shown
        queryClient.invalidateQueries({ queryKey: [KEYS.GET_CHAT] })
        queryClient.invalidateQueries({ queryKey: [KEYS.SEARCH_CONTACT] })
        queryClient.invalidateQueries({ queryKey: [KEYS.ALL_USER_SETTINGS] })

        // Helper function to normalize chat type for locked_chat_ids matching
        const getNormalizedType = (chat: any) => {
          if (chat.isAnnouncement) return 'announcement'
          if (chat.chat_type === 'direct') return 'user'
          return chat.chat_type
        }

        // Only update selectedUser if a chat is currently selected
        if (selectedChat) {
          dispatch(
            setSelectedUser({
              ...selectedChat,
              isLocked: !!data.settings.locked_chat_ids.find(
                (locked) => locked.id === selectedChat?.chat_id && locked.type === getNormalizedType(selectedChat),
              ),
            }),
          )
        }
        dispatch(
          setRecentChats([
            ...recentChats.map((item) => {
              const normalizedType = getNormalizedType(item)
              return {
                ...item,
                isLocked: !!data.settings.locked_chat_ids.find(
                  (locked) => locked.id === item?.chat_id && locked.type === normalizedType,
                ),
              }
            }),
          ]),
        )
      }
      socket.on(SOCKET.Listeners.User_Settings_Updated, handleUserSettingsUpdated)

      const handleChatSettingUpdated = (data: {
        chatId: number | string
        chatType: 'direct' | 'group'
        disappearing: {
          enabled: boolean
          duration: string | null
          expire_after_seconds: number | null
        }
      }) => {
        const state = Store.getState()
        const selectedChat = state.chat.selectedUser

        if (!selectedChat) {
          return
        }

        const selectedChatId = String(selectedChat.chat_id || selectedChat.id || '')
        const updateChatId = String(data.chatId || '')

        const isCurrentChat = data.chatType === selectedChat.chat_type && selectedChatId === updateChatId

        if (isCurrentChat) {
          const updatedSelectedUser = {
            ...selectedChat,
            disappearing: {
              enabled: data.disappearing.enabled,
              duration: data.disappearing.duration || null,
              expire_after_seconds: data.disappearing.expire_after_seconds || null,
            },
          }

          dispatch(setSelectedUser(updatedSelectedUser))
        }

        // Also update recent chats if this chat is in the list
        const recentChats = state.chat.recentChats
        const updatedRecentChats = recentChats.map((chat) => {
          const isMatchingChat =
            (data.chatType === 'direct' &&
              chat.chat_type === 'direct' &&
              String(chat.chat_id) === String(data.chatId)) ||
            (data.chatType === 'group' && chat.chat_type === 'group' && String(chat.chat_id) === String(data.chatId))

          if (isMatchingChat) {
            return {
              ...chat,
              disappearing: {
                enabled: data.disappearing.enabled,
                duration: data.disappearing.duration || null,
                expire_after_seconds: data.disappearing.expire_after_seconds || null,
              },
            }
          }
          return chat
        })

        dispatch(setRecentChats(updatedRecentChats))
      }
      socket.on(SOCKET.Listeners.Chat_Settings_Updated, handleChatSettingUpdated)

      const handleFriendUserSettingsUpdated = (data: { userId: number; settings: any; profile?: any }) => {
        const state = Store.getState()
        const currentUserId = state.auth.user?.id
        const selectedUserProfile = state.chat.selectedUserProfile
        const selectedUser = state.chat.selectedUser
        const recentChats = state.chat.recentChats

        // Don't handle if it's the current user's own settings
        if (currentUserId && data.userId === currentUserId) {
          return
        }

        // Update selectedUserProfile if we're viewing this friend's profile
        if (selectedUserProfile && String(selectedUserProfile.id) === String(data.userId)) {
          const updatedProfile: SelectedUserProfile = {
            ...selectedUserProfile,
            userSetting: data.settings,
            user_setting: data.settings,
            // Update bio/avatar/phone based on settings
            bio: data.settings?.display_bio === false ? '' : data.profile?.bio ?? selectedUserProfile.bio ?? '',
            avatar:
              data.settings?.profile_pic === false ? '' : data.profile?.avatar ?? selectedUserProfile.avatar ?? '',
            phone: data.settings?.hide_phone === true ? '' : data.profile?.phone ?? selectedUserProfile.phone ?? '',
          }
          dispatch(selSelectedUserProfile(updatedProfile))
        }

        // Update selectedUser if we're currently chatting with this friend
        if (selectedUser && selectedUser.chat_type === 'direct') {
          const friendId = selectedUser.chat_id || selectedUser.id
          if (String(friendId) === String(data.userId)) {
            const updatedSelectedUser = {
              ...selectedUser,
              // Update avatar if profile_pic setting changed
              avatar: data.settings?.profile_pic === false ? '' : data.profile?.avatar ?? selectedUser.avatar ?? '',
              thumb: data.settings?.profile_pic === false ? '' : data.profile?.avatar ?? selectedUser.thumb ?? '',
            }
            dispatch(setSelectedUser(updatedSelectedUser))
          }
        }

        // Update recentChats with friend's updated settings
        const updatedRecentChats = recentChats.map((chat) => {
          if (chat.chat_type === 'direct') {
            const chatFriendId = chat.chat_id || chat.id
            if (String(chatFriendId) === String(data.userId)) {
              return {
                ...chat,
                // Update avatar if profile_pic setting changed
                avatar: data.settings?.profile_pic === false ? '' : data.profile?.avatar ?? chat.avatar ?? '',
                thumb: data.settings?.profile_pic === false ? '' : data.profile?.avatar ?? chat.thumb ?? '',
              }
            }
          }
          return chat
        })

        // Only dispatch if there were actual changes
        const hasChanges = updatedRecentChats.some((chat, index) => {
          const originalChat = recentChats[index]
          return (
            chat.avatar !== originalChat?.avatar ||
            chat.thumb !== originalChat?.thumb ||
            JSON.stringify(chat) !== JSON.stringify(originalChat)
          )
        })

        if (hasChanges) {
          dispatch(setRecentChats(updatedRecentChats))
        }

        // Invalidate queries to refetch friend's profile data (backend will respect settings)
        queryClient.invalidateQueries({ queryKey: [KEYS.PROFILE_INFO, data.userId] })
        queryClient.invalidateQueries({ queryKey: [KEYS.GET_CHAT] })
      }
      socket.on(SOCKET.Listeners.Friend_User_Settings_Updated, handleFriendUserSettingsUpdated)

      const handleAdminSettingsUpdated = (data: any) => {
        dispatch(setSetting({ settings: data }))
      }
      socket.on(SOCKET.Listeners.Admin_Settings_Updated, handleAdminSettingsUpdated)

      sendStatusHeartbeat()

      const handleVisibilityChange = () => {
        if (typeof document !== 'undefined' && !document.hidden) {
          sendStatusHeartbeat()
        }
      }

      const handleWindowFocus = () => {
        sendStatusHeartbeat()
      }

      const handleOnline = () => {
        sendStatusHeartbeat()
      }

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange)
      }
      if (typeof window !== 'undefined') {
        window.addEventListener('focus', handleWindowFocus)
        window.addEventListener('online', handleOnline)
      }

      heartbeatInterval = setInterval(() => {
        sendStatusHeartbeat()
      }, CHAT_CONSTANTS.USER_STATUS_HEARTBEAT)

      // Cleanup function
      return () => {
        socket.off(SOCKET.Listeners.Chat_Pin_Updated, handlePinUnpinChat)
        socket.off(SOCKET.Listeners.Chat_Archive_Updated, handleArchiveUpdated)
        socket.off(SOCKET.Listeners.Chat_Muted, handleChatMuted)
        socket.off(SOCKET.Listeners.Chat_Unmuted, handleChatUnmuted)
        socket.off(SOCKET.Listeners.Chat_Cleared, handleChatCleared)
        socket.off(SOCKET.Listeners.Chats_Deleted_All, handleChatsDeletedAll)
        socket.off(SOCKET.Listeners.Chats_Cleared_All, handleChatsClearedAll)
        socket.off(SOCKET.Listeners.Bulk_Status_Update, handleBulkUserStatusUpdate)
        socket.off(SOCKET.Listeners.User_Status_Update, handleUserStatusUpdate)
        socket.off(SOCKET.Listeners.Receive_Message, handleReceiveMessage)
        socket.off(SOCKET.Listeners.Message_Updated, handleMessageUpdated)
        socket.off(SOCKET.Listeners.Message_Reaction_Updated, handleMessageReactionUpdated)
        socket.off(SOCKET.Listeners.Message_Favorite, handleMessageFavorite)
        socket.off(SOCKET.Listeners.Message_Pin, handleMessagePin)
        socket.off(SOCKET.Listeners.Message_Status_Updated, handleMessageStatusUpdated)
        socket.off(SOCKET.Listeners.Message_Deleted, handleMessageDeleted)
        socket.off(SOCKET.Listeners.Group_Member_Added, handleGroupMemberAdded)
        socket.off(SOCKET.Listeners.Group_Member_Removed, handleGroupMemberRemoved)
        socket.off(SOCKET.Listeners.Member_Left_Group, handleMemberLeftGroup)
        socket.off(SOCKET.Listeners.Group_Left, handleGroupLeft)
        socket.off(SOCKET.Listeners.Block_Status_Updated, handleBlockStatusUpdated)
        socket.off(SOCKET.Listeners.Member_Role_Updated, handleMemberRoleUpdated)
        socket.off(SOCKET.Listeners.Group_Settings_Updated, handleGroupSettingsUpdated)
        socket.off(SOCKET.Listeners.Status_Uploaded, handleStatusUploaded)
        socket.off(SOCKET.Listeners.Status_Deleted, handleStatusDeleted)
        socket.off(SOCKET.Listeners.Status_Viewed, handleStatusViewed)
        socket.off(SOCKET.Listeners.New_Notification, handleNewNotification)
        socket.off(SOCKET.Listeners.User_Settings_Updated, handleUserSettingsUpdated)
        socket.off(SOCKET.Listeners.Friend_User_Settings_Updated, handleFriendUserSettingsUpdated)
        socket.off(SOCKET.Listeners.Admin_Settings_Updated, handleAdminSettingsUpdated)
        socket.off(SOCKET.Listeners.Chat_Settings_Updated, handleChatSettingUpdated)
        socket.off(SOCKET.Listeners.Announcement_Delete, handleAnnouncementDelete)
        socket.off(SOCKET.Listeners.Admin_Banned_User, handleAccountDeactivation)
        socket.off(SOCKET.Listeners.Messages_Read, handleMessagesRead)

        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
        }
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
        if (typeof window !== 'undefined') {
          window.removeEventListener('focus', handleWindowFocus)
          window.removeEventListener('online', handleOnline)
        }
      }
    }
  }, [user, user?.id, token, dispatch, queryClient])
}
