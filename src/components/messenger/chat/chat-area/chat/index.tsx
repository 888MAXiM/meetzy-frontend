import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap'
import { mutations } from '../../../../../api'
import { ImagePath } from '../../../../../constants'
import { KEYS } from '../../../../../constants/keys'
import ScrollToBottomButton from '../../../../../pages/TapTop'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import {
  addOrUpdateMessage,
  resetUnreadCount,
  setEditMessage,
  setHighlightedMessageId,
  setReplyMessage,
  setSelectedChatMessages,
  updateMessageStatus,
} from '../../../../../redux/reducers/messenger/chatSlice'
import { setMobileMenu } from '../../../../../redux/reducers/messenger/messengerSlice'
import { socket } from '../../../../../services/socket-setup'
import DeleteMessageModal from '../../../../../shared/DeleteMessageModal'
import { SvgIcon } from '../../../../../shared/icons'
import { Image } from '../../../../../shared/image'
import ChatAvatar from '../../../../../shared/image/ChatAvatar'
import type { GetGroupMembersResponse, Message, Status } from '../../../../../types/api'
import { formatTime, isSingleEmoji, getMetadata } from '../../../../../utils'
import { mergeAndGroupMessages, mergeMessagesFromPages } from '../../../../../utils/custom-functions/dateLabel'
import {
  getConsecutiveSystemMessages,
  isFirstInSystemMessageGroup,
} from '../../../../../utils/custom-functions/useMessage'
import { scrollToMessage } from '../../../../../utils/UseScrollMessage'
import TypingIndicator from '../message-input/TypingIndicator'
import MessageActions from './message-action'
import ForwardMessageModal from './message-action/ForwardMessageModal'
import MessageReactions from './message-action/MessageReaction'
import MessageReadByModal from './message-action/MessageReadBy'
import PinMessageModal from './message-action/PinMessageModal'
import PinnedMessagesBar from './message-action/PinnedMessagesBar'
import { useMessageSelection } from './message-action/useMessageSelection'
import AudioMessage from './messages/AudioMessage'
import CallMessage from './messages/CallMessage'
import FileMessage from './messages/FileMessage'
import ImageMessage from './messages/ImageMessage'
import RepliedMessage from './messages/RepliedMessage'
import StickerMessage from './messages/StickerMessage'
import SystemMessage from './messages/SystemMessage'
import VideoMessage from './messages/VideoMessage'
import LocationMessage from './messages/LocationMessage'
import DecryptedMessage from './messages/DecryptedMessage'
import { encryptMessageIfNeeded, decryptMessageIfNeeded } from '../../../../../utils/e2e-helpers'
import { useE2EEncryption } from '../../../../../hooks/useE2EEncryption'
import { queries } from '../../../../../api'
import get from '../../../../../api/get'
import { URL_KEYS } from '../../../../../constants/url'
import AnnouncementMessage from './messages/AnnouncementMessage'
import StatusReply from './messages/StatusReply'

const Chat = () => {
  const { t } = useTranslation()
  const { selectedUser, highlightedMessageId, selectedChatMessages } = useAppSelector((state) => state.chat)
  const { app_name } = useAppSelector((state) => state.settings)
  const messageRefs = useRef<{ [key: string | number]: HTMLLIElement | null }>({})
  const chatEndRef = useRef<HTMLDivElement>(null)
  const { data: currentUserData } = queries.useGetUserDetails()
  const currentUser = currentUserData?.user
  const dispatch = useAppDispatch()
  const isGroupChat = selectedUser?.chat_type === 'group'
  const queryClient = useQueryClient()
  const { data: publicSettings } = queries.useGetPublicSettings()
  const e2eSetting = publicSettings?.settings?.e2e_encryption_enabled
  const isE2EEnabled = e2eSetting === true || e2eSetting === 1 || e2eSetting === '1' || e2eSetting === 'true'
  const { isInitialized: isE2EInitialized, hasKeys: hasE2EKeys } = useE2EEncryption()
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null)
  const [forwardModalOpen, setForwardModalOpen] = useState(false)
  const [messageToForward, setMessageToForward] = useState<Message | null>(null)
  const deleteMessageMutation = mutations.useDeleteMessage()
  const starMessageMutation = mutations.useStarMessage()
  const pinMessageMutation = mutations.useTogglePinMessage()
  const forwardMessageMutation = mutations.useForwardMessage()
  const [expandedMessages, setExpandedMessages] = useState<Set<string | number>>(new Set())
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [messageToPin, setMessageToPin] = useState<Message | null>(null)
  const { chatPinVerified } = useAppSelector((state) => state.userSettings)
  const { data: messagesData, isLoading } = queries.useGetMessagesInfinite(
    selectedUser,
    selectedUser?.isLocked ? chatPinVerified : null,
  )
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { time_format } = useAppSelector((state) => state.settings)
  const { selectedMessages, isSelectionMode, toggleMessageSelection, clearSelection } = useMessageSelection()
  const use12HourFormat = time_format === '12h'

  // Track previous chat ID to detect chat changes
  const previousChatIdRef = useRef<string | number | null>(null)

  useEffect(() => {
    if (messagesData?.pages) {
      const allMessages = mergeMessagesFromPages(messagesData.pages)
      const processedMessages = mergeAndGroupMessages(allMessages)
      dispatch(setSelectedChatMessages(processedMessages))
    }
  }, [messagesData, dispatch])

  const { mutate: markMessagesAsRead } = mutations.useMarkMessagesAsRead()

  useEffect(() => {
    if (!selectedUser || !currentUser?.id || isLoading) return

    if (isGroupChat && selectedUser.chat_id) {
      dispatch(resetUnreadCount({ chatId: selectedUser.chat_id, chatType: 'group' }))

      markMessagesAsRead(
        { chat_id: selectedUser.chat_id, chat_type: 'group' },
        {
          onSuccess: () => {},
          onError: (error) => {
            console.error('Failed to mark messages as read:', error)
          },
        },
      )
    } else if (!isGroupChat && selectedUser.chat_id) {
      dispatch(resetUnreadCount({ chatId: selectedUser.chat_id, chatType: 'direct' }))

      markMessagesAsRead(
        { chat_id: selectedUser.chat_id, chat_type: 'direct' },
        {
          onSuccess: () => {},
          onError: (error) => {
            console.error('Failed to mark messages as read:', error)
          },
        },
      )
    }
  }, [selectedUser?.chat_id, isGroupChat, currentUser?.id, isLoading, dispatch, markMessagesAsRead])

  useEffect(() => {
    if (!highlightedMessageId) return
    const allMessages = selectedChatMessages.flatMap((dg: any) => dg.messages || [])
    const messageExists = allMessages.some((msg: Message) => String(msg.id) === String(highlightedMessageId))

    if (!messageExists) {
      dispatch(setHighlightedMessageId(null))
      return
    }

    let timeoutId: NodeJS.Timeout | null = null
    const tryScroll = (attempts = 0) => {
      const maxAttempts = 20
      const messageElement =
        messageRefs.current[highlightedMessageId] ||
        messageRefs.current[Number(highlightedMessageId)] ||
        messageRefs.current[String(highlightedMessageId)]

      if (messageElement) {
        scrollToMessage(highlightedMessageId, messageRefs)
        dispatch(setHighlightedMessageId(null))
      } else if (attempts < maxAttempts) {
        timeoutId = setTimeout(() => tryScroll(attempts + 1), 100)
      } else {
        console.warn(`Message ${highlightedMessageId} not found after retries`)
        dispatch(setHighlightedMessageId(null))
      }
    }

    tryScroll()

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [highlightedMessageId, selectedChatMessages, dispatch])

  useEffect(() => {
    if (highlightedMessageId) {
      dispatch(setHighlightedMessageId(null))
    }
  }, [selectedUser?.chat_id])

  useEffect(() => {
    const handleMessageDeleted = (data: {
      messageId: number
      newPrevMessage?: Message | null
      deletedMessage: any
      wasUnread?: boolean
      group_id?: number
      recipient_id?: number
      sender_id?: number
    }) => {
      const isForCurrentChat = isGroupChat
        ? data.group_id === selectedUser?.chat_id
        : data.sender_id === selectedUser?.chat_id || data.recipient_id === selectedUser?.chat_id

      if (isForCurrentChat) {
        queryClient.invalidateQueries({
          queryKey: ['messages', selectedUser?.chat_id],
        })
      }
    }
    socket.on('message-deleted', handleMessageDeleted)
    return () => {
      socket.off('message-deleted', handleMessageDeleted)
    }
  }, [selectedUser?.chat_id, isGroupChat, queryClient])

  useEffect(() => {
    if (!selectedUser || !currentUser?.id) return

    const handleMessageStatusUpdated = (data: {
      messageId: number
      userId: number
      status: string
      updated_at: string
    }) => {
      if (data.messageId && data.userId && data.status) {
        dispatch(
          updateMessageStatus({
            messageId: data.messageId,
            userId: data.userId,
            status: data.status as 'sent' | 'delivered' | 'read' | 'seen',
          }),
        )
      }
      queryClient.invalidateQueries({
        queryKey: ['messages', selectedUser?.chat_id],
      })
    }

    const handleMessageUpdated = (updatedMessage: Message) => {
      // Check if the updated message belongs to the current chat
      const isForCurrentChat = isGroupChat
        ? updatedMessage.group_id === selectedUser?.chat_id
        : updatedMessage.recipient_id === selectedUser?.chat_id || updatedMessage.sender_id === selectedUser?.chat_id

      if (isForCurrentChat) {
        // Invalidate the infinite query to trigger a refetch
        queryClient.invalidateQueries({
          queryKey: [KEYS.GET_MESSAGES, selectedUser?.chat_id, isGroupChat ? 'group' : 'direct'],
        })
      }
    }

    socket.on('message-status-updated', handleMessageStatusUpdated)
    socket.on('message-updated', handleMessageUpdated)
    return () => {
      socket.off('message-status-updated', handleMessageStatusUpdated)
      socket.off('message-updated', handleMessageUpdated)
    }
  }, [selectedUser?.chat_id, currentUser?.id, queryClient, isGroupChat])

  // Helper function to find scroll container
  const findScrollContainer = useCallback((): HTMLElement | null => {
    const container = chatEndRef.current
    if (!container) return null

    let scrollContainer: HTMLElement | null = null

    // Strategy 1: Find .chatappend (the actual scrollable ul)
    let element: HTMLElement | null = container
    let depth = 0
    while (element && element !== document.body && depth < 15) {
      if (element.classList && element.classList.contains('chatappend')) {
        scrollContainer = element
        break
      }
      element = element.parentElement
      depth++
    }

    // Strategy 2: Find .messages if .chatappend not found
    if (!scrollContainer) {
      element = container
      depth = 0
      while (element && element !== document.body && depth < 15) {
        if (element.classList && element.classList.contains('messages')) {
          scrollContainer = element
          break
        }
        element = element.parentElement
        depth++
      }
    }

    // Strategy 3: Find any scrollable parent
    if (!scrollContainer) {
      element = container.parentElement
      depth = 0
      while (element && element !== document.body && depth < 15) {
        const style = window.getComputedStyle(element)
        const overflowY = style.overflowY
        const overflow = style.overflow
        if (
          (overflowY === 'auto' || overflowY === 'scroll' || overflow === 'auto' || overflow === 'scroll') &&
          element.scrollHeight > element.clientHeight
        ) {
          scrollContainer = element
          break
        }
        element = element.parentElement
        depth++
      }
    }

    return scrollContainer
  }, [])

  const isAtBottom = useCallback(
    (threshold: number = 100): boolean => {
      const scrollContainer = findScrollContainer()
      if (!scrollContainer) return true

      const scrollTop = scrollContainer.scrollTop
      const scrollHeight = scrollContainer.scrollHeight
      const clientHeight = scrollContainer.clientHeight

      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      return distanceFromBottom <= threshold
    },
    [findScrollContainer],
  )

  useEffect(() => {
    if (!selectedUser) {
      previousChatIdRef.current = null
    }
  }, [selectedUser])

  const scrollToBottomOptimized = useCallback(
    (useSmooth: boolean = false) => {
      const performScroll = () => {
        if (chatEndRef.current) {
          chatEndRef.current.scrollIntoView({
            behavior: useSmooth ? 'smooth' : 'auto',
            block: 'end',
            inline: 'nearest',
          })
        } else {
          const scrollContainer = findScrollContainer()
          if (scrollContainer) {
            if (useSmooth) {
              scrollContainer.scrollTo({
                top: scrollContainer.scrollHeight,
                behavior: 'smooth',
              })
            } else {
              scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
          }
        }
      }

      requestAnimationFrame(() => {
        performScroll()
        requestAnimationFrame(() => {
          performScroll()
        })
      })
    },
    [findScrollContainer],
  )

  const previousMessageCountRef = useRef<number>(0)
  const lastMessageRef = useRef<{ id: string | number | null; sender_id: string | number | null } | null>(null)
  const initiallyScrolledChatsRef = useRef<Set<string | number>>(new Set())

  useEffect(() => {
    if (!selectedUser?.chat_id) return

    const currentChatId = selectedUser.chat_id
    const isChatChanged = previousChatIdRef.current !== currentChatId
    const currentMessageCount = (selectedChatMessages as any[]).reduce((sum: number, group: any) => sum + (group.messages?.length || 0), 0)
    const hasNewMessages = currentMessageCount > previousMessageCountRef.current

    const isFirstTimeViewing = previousChatIdRef.current === null || !initiallyScrolledChatsRef.current.has(currentChatId)

    let lastMessage: { id: string | number | null; sender_id: string | number | null; message_type?: string } | null = null
    let lastMessageFull: Message | null = null
    if (selectedChatMessages.length > 0) {
      const lastGroup = (selectedChatMessages as any[])[selectedChatMessages.length - 1]
      if (lastGroup?.messages && lastGroup.messages.length > 0) {
        const msg = lastGroup.messages[lastGroup.messages.length - 1]
        lastMessage = { id: msg.id, sender_id: msg.sender_id, message_type: msg.message_type }
        lastMessageFull = msg
      }
    }

    const isNewMessageFromCurrentUser = Boolean(
      hasNewMessages && 
      lastMessage && 
      lastMessageRef.current &&
      lastMessage.id !== lastMessageRef.current.id &&
      String(lastMessage.sender_id) === String(currentUser?.id)
    )

    let isNewCallDurationMessage = false
    if (hasNewMessages && lastMessage && lastMessageFull && lastMessageRef.current && lastMessage.id !== lastMessageRef.current.id) {
      if (lastMessage.message_type === 'call') {
        const metadata = getMetadata(lastMessageFull)
        const action = metadata?.action
        const duration = metadata?.duration
        isNewCallDurationMessage = Boolean(
          action === 'ended' && 
          (typeof duration === 'number' ? duration > 0 : false)
        )
      }
    }

    if (selectedChatMessages.length > 0 && !isLoading) {
      const shouldScroll = isFirstTimeViewing || isNewMessageFromCurrentUser || isNewCallDurationMessage
      const shouldNavigateToBottom = isChatChanged && !isFirstTimeViewing
      
      if (shouldScroll) {
        const useSmooth: boolean = isFirstTimeViewing || isNewMessageFromCurrentUser || isNewCallDurationMessage

        scrollToBottomOptimized(useSmooth)

        const timers: NodeJS.Timeout[] = []

        timers.push(
          setTimeout(() => {
            scrollToBottomOptimized(false)
          }, 100),
        )

        timers.push(
          setTimeout(() => {
            scrollToBottomOptimized(false)
          }, 300),
        )

        timers.push(
          setTimeout(() => {
            scrollToBottomOptimized(false)
          }, 600),
        )

        if (isFirstTimeViewing) {
          initiallyScrolledChatsRef.current.add(currentChatId)
        }

        return () => {
          timers.forEach((timer) => clearTimeout(timer))
        }
      } else if (shouldNavigateToBottom) {
        scrollToBottomOptimized(false)

        const timers: NodeJS.Timeout[] = []

        timers.push(
          setTimeout(() => {
            scrollToBottomOptimized(false)
          }, 100),
        )

        timers.push(
          setTimeout(() => {
            scrollToBottomOptimized(false)
          }, 300),
        )

        return () => {
          timers.forEach((timer) => clearTimeout(timer))
        }
      }
    }

    // Update refs
    previousChatIdRef.current = currentChatId
    previousMessageCountRef.current = currentMessageCount
    lastMessageRef.current = lastMessage
  }, [selectedUser?.chat_id, selectedChatMessages, isLoading, scrollToBottomOptimized, currentUser?.id])

  useEffect(() => {
    if (!selectedUser || !currentUser?.id || isLoading) return

    let lastMarkedMessageId: string | number | null = null
    let markAsSeenTimeout: NodeJS.Timeout | null = null

    const handleMarkAsSeen = () => {
      if (!socket.connected || document.hidden) return

      if (!isAtBottom(100)) {
        return
      }

      const allMessages = selectedChatMessages.flatMap((dg: any) => dg.messages || [])
      if (allMessages.length === 0) return

      const lastMessage = allMessages[allMessages.length - 1]
      if (!lastMessage) return

      if (lastMarkedMessageId === lastMessage.id) {
        return
      }

      const isIncoming = lastMessage.sender_id !== currentUser.id
      if (!isIncoming) return

      const lastMessageStatus = lastMessage.statuses?.find((s: Status) => s.user_id === currentUser.id)
      if (lastMessageStatus?.status === 'seen' || lastMessageStatus?.status === 'read') {
        lastMarkedMessageId = lastMessage.id
        return
      }

      lastMarkedMessageId = lastMessage.id

      const unreadMessages = allMessages.filter((msg: Message) => {
        const isIncomingMsg = msg.sender_id && String(msg.sender_id) !== String(currentUser.id)
        if (!isIncomingMsg) return false
        
        const userStatus = msg.statuses?.find((s: Status) => s.user_id === currentUser.id)
        const isSeen = userStatus?.status === 'seen' || userStatus?.status === 'read'
        return !isSeen
      })

      unreadMessages.forEach((msg: Message) => {
        dispatch(
          updateMessageStatus({
            messageId: msg.id,
            userId: currentUser.id,
            status: 'seen',
          }),
        )
      })

      if (isGroupChat && selectedUser.chat_id) {
        socket.emit('mark-last-message-seen', {
          lastMessageId: lastMessage.id,
          groupId: selectedUser.chat_id,
        })
      } else if (!isGroupChat && selectedUser.chat_id) {
        socket.emit('mark-last-message-seen', {
          lastMessageId: lastMessage.id,
          recipientId: selectedUser.chat_id,
        })
      }
    }

    const throttledMarkAsSeen = () => {
      if (markAsSeenTimeout) {
        clearTimeout(markAsSeenTimeout)
      }
      markAsSeenTimeout = setTimeout(() => {
        handleMarkAsSeen()
      }, 1000)
    }

    const timer = setTimeout(() => {
      handleMarkAsSeen()
    }, 500)

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setTimeout(() => {
          handleMarkAsSeen()
        }, 300)
      }
    }

    // Also check when user scrolls to bottom
    const scrollContainer = findScrollContainer()
    let scrollHandler: (() => void) | null = null
    if (scrollContainer) {
      scrollHandler = () => {
        throttledMarkAsSeen()
      }
      scrollContainer.addEventListener('scroll', scrollHandler, { passive: true })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(timer)
      if (markAsSeenTimeout) {
        clearTimeout(markAsSeenTimeout)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (scrollContainer && scrollHandler) {
        scrollContainer.removeEventListener('scroll', scrollHandler)
      }
    }
  }, [
    selectedUser,
    selectedChatMessages,
    currentUser?.id,
    isGroupChat,
    isLoading,
    isAtBottom,
    findScrollContainer,
    socket,
  ])

  useEffect(() => {
    const handleClickOutside = () => {
      if (!isSelectionMode) return
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSelectionMode, clearSelection])

  useEffect(() => {
    return () => {
      if ((window as any).__longPressTimeout) {
        clearTimeout((window as any).__longPressTimeout)
        ;(window as any).__longPressTimeout = null
      }
      ;(window as any).__longPressStarted = false
      ;(window as any).__longPressTriggered = false
    }
  }, [selectedUser?.chat_id])

  const handleReply = (message: Message) => {
    dispatch(setReplyMessage(message))
    setOpenDropdownId(null)
  }

  const handleEdit = (message: Message) => {
    const senderId = message.sender?.id
    const isSent = !!currentUser?.id && senderId === currentUser.id
    const isTextMessage = message.message_type === 'text'
    if (isSent && isTextMessage) {
      dispatch(setEditMessage(message))
    }
    setOpenDropdownId(null)
  }

  const [messageForReadBy, setMessageForReadBy] = useState<Message | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | number | null>(null)

  const handleReadBy = (message: Message) => {
    const senderId = message.sender?.id || message.sender_id
    const isSent = !!currentUser?.id && senderId === currentUser.id
    if (isSent) {
      setMessageForReadBy(message)
      setInfoModalOpen(true)
    }
    setOpenDropdownId(null)
  }

  const handleCopy = async (message: Message) => {
    if ((message.message_type === 'text' || message.isAnnouncement) && message.content) {
      let contentToCopy = message.content

      // Check if message is encrypted by flag or by content format
      const isEncryptedFlag =
        message.is_encrypted === true ||
        message.is_encrypted === 1 ||
        message.is_encrypted === 'true' ||
        message.is_encrypted === '1'

      // Check if content looks encrypted (similar to DecryptedMessage component)
      let isEncryptedFormat = false
      if (message.content.startsWith('U2FsdGVk')) {
        isEncryptedFormat = true
      } else {
        try {
          const parsed = JSON.parse(message.content)
          if (
            parsed &&
            typeof parsed === 'object' &&
            (('encryptedKey' in parsed && 'iv' in parsed && 'encryptedData' in parsed) ||
              ('sender' in parsed && 'recipient' in parsed) ||
              ('sender' in parsed && 'members' in parsed && typeof parsed.members === 'object'))
          ) {
            isEncryptedFormat = true
          }
        } catch {
          // Not JSON, so not encrypted format
          isEncryptedFormat = false
        }
      }

      const shouldDecrypt = isEncryptedFlag || isEncryptedFormat

      if (shouldDecrypt) {
        try {
          const { decryptMessageIfNeeded } = await import('../../../../../utils/e2e-helpers')
          const isSent =
            !!currentUser?.id && (message.sender?.id === currentUser.id || message.sender_id === currentUser.id)
          contentToCopy = await decryptMessageIfNeeded(
            message.content,
            true, // Pass true since we've determined it's encrypted
            isSent,
            message.sender?.id || message.sender_id,
            message.isForwarded,
            currentUser?.id,
          )
        } catch (error) {
          console.error('Error decrypting message for copy:', error)
          // If decryption fails, copy the encrypted content but show a warning
          contentToCopy = '[Unable to decrypt message]'
        }
      }

      navigator.clipboard
        .writeText(contentToCopy)
        .then(() => {
          setCopiedMessageId(message.id)
          setTimeout(() => {
            setCopiedMessageId(null)
          }, 2500)
        })
        .catch((err) => {
          console.error('Failed to copy to clipboard:', err)
        })
    }
    setOpenDropdownId(null)
  }

  const handleForward = (message: Message) => {
    setMessageToForward(message)
    setForwardModalOpen(true)
    setOpenDropdownId(null)
  }

  const handleForwardConfirm = async (recipients: Array<{ type: 'user' | 'group'; id: number | string }>) => {
    if (!messageToForward) return

    try {
      let encryptedContents: Record<string, Record<string, string>> | undefined = undefined

      const message = messageToForward
      let isEncrypted =
        message.is_encrypted === true ||
        message.is_encrypted === 1 ||
        message.is_encrypted === 'true' ||
        message.is_encrypted === '1'
      
      if (!isEncrypted && message.content) {
        if (message.content.startsWith('U2FsdGVk')) {
          isEncrypted = true
        } else {
          try {
            const parsed = JSON.parse(message.content)
            if (
              parsed &&
              typeof parsed === 'object' &&
              (('encryptedKey' in parsed && 'iv' in parsed && 'encryptedData' in parsed) ||
                ('sender' in parsed && 'recipient' in parsed) ||
                ('sender' in parsed && 'members' in parsed && typeof parsed.members === 'object'))
            ) {
              isEncrypted = true
            }
          } catch {}
        }
      }

      if (isEncrypted && message.content) {
        try {
          const isSent =
            !!currentUser?.id && (message.sender?.id === currentUser.id || message.sender_id === currentUser.id)
          const decryptedContent = await decryptMessageIfNeeded(
            message.content,
            true,
            isSent,
            message.sender?.id || message.sender_id,
            message.isForwarded,
            currentUser?.id,
          )

          if (!encryptedContents) {
            encryptedContents = {}
          }
          encryptedContents[message.id] = {}

          for (const rec of recipients) {
            if (!rec?.type || !rec.id) continue

            const isGroup = rec.type === 'group'
            const recipientId = isGroup ? undefined : rec.id

            try {
              let contentToSend = decryptedContent

              if (isE2EEnabled) {
                if (!isE2EInitialized || !hasE2EKeys) {
                  toast.error('Encryption is not ready. Please wait a moment and try again.')
                  return
                }

                let groupMembers = undefined
                if (isGroup) {
                  try {
                    const params = new URLSearchParams({
                      group_id: String(rec.id),
                      page: '1',
                      limit: '100',
                      sort_order: 'DESC',
                    })
                    const groupData = await queryClient.fetchQuery({
                      queryKey: [KEYS.GROUP_MEMBERS, rec.id, 1, 100, undefined, undefined, 'DESC'],
                      queryFn: () => get<GetGroupMembersResponse>(`${URL_KEYS.Group.Members}?${params.toString()}`),
                    })
                    groupMembers = groupData.members
                  } catch (groupError) {
                    console.error(`Failed to fetch group members for group ${rec.id}:`, groupError)
                  }
                }

                const encryptionResult = await encryptMessageIfNeeded(
                  decryptedContent,
                  recipientId,
                  isGroup,
                  isE2EEnabled,
                  groupMembers,
                  currentUser?.id,
                )
                contentToSend = encryptionResult.encryptedContent
              }
              const key = isGroup ? `group_${rec.id}` : `user_${rec.id}`
              encryptedContents[message.id][key] = contentToSend
            } catch (encryptError) {
              console.error(`Failed to process content for recipient ${rec.id}:`, encryptError)
            }
          }
        } catch (decryptError) {
          console.error(`Failed to decrypt message ${message.id}:`, decryptError)
        }
      }

      const response = await forwardMessageMutation.mutateAsync({
        messageIds: messageToForward.id,
        recipients,
        encryptedContents,
      })

      if (response?.messages && selectedUser && currentUser?.id) {
        const currentUserId = currentUser.id
        const selectedChatId = Number(selectedUser.chat_id)
        const isGroupChat = selectedUser.chat_type === 'group'

        response.messages.forEach((message) => {
          // Check if this message belongs to the currently selected chat
          let belongsToCurrentChat = false

          if (isGroupChat) {
            belongsToCurrentChat = !!(message.group_id && Number(message.group_id) === selectedChatId)
          } else {
            // For direct chats, check if the message is between current user and selected user
            const otherUserId = message.sender_id === currentUserId ? message.recipient_id : message.sender_id
            belongsToCurrentChat = !!(otherUserId && Number(otherUserId) === selectedChatId)
          }

          if (belongsToCurrentChat) {
            // Explicitly mark as forwarded since this is a forwarded message
            const forwardedMessage = {
              ...message,
              isForwarded: true,
            }
            dispatch(
              addOrUpdateMessage({
                message: forwardedMessage,
                currentUserId,
              }),
            )
          }
        })
      }

      setForwardModalOpen(false)
      setMessageToForward(null)

      queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES], exact: false })
    } catch (error) {
      console.error('Failed to forward message:', error)
      toast.error('Failed to forward message')
    }
  }

  const handleStar = async (message: Message) => {
    const isStarred = message.isStarred

    try {
      await starMessageMutation.mutateAsync({
        messageId: message.id,
        isStarred: !isStarred,
      })
      queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES], exact: false })
    } catch {
      toast.error('Failed to update star status')
    }

    setOpenDropdownId(null)
  }

  const handlePin = async (message: Message | null) => {
    if (message?.isPinned) {
      try {
        await pinMessageMutation.mutateAsync({
          messageId: message.id,
        })
        queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES], exact: false })
      } catch {
        toast.error('Failed to update pin status')
      }
    } else {
      setMessageToPin(message)
      setPinModalOpen(true)
    }
    setOpenDropdownId(null)
  }

  const isMessageStarred = (message: Message) => {
    return message.isStarred ?? false
  }

  const isMessagePin = (message: Message) => {
    return message.isPinned ?? false
  }

  const isBroadcast = (message: Message) => {
    return message?.metadata?.is_broadcast && currentUser?.id == message.sender?.id && !selectedUser?.isBroadcast
  }

  const isMessageForwarded = (message: Message) => {
    return message.isForwarded ?? false
  }

  const isMessageEdited = (message: Message) => {
    return message.isEdited ?? false
  }

  const handleDelete = (message: Message) => {
    const senderId = message.sender?.id
    const isSent = !!currentUser?.id && senderId === currentUser.id
    setIsSent(isSent)
    setMessageToDelete(message)
    setDeleteModalOpen(true)
    setOpenDropdownId(null)
  }

  const handleConfirmDelete = async (deleteType: 'delete-for-me' | 'delete-for-everyone') => {
    if (!messageToDelete || !selectedUser) return
    const queryKey = [KEYS.GET_MESSAGES, selectedUser.chat_id, isGroupChat ? 'group' : 'direct']
    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData

      const updateMessagesRecursive = (items: any[]): any[] => {
        return items
          .map((item: any) => {
            if (item.id === messageToDelete.id && item.sender_id !== undefined) {
              if (deleteType === 'delete-for-me') {
                return null
              } else {
                return {
                  ...item,
                  isDeleted: true,
                  isDeletedForEveryone: true,
                  content: '',
                  file_url: null,
                }
              }
            }
            if (item.messages && Array.isArray(item.messages)) {
              const updatedMessages = updateMessagesRecursive(item.messages).filter(Boolean)
              return { ...item, messages: updatedMessages }
            }

            if (item.messageGroups && Array.isArray(item.messageGroups)) {
              const updatedGroups = item.messageGroups.map((group: any) => {
                if (group.messages && Array.isArray(group.messages)) {
                  const updatedGroupMessages = updateMessagesRecursive(group.messages).filter(Boolean)
                  return { ...group, messages: updatedGroupMessages }
                }
                return group
              })
              return { ...item, messageGroups: updatedGroups }
            }

            return item
          })
          .filter(Boolean)
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

    try {
      await deleteMessageMutation.mutateAsync({
        messageIds: [String(messageToDelete.id)],
        deleteType: deleteType,
        isBroadcast: selectedUser.isBroadcast ? true : undefined,
        broadcastId: selectedUser.isBroadcast ? selectedUser.chat_id : undefined,
      })
      queryClient.invalidateQueries({ queryKey })

      setDeleteModalOpen(false)
      setMessageToDelete(null)
      queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })
    } catch (error) {
      console.error('Failed to delete message:', error)
      queryClient.invalidateQueries({ queryKey })
    }
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
    setMessageToDelete(null)
  }

  const handleMobileMenu = () => {
    dispatch(setMobileMenu())
  }

  const handleReplyPreviewClick = (parentMessageId: number | string) => {
    if (messageRefs.current[parentMessageId]) {
      scrollToMessage(parentMessageId, messageRefs)
      dispatch(setHighlightedMessageId(parentMessageId))
    }
  }

  if (!selectedUser) {
    return (
      <div className="call-list-center">
        <button
          className="icon-btn bg-light-primary button-effect mobile-sidebar"
          onClick={handleMobileMenu}
          type="button"
        >
          <ChevronLeft />
        </button>
        <Image src={`${ImagePath}/chat.gif`} alt="#" />
        <h2 className="text-center">{t('select_a_chat_to_start_messaging')}</h2>
        <p className="text-center">{t('choose_conversation')}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading messages...</span>
        </div>
      </div>
    )
  }

  const readMoreLabel = (message: Message) => {
    const senderId = message.sender?.id
    const isSent = !!currentUser?.id && senderId === currentUser.id
    const messageId = message.id
    const isExpanded = expandedMessages.has(messageId)

    const toggleExpanded = () => {
      setExpandedMessages((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(messageId)) {
          newSet.delete(messageId)
        } else {
          newSet.add(messageId)
        }
        return newSet
      })
    }

    return (
      <DecryptedMessage message={message}>
        {(decryptedContent) => {
          const isLong = decryptedContent.length > 500
          const singleEmoji = isSingleEmoji(decryptedContent)

          return (
            <h5 className={`${isLong && !isExpanded ? '' : 'read'}`}>
              <div className={`read-more ${singleEmoji == 1 ? 'single-emoji' : singleEmoji > 1 ? 'emojis' : ''}`}>
                {decryptedContent}
                <h6 className="msg-timer d-flex align-items-center gap-2">
                  {isMessageEdited(message) && !message.isDeleted && !message.isDeletedForEveryone && (
                    <div className="edited-indicator small text-muted d-flex align-items-center">Edited</div>
                  )}
                  {formatTime(message.created_at, { hour12: use12HourFormat })}
                  {isSent && (
                    <>
                      {(() => {
                        const statuses = message.statuses || []
                        const isGroup = isGroupChat
                        const hasRead = isGroup
                          ? statuses.every((status: Status) => status.status === 'read' || status.status === 'seen')
                          : statuses.some((status: Status) => status.status === 'read' || status.status === 'seen')
                        const hasDelivered = isGroup
                          ? statuses.every(
                              (status: Status) =>
                                status.status === 'delivered' || status.status === 'read' || status.status === 'seen',
                            )
                          : statuses.some((status: Status) => status.status === 'delivered')

                        if (hasRead) {
                          return <SvgIcon className="seen" iconId="right-2" />
                        } else if (hasDelivered) {
                          return <SvgIcon className="delivered" iconId="right-2" />
                        } else {
                          return <SvgIcon className="sent" iconId="right" />
                        }
                      })()}
                    </>
                  )}
                  {isMessageStarred(message) && <SvgIcon className="fill-warning" iconId="star" />}
                  {isMessagePin(message) && <SvgIcon className="fill-secondary" iconId="stroke-pin" />}
                  {isBroadcast(message) && <SvgIcon className="fill-secondary broadcast-svg" iconId="broadcast" />}
                  {isGroupChat && (
                    <MessageReadByModal
                      isOpen={infoModalOpen && messageForReadBy?.id === message.id}
                      onClose={() => {
                        setInfoModalOpen(false)
                        setMessageForReadBy(null)
                      }}
                      message={messageForReadBy || message}
                    />
                  )}
                </h6>
              </div>
              {isLong && (
                <span onClick={toggleExpanded} className="read-more-toggle">
                  {isExpanded ? 'Read less' : 'Read more'}
                </span>
              )}
            </h5>
          )
        }}
      </DecryptedMessage>
    )
  }

  const renderRegularMessage = (message: Message, messageOwner: any, isSent: boolean, isHovered: boolean) => {
    const isSelected = selectedMessages.has(message.id)

    const handleCheckboxChange = () => {
      toggleMessageSelection(message.id)
    }

    const handleMessageClick = (e: React.MouseEvent) => {
      if (
        (e.target as HTMLElement).closest('.message-checkbox') ||
        (e.target as HTMLElement).closest('.msg-actions') ||
        (e.target as HTMLElement).closest('.dropdown-menu')
      ) {
        return
      }

      if (isSelectionMode && !message.isDeleted && !message.isDeletedForEveryone) {
        toggleMessageSelection(message.id)
      }
    }

    return (
      <li
        className={`${isSent ? 'replies' : 'sent'} ${isSelectionMode ? 'selected-message' : ''} ${
          isSelected ? 'message-selected' : ''
        }`}
        key={message.id}
        onMouseEnter={() => !isSelectionMode && setHoveredMessageId(message.id)}
        onMouseLeave={() => {
          if (!isSelectionMode) {
            setHoveredMessageId(null)
            setOpenDropdownId(null)
          }
        }}
        onClick={handleMessageClick}
        ref={(el) => {
          if (message.id) {
            // Store with both string and number keys for compatibility
            messageRefs.current[message.id] = el
            messageRefs.current[String(message.id)] = el
            messageRefs.current[Number(message.id)] = el
          }
        }}
      >
        <div className={`d-flex align-items-start ${!isSent ? 'sent-aligns' : ''} `}>
          {isSelectionMode && !message.isDeleted && (
            <div className="message-checkbox me-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleCheckboxChange}
                onClick={(e) => e.stopPropagation()}
                className="form-check-input message-checkbox-input"
              />
            </div>
          )}

          {!isSent && (!!messageOwner?.avatar || !!messageOwner?.name) && (
            <ChatAvatar
              data={messageOwner}
              name={messageOwner.isAnnouncement ? app_name : messageOwner.name}
              customClass="user-info avatar-sm bg-img img-fluid"
            />
          )}
          <div className="flex-grow-1">
            <div className={`contact-name ${message.parent_id ? 'replied-message' : ''}`}>
              <div>
                <div className="msg-wrapper">
                  {isMessageForwarded(message) && !message.isDeleted && (
                    <div className="forward-indicator small text-muted d-flex align-items-center">
                      <SvgIcon className="me-1" iconId="forward" />
                      Forwarded
                    </div>
                  )}
                  {message.parent_id &&
                    message.parentMessage &&
                    !message.isDeleted &&
                    !message.isDeletedForEveryone && (
                      <RepliedMessage
                        parentMessage={message.parentMessage}
                        onClick={() => handleReplyPreviewClick(message.parent_id!)}
                        message={message}
                        isLastMessage={false}
                      />
                    )}
                  <ul className="msg-box">
                    <li className={`msg-setting-main`}>
                      {message.isDeleted || message.isDeletedForEveryone ? (
                        <div className="deleted-msg d-flex align-items-center gap-2">
                          <SvgIcon className={isSent ? 'fill-danger' : 'fill-gray'} iconId="trash" />
                          <h5 className={isSent ? 'text-danger mb-0' : 'text-muted mb-0'}>
                            {isSent ? 'You deleted this message' : 'This message was deleted'}
                          </h5>
                        </div>
                      ) : (
                        <>
                          {message.message_type === 'text' &&
                            !message?.metadata?.is_status_reply &&
                            readMoreLabel(message)}
                          {message.metadata?.is_status_reply && <StatusReply message={message} />}
                          {message.message_type === 'announcement' && <AnnouncementMessage message={message} />}
                          {message.message_type === 'audio' && message.file_url && <AudioMessage message={message} />}
                          {message.message_type === 'sticker' && message.file_url && (
                            <StickerMessage message={message} />
                          )}
                          {message.message_type === 'image' && message.file_url && (
                            <ImageMessage
                              message={message}
                              allMessages={selectedChatMessages.flatMap((dg: any) => dg.messages || [])}
                            />
                          )}
                          {message.message_type === 'video' && message.file_url && <VideoMessage message={message} />}
                          {(message.message_type === 'file' || message.message_type === 'document') &&
                            message.file_url && <FileMessage message={message} />}
                          {message.message_type === 'call' && <CallMessage message={message} isSent={isSent} />}
                          {message.message_type == 'location' && <LocationMessage message={message} hideIcon={false} />}
                        </>
                      )}
                      <MessageReactions message={message} />
                    </li>
                  </ul>
                </div>
                <div className="msg-times d-flex">
                  {(message.message_type !== 'text' || message.metadata?.is_status_reply) && (
                    <>
                      {formatTime(message.created_at, { hour12: use12HourFormat })}
                      {isSent && (
                        <>
                          {(() => {
                            const statuses = message.statuses || []
                            const isGroup = isGroupChat
                            const hasRead = isGroup
                              ? statuses.every((status: Status) => status.status === 'read' || status.status === 'seen')
                              : statuses.some((status: Status) => status.status === 'read' || status.status === 'seen')
                            const hasDelivered = isGroup
                              ? statuses.every(
                                  (status: Status) =>
                                    status.status === 'delivered' ||
                                    status.status === 'read' ||
                                    status.status === 'seen',
                                )
                              : statuses.some((status: Status) => status.status === 'delivered')

                            if (hasRead) {
                              return <SvgIcon className="seen" iconId="right-2" />
                            } else if (hasDelivered) {
                              return <SvgIcon className="delivered" iconId="right-2" />
                            } else {
                              return <SvgIcon className="sent" iconId="right" />
                            }
                          })()}
                        </>
                      )}
                      {isMessageStarred(message) && <SvgIcon className="fill-warning" iconId="star" />}
                      {isMessagePin(message) && <SvgIcon className="fill-secondary" iconId="stroke-pin" />}
                      {isBroadcast(message) && <SvgIcon className="fill-secondary" iconId="broadcast" />}
                    </>
                  )}
                </div>
              </div>
              {(isHovered || openDropdownId === message.id) && !message.isDeleted && !message.isDeletedForEveryone && !isSelectionMode && (
                <div className={`msg-actions ${isSent ? 'replies-actions' : 'sent-actions'}`}>
                  <Dropdown
                    isOpen={openDropdownId === message.id}
                    toggle={() => setOpenDropdownId((prev) => (prev === message.id ? null : message.id))}
                    direction="start"
                  >
                    <DropdownToggle tag="span">
                      <SvgIcon className="common-svg-hw-btn more-horizontal" iconId="more-horizontal" />
                    </DropdownToggle>
                    <DropdownMenu container="body" className="chat-dropdown">
                      {!message.isAnnouncement && (
                        <DropdownItem onClick={() => handleReply(message)}>
                          <SvgIcon className="common-svg-hw" iconId="reply" /> {t('reply_placeholder')}
                        </DropdownItem>
                      )}
                      <DropdownItem onClick={() => handleForward(message)}>
                        <SvgIcon className="common-svg-hw" iconId="forward" /> {t('forward')}
                      </DropdownItem>
                      {message.message_type !== 'announcement' && (
                        <DropdownItem onClick={() => handleCopy(message)}>
                          <SvgIcon className="common-svg-hw" iconId="copy" />
                          {copiedMessageId === message.id ? t('copied') : t('copy')}
                        </DropdownItem>
                      )}
                      <DropdownItem onClick={() => handleStar(message)}>
                        <SvgIcon className="common-svg-hw favorite" iconId="dropdown-star" />
                        {isMessageStarred(message) ? t('unstar') : t('star')}
                      </DropdownItem>
                      {!selectedUser.isAnnouncement && !selectedUser.isBroadcast && (
                        <DropdownItem onClick={() => handlePin(message)}>
                          <SvgIcon className="common-svg-hw" iconId="stroke-pin" />
                          {isMessagePin(message) ? t('unpin') : t('pin')}
                        </DropdownItem>
                      )}
                      {isSent && message.message_type == 'text' && !selectedUser.isBroadcast && (
                        <DropdownItem onClick={() => handleEdit(message)}>
                          <SvgIcon className="common-svg-hw" iconId="edit" /> {t('edit')}
                        </DropdownItem>
                      )}
                      {isGroupChat && isSent && (
                        <DropdownItem onClick={() => handleReadBy(message)}>
                          <SvgIcon className="common-svg-hw" iconId="email" /> {t('read_receipts')}
                        </DropdownItem>
                      )}
                      {
                        <DropdownItem onClick={() => handleDelete(message)} className="text-danger">
                          <SvgIcon className="common-svg-hw" iconId="trash" /> {t('delete')}
                        </DropdownItem>
                      }
                    </DropdownMenu>
                  </Dropdown>
                  {!selectedUser.isAnnouncement && !selectedUser.isBroadcast && <MessageActions message={message} />}
                </div>
              )}
            </div>
          </div>
        </div>
      </li>
    )
  }

  const renderSystemMessage = (message: Message, dateGroupMessages: Message[], messageIndex: number) => {
    const isFirstInGroup = isFirstInSystemMessageGroup(dateGroupMessages, messageIndex)
    const consecutiveMessages = getConsecutiveSystemMessages(dateGroupMessages, messageIndex)
    const currentMessageIndex = consecutiveMessages.findIndex((msg) => msg.id === message.id)

    return (
      <SystemMessage
        key={message.id}
        message={message}
        consecutiveSystemMessages={consecutiveMessages}
        isGrouped={consecutiveMessages.length > 1}
        isFirstInGroup={isFirstInGroup}
        currentMessageIndex={currentMessageIndex}
      />
    )
  }

  return (
    <>
      <div className="contact-chat" ref={chatContainerRef}>
        <PinnedMessagesBar
          messages={selectedChatMessages.flatMap((dg: any) => dg.messages || [])}
          onMessageClick={(messageId) => {
            if (messageRefs.current[messageId]) {
              scrollToMessage(messageId, messageRefs)
              dispatch(setHighlightedMessageId(messageId))
            }
          }}
        />
        <ul className="chatappend">
          {selectedChatMessages && selectedChatMessages.length > 0 ? (
            <>
              {selectedChatMessages.map((dateGroup: any, dateGroupIndex: number) => (
                <div className="datesection" key={`date-group-${dateGroupIndex}`}>
                  <li className="date-badge text-center my-sm-3 my-2">
                    <span className="badge bg-light text-muted px-3 py-2">{dateGroup.label}</span>
                  </li>

                  {dateGroup.messages &&
                    dateGroup.messages.map((message: Message, messageIndex: number) => {
                      const senderId = message.sender?.id
                      const isSent = !!currentUser?.id && senderId === currentUser.id
                      const messageOwner = isGroupChat ? message.sender : selectedUser
                      const isHovered = hoveredMessageId === message.id

                      if (message.message_type === 'system') {
                        return renderSystemMessage(message, dateGroup.messages, messageIndex)
                      }

                      return renderRegularMessage(message, messageOwner, isSent, isHovered)
                    })}
                </div>
              ))}
              <div ref={chatEndRef} />
            </>
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
              <h2>You haven't chatted yet !!</h2>
              <p>No conversations yet. Start chatting with {selectedUser?.name}!</p>
            </div>
          )}
        </ul>
        <div className="custom-typing-indicator">
          <TypingIndicator />
        </div>
        <ScrollToBottomButton 
          containerRef={chatEndRef} 
          threshold={50}
          unreadCount={(() => {
            if (!currentUser?.id || !selectedChatMessages.length) return 0
            
            // Count unread messages (incoming messages that haven't been seen)
            let unreadCount = 0
            selectedChatMessages.forEach((dateGroup: any) => {
              // Ensure dateGroup has messages property
              if (dateGroup && dateGroup.messages && Array.isArray(dateGroup.messages)) {
                dateGroup.messages.forEach((message: Message) => {
                  // Only count incoming messages (not from current user)
                  const isIncoming = message.sender_id && String(message.sender_id) !== String(currentUser.id)
                  if (!isIncoming) return
                  
                  // Check if message has been seen by current user
                  const userStatus = message.statuses?.find((s: Status) => s.user_id === currentUser.id)
                  const isSeen = userStatus?.status === 'seen' || userStatus?.status === 'read'
                  
                  // Count as unread if not seen
                  if (!isSeen) {
                    unreadCount++
                  }
                })
              }
            })
            
            return unreadCount
          })()}
        />
      </div>

      <DeleteMessageModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMessageMutation.isPending}
        isGroupChat={isGroupChat}
        canDeleteForEveryone={isSent}
      />

      <PinMessageModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false)
          setMessageToPin(null)
        }}
        message={messageToPin}
      />

      <ForwardMessageModal
        isOpen={forwardModalOpen}
        message={messageToForward}
        onClose={() => {
          setForwardModalOpen(false)
          setMessageToForward(null)
        }}
        onForward={handleForwardConfirm}
        isLoading={forwardMessageMutation.isPending}
      />
    </>
  )
}

export default Chat
