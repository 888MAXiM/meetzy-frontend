import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Paperclip, X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { Button, Form, Input } from 'reactstrap'
import { mutations, queries } from '../../../../../api'
import get from '../../../../../api/get'
import { ChatType, ImageBaseUrl } from '../../../../../constants'
import { KEYS } from '../../../../../constants/keys'
import { SOCKET } from '../../../../../constants/socket'
import { URL_KEYS } from '../../../../../constants/url'
import { useE2EEncryption } from '../../../../../hooks/useE2EEncryption'
import { useAppDispatch, useAppSelector } from '../../../../../redux/hooks'
import { addOrUpdateMessage, setEditMessage, setReplyMessage } from '../../../../../redux/reducers/messenger/chatSlice'
import { toggleVisibility } from '../../../../../redux/reducers/messenger/messengerSlice'
import { socket } from '../../../../../services/socket-setup'
import DeleteMessageModal from '../../../../../shared/DeleteMessageModal'
import { SvgIcon } from '../../../../../shared/icons'
import { Image } from '../../../../../shared/image'
import type { GetGroupMembersResponse } from '../../../../../types/api'
import { Message } from '../../../../../types/api'
import { decryptMessageIfNeeded, encryptMessageIfNeeded } from '../../../../../utils/e2e-helpers'
import useOutside from '../../../../../utils/useOutside'
import ForwardMessageModal from '../chat/message-action/ForwardMessageModal'
import MessageSelectionActions from '../chat/message-action/MessageSelectionActions'
import { useMessageSelection } from '../chat/message-action/useMessageSelection'
import DecryptedMessage from '../chat/messages/DecryptedMessage'
import AudioRecorder from './AudioRecorder'
import ContactPoll from './ContactPoll'
import FilePreview from './FilePreview'

interface MessageInputProps {
  replyTo?: Message | null
  editTo?: Message | null
  onReplySent?: () => void
  onEditSent?: () => void
}

const MessageInput: React.FC<MessageInputProps> = ({ replyTo, editTo, onReplySent, onEditSent }) => {
  const { t } = useTranslation()
  const [messageInput, setMessageInput] = useState('')
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { activeSection } = useAppSelector((state) => state.messenger)
  const { selectedUser, selectedChatMessages } = useAppSelector((state) => state.chat)
  const { userSetting } = useAppSelector((state) => state.userSettings)
  const { user } = useAppSelector((state) => state.auth)
  const { settings } = useAppSelector((state) => state.settings)
  const { ref, isComponentVisible, setIsComponentVisible } = useOutside(false)
  const { data: currentUserData } = queries.useGetUserDetails()
  const currentUser = currentUserData?.user
  const typingIndicatorEnabled = userSetting?.typing_indicator !== false
  const sendMessageMutation = mutations.useSendMessage()
  const editMessageMutation = mutations.useEditMessage()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isGroupChat = selectedUser?.chat_type === 'group'
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)
  const [mentionSearchQuery, setMentionSearchQuery] = useState('')
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null)
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const [mentionedUsers, setMentionedUsers] = useState<Array<{ id: number | string; name: string; isAll?: boolean }>>(
    [],
  )
  const { selectedMessages, isSelectionMode, clearSelection, getSelectedMessagesData } = useMessageSelection()
  const starMessageMutation = mutations.useStarMessage()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const deleteMessageMutation = mutations.useDeleteMessage()
  const [forwardModalOpen, setForwardModalOpen] = useState(false)
  const [messageToForward, setMessageToForward] = useState<Message | null>(null)
  const forwardMessagesMutation = mutations.useForwardMessage()
  const [isSent, setIsSent] = useState(false)
  const { data } = queries.useGetGroupMembers(
    selectedUser?.chat_id,
    { page: 1, limit: 100 },
    { enabled: !!(selectedUser?.chat_type === ChatType.group) },
  )

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const { data: groupInfoData } = queries.useGetGroupInfo(
    selectedUser?.chat_type === ChatType.group ? selectedUser?.chat_id : undefined,
    { enabled: selectedUser?.chat_type === ChatType.group && !!selectedUser?.chat_id },
  )

  const { data: broadcastDetailsData } = queries.useGetBroadcastDetails(
    selectedUser?.isBroadcast ? selectedUser?.chat_id : undefined,
    { enabled: !!selectedUser?.isBroadcast && !!selectedUser?.chat_id },
  )

  const { data: publicSettings } = queries.useGetPublicSettings()
  const e2eSetting = publicSettings?.settings?.e2e_encryption_enabled
  const isE2EEnabled = e2eSetting === true || e2eSetting === 1 || e2eSetting === '1' || e2eSetting === 'true'
  const { isInitialized: isE2EInitialized, hasKeys: hasE2EKeys } = useE2EEncryption()

  const ensureE2EReady = (): boolean => {
    if (!isE2EEnabled) return true

    if (!isE2EInitialized) {
      alert('Encryption is initializing. Please wait a moment and try again.')
      return false
    }

    if (!hasE2EKeys) {
      alert('Your encryption keys are not set up. Please refresh the page to initialize encryption.')
      return false
    }

    return true
  }

  const isGroupMember = useMemo(() => {
    if (selectedUser?.chat_type !== ChatType.group) return true
    const members = data?.members || []
    return members.some((m) => m.id === currentUser?.id)
  }, [data?.members, currentUser?.id, selectedUser?.chat_type])

  const canSendToGroup = useMemo(() => {
    if (selectedUser?.chat_type !== ChatType.group) return true
    if (!isGroupMember) return false
    const allow = groupInfoData?.group?.setting?.allow_send_message || 'everyone'
    const myRole = groupInfoData?.group?.myRole || null
    if (allow === 'admin' && myRole !== 'admin') return false
    return true
  }, [
    isGroupMember,
    groupInfoData?.group?.myRole,
    groupInfoData?.group?.setting?.allow_send_message,
    selectedUser?.chat_type,
  ])

  const handleFilesSelected = useCallback((files: File[]) => {
    setSelectedFiles((prev) => [...prev, ...files])
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }, [])

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleClearAllFiles = useCallback(() => {
    setSelectedFiles([])
  }, [])

  const filteredMembers = useMemo(() => {
    if (!isGroupChat || !data?.members) return []

    const allOption = {
      id: -1,
      name: 'All',
      email: '',
      avatar: null,
      group_role: 'all',
    }

    if (!mentionSearchQuery) {
      return [allOption, ...data.members]
    }

    const searchLower = mentionSearchQuery.toLowerCase()
    const matchesAll = 'all'.includes(searchLower)
    const filteredUsers = data.members.filter((member) => member.name.toLowerCase().includes(searchLower))

    return matchesAll ? [allOption, ...filteredUsers] : filteredUsers
  }, [data?.members, mentionSearchQuery, isGroupChat])

  const { data: stickersData, isLoading: isLoadingStickers } = queries.useGetStickers()
  const stickers = stickersData?.stickers.filter((item) => item.status) || []

  const getValidUserId = (user: any): number | undefined => {
    if (!user) return undefined
    return user.id || user.chat_id || user.user_id
  }

  const targetId = useMemo(() => getValidUserId(selectedUser), [selectedUser])
  const groupChatId = useMemo(() => {
    if (!isGroupChat) return undefined
    return selectedUser?.chat_id ?? targetId
  }, [isGroupChat, selectedUser?.chat_id, targetId])

  const messagesQueryKey = useMemo(
    () => [KEYS.MESSAGES, isGroupChat ? 'group' : 'direct', targetId] as const,
    [isGroupChat, targetId],
  )

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastTypingEmitRef = useRef<number>(0)

  useEffect(() => {
    if (editTo) {
      setMessageInput('')
      const decryptContent = async () => {
        const content = editTo.content || ''
        if (!content) {
          setMessageInput('')
          inputRef.current?.focus()
          return
        }
        const isEncryptedFlag =
          editTo.is_encrypted === true ||
          editTo.is_encrypted === 1 ||
          editTo.is_encrypted === 'true' ||
          editTo.is_encrypted === '1'
        let looksEncrypted = false
        try {
          const parsed = JSON.parse(content)
          if (parsed && typeof parsed === 'object') {
            looksEncrypted =
              ('encryptedKey' in parsed && 'iv' in parsed && 'encryptedData' in parsed) ||
              ('sender' in parsed && 'recipient' in parsed) ||
              ('sender' in parsed && 'members' in parsed && typeof parsed.members === 'object')
          }
        } catch {}

        const shouldDecrypt = isEncryptedFlag || looksEncrypted

        if (shouldDecrypt) {
          try {
            const isSent =
              !!currentUser?.id && (editTo.sender?.id === currentUser.id || editTo.sender_id === currentUser.id)
            const decryptedContent = await decryptMessageIfNeeded(
              content,
              true,
              isSent,
              editTo.sender?.id || editTo.sender_id,
              editTo.isForwarded,
              user?.id,
            )
            if (decryptedContent && typeof decryptedContent === 'string' && decryptedContent.length > 0) {
              if (
                decryptedContent.includes('"encryptedKey"') ||
                decryptedContent.includes('"members"') ||
                decryptedContent.includes('"sender"')
              ) {
                console.error('Decrypted content appears to contain encrypted structure - decryption may have failed')
                setMessageInput('[Unable to decrypt message - corrupted content]')
              } else {
                setMessageInput(decryptedContent)
              }
            } else {
              console.error('Decryption returned invalid content:', decryptedContent)
              setMessageInput('[Unable to decrypt message]')
            }
          } catch (error) {
            console.error('Error decrypting message for edit:', error)
            setMessageInput('[Unable to decrypt message]')
          }
        } else {
          setMessageInput(content)
        }

        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }

      decryptContent()
    } else {
      setMessageInput('')
    }
  }, [editTo, currentUser?.id])

  const prevSelectedUserIdRef = useRef<string | number | undefined>(undefined)
  useEffect(() => {
    const currentUserId = selectedUser?.chat_id || selectedUser?.id
    const prevUserId = prevSelectedUserIdRef.current

    if (prevUserId !== undefined && currentUserId !== prevUserId) {
      setMessageInput('')
      setSelectedFiles([])
      setShowMentionDropdown(false)
      setMentionSearchQuery('')
      setMentionStartIndex(null)
      setSelectedMentionIndex(0)
      setMentionedUsers([])
    }
    prevSelectedUserIdRef.current = currentUserId
  }, [selectedUser?.chat_id, selectedUser?.id])

  const stopTyping = useCallback(() => {
    if (!selectedUser || !currentUser || !targetId) return
    if (!typingIndicatorEnabled) return

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }

    if (socket.connected) {
      if (isGroupChat) {
        if (!groupChatId) return
        socket.emit(SOCKET.Emitters.Typing, {
          userId: currentUser.id,
          userName: currentUser.name,
          isTyping: false,
          groupId: groupChatId,
        })
      } else {
        socket.emit(SOCKET.Emitters.Typing, {
          userId: currentUser.id,
          userName: currentUser.name,
          isTyping: false,
          senderId: currentUser.id,
          recipientId: targetId,
        })
      }
    }
  }, [selectedUser, currentUser, isGroupChat, targetId, groupChatId, typingIndicatorEnabled])

  const handleLocationSelected = useCallback(
    async (location: { latitude: number; longitude: number; address: string }) => {
      const currentUserId = currentUser?.id
      const selectedUserId = getValidUserId(selectedUser)

      if (!currentUserId || !selectedUserId) {
        console.error('Current user or selected user is not defined')
        return
      }

      if (!canSendToGroup) {
        return
      }

      if (!ensureE2EReady()) {
        return
      }

      try {
        await sendMessageMutation.mutateAsync({
          recipientId: selectedUser?.isBroadcast || isGroupChat ? undefined : selectedUserId,
          groupId: isGroupChat && !selectedUser?.isBroadcast ? selectedUserId : undefined,
          broadcastId: selectedUser?.isBroadcast ? selectedUserId : undefined,
          content: location.address || 'Location',
          message_type: 'location',
          metadata: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address,
          }),
          parent_id: replyTo?.id,
          is_encrypted: isE2EEnabled ? true : false,
        })

        if (replyTo) {
          dispatch(setReplyMessage(null))
          if (onReplySent) onReplySent()
        }

        queryClient.invalidateQueries({ queryKey: messagesQueryKey })

        setTimeout(() => {
          const element = document.querySelector('.chatappend')
          if (element) {
            element.scrollTop = element.scrollHeight
          }
        }, 100)

        toast.success('Location shared successfully')
      } catch (error) {
        console.error('Failed to send location:', error)
        toast.error('Failed to share location')
      }
    },
    [
      currentUser?.id,
      selectedUser,
      isGroupChat,
      sendMessageMutation,
      replyTo,
      dispatch,
      onReplySent,
      queryClient,
      messagesQueryKey,
      canSendToGroup,
    ],
  )

  const handleTyping = useCallback(() => {
    if (!selectedUser || !currentUser || !targetId || editTo) return
    if (isGroupChat && !groupChatId) return
    if (!typingIndicatorEnabled) return

    const now = Date.now()
    if (now - lastTypingEmitRef.current < 1000) return
    lastTypingEmitRef.current = now

    if (socket.connected) {
      const typingData = isGroupChat
        ? {
            userId: currentUser.id,
            userName: currentUser.name,
            isTyping: true,
            groupId: groupChatId!,
          }
        : {
            userId: currentUser.id,
            userName: currentUser.name,
            isTyping: true,
            senderId: currentUser.id,
            recipientId: targetId,
          }

      socket.emit(SOCKET.Emitters.Typing, typingData)
    } else {
      console.warn('Socket not connected, cannot emit typing event')
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping()
    }, 2000)
  }, [selectedUser, currentUser, isGroupChat, targetId, editTo, stopTyping, groupChatId, typingIndicatorEnabled])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleEmojiSelect = useCallback((emoji: { emoji?: string }) => {
    const emojiChar = emoji?.emoji ?? ''

    setMessageInput((prev) => {
      if (!emojiChar) {
        return prev
      }

      if (!inputRef.current) {
        return `${prev}${emojiChar}`
      }

      const input = inputRef.current
      const selectionStart = input.selectionStart ?? prev.length
      const selectionEnd = input.selectionEnd ?? prev.length
      const newValue = `${prev.slice(0, selectionStart)}${emojiChar}${prev.slice(selectionEnd)}`

      requestAnimationFrame(() => {
        const cursorPosition = selectionStart + emojiChar.length
        input.focus()
        input.setSelectionRange(cursorPosition, cursorPosition)
      })

      return newValue
    })
  }, [])

  const handleEmojiPickerToggle = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setIsComponentVisible(false)
        if (activeSection !== 'emoji') {
          dispatch(toggleVisibility('emoji'))
        }
      } else if (activeSection === 'emoji') {
        dispatch(toggleVisibility('emoji'))
      }
    },
    [activeSection, dispatch, setIsComponentVisible],
  )

  const handleCancelReply = useCallback(() => {
    dispatch(setReplyMessage(null))
    if (onReplySent) onReplySent()
  }, [dispatch, onReplySent])

  const handleCancelEdit = useCallback(() => {
    dispatch(setEditMessage(null))
    setMessageInput('')
    if (onEditSent) onEditSent()
  }, [dispatch, onEditSent])

  const handleRecordClick = useCallback(() => {
    setShowAudioRecorder(true)
    setTimeout(() => {
      const recordButton = document.querySelector('.record-btn') as HTMLButtonElement
      if (recordButton) {
        recordButton.click()
      }
    }, 50)
  }, [])

  const handleInputFocus = useCallback(() => {
    setIsInputFocused(true)
  }, [])

  const handleInputBlur = useCallback(() => {
    setIsInputFocused(false)
  }, [])

  const handleMessagePress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const currentUserId = currentUser?.id
    const selectedUserId = getValidUserId(selectedUser)

    if (!currentUserId || !selectedUserId) {
      console.error('Current user or selected user is not defined')
      return
    }

    if (messageInput.trim().length === 0 && selectedFiles.length === 0) {
      return
    }

    if (!canSendToGroup) {
      return
    }

    const messageContent = messageInput.trim()
    const filesToSend = [...selectedFiles]
    const replyToId = replyTo?.id
    const mentionsToSend = mentionedUsers.length > 0 ? mentionedUsers.map((u) => u.id.toString()) : undefined
    const maxMessageLength = settings?.maximum_message_length || 50000
    if (messageContent && messageContent.length > maxMessageLength) {
      toast.error(`Max ${maxMessageLength} characters allowed`)
      return
    }

    if (isE2EEnabled) {
      if (!isE2EInitialized) {
        toast.error('Encryption is initializing. Please wait a moment and try again.')
        return
      }
      if (!hasE2EKeys) {
        toast.error('Your encryption keys are not set up. Please refresh the page to initialize encryption.')
        return
      }
    }

    let preEncryptedContent: string | null = null
    let preEncryptedFlag: boolean = false
    
    if (filesToSend.length === 0 && isE2EEnabled && messageContent) {
      try {
        const selectedUserId = getValidUserId(selectedUser)
        const isBroadcast = !!selectedUser?.isBroadcast
        const groupMembers = isGroupChat
          ? data?.members
          : isBroadcast
          ? broadcastDetailsData?.broadcast?.recipients
          : undefined
        
        const encryptionResult = await encryptMessageIfNeeded(
          messageContent,
          isGroupChat || isBroadcast ? undefined : selectedUserId,
          isGroupChat || isBroadcast,
          isE2EEnabled,
          groupMembers,
          user?.id,
        )
        preEncryptedContent = encryptionResult.encryptedContent
        preEncryptedFlag = encryptionResult.isEncrypted
      } catch (error) {
        console.error('Error encrypting message before send:', error)
        toast.error('Failed to encrypt message. Please try again.')
        return
      }
    }
    setMessageInput('')
    setSelectedFiles([])
    setMentionedUsers([])
    stopTyping()

    if (replyTo) {
      handleCancelReply()
    }

    setTimeout(() => {
      const element = document.querySelector('.chatappend')
      if (element) {
        element.scrollTop = element.scrollHeight
      }
    }, 0)

    try {
      if (editTo) {
        let contentToSend = messageContent
        let isEncrypted = false

        if (isE2EEnabled) {
          if (!isE2EInitialized || !hasE2EKeys) {
            setMessageInput(messageContent)
            alert('Encryption is not ready. Please wait a moment and try again.')
            return
          }

          try {
            const selectedUserId = getValidUserId(selectedUser)
            const isBroadcast = !!selectedUser?.isBroadcast
            const groupMembers = isGroupChat
              ? data?.members
              : isBroadcast
              ? broadcastDetailsData?.broadcast?.recipients
              : undefined
            const encryptionResult = await encryptMessageIfNeeded(
              contentToSend,
              isGroupChat || isBroadcast ? undefined : selectedUserId,
              isGroupChat || isBroadcast,
              isE2EEnabled,
              groupMembers,
              user?.id,
            )
            contentToSend = encryptionResult.encryptedContent
            isEncrypted = encryptionResult.isEncrypted
          } catch (error) {
            console.error('Error encrypting edited message:', error)
            setMessageInput(messageContent) // Restore on error
            alert('Failed to encrypt message. Please try again.')
            return
          }
        } else {
          contentToSend = messageContent
          isEncrypted = false
        }

        editMessageMutation.mutate(
          {
            messageId: editTo.id,
            content: contentToSend,
            is_encrypted: isEncrypted,
          },
          {
            onSuccess: () => {
              handleCancelEdit()
              queryClient.invalidateQueries({ queryKey: messagesQueryKey })
            },
            onError: (error) => {
              console.error('Failed to edit message:', error)
              setMessageInput(messageContent)
              toast.error('Failed to edit message. Please try again.')
            },
          }
        )
        return
      }

      if (filesToSend.length > 0) {
        const formData = new FormData()

        if (selectedUser?.isBroadcast) {
          formData.append('broadcastId', selectedUserId.toString())
        } else if (isGroupChat) {
          formData.append('groupId', selectedUserId.toString())
        } else {
          formData.append('recipientId', selectedUserId.toString())
        }

        if (messageContent) {
          let contentToSend = messageContent

          if (isE2EEnabled) {
            if (!isE2EInitialized || !hasE2EKeys) {
              setMessageInput(messageContent)
              setSelectedFiles(filesToSend)
              alert('Encryption is not ready. Please wait a moment and try again.')
              return
            }

            try {
              const isBroadcast = !!selectedUser?.isBroadcast
              const groupMembers = isGroupChat
                ? data?.members
                : isBroadcast
                ? broadcastDetailsData?.broadcast?.recipients
                : undefined
              const encryptionResult = await encryptMessageIfNeeded(
                contentToSend,
                isGroupChat || isBroadcast ? undefined : selectedUserId,
                isGroupChat || isBroadcast,
                isE2EEnabled,
                groupMembers,
                user?.id,
              )
              contentToSend = encryptionResult.encryptedContent
            } catch (error) {
              console.error('Error encrypting file message content:', error)
              setMessageInput(messageContent)
              setSelectedFiles(filesToSend)
              alert('Failed to encrypt message content. Please try again.')
              return
            }
          }

          formData.append('content', contentToSend)
        }

        filesToSend.forEach((file) => {
          formData.append('files', file)
        })

        formData.append('message_type', 'file')

        if (isE2EEnabled) {
          formData.append('is_encrypted', 'true')
        } else {
          formData.append('is_encrypted', 'false')
        }

        if (replyToId) {
          formData.append('parent_id', replyToId.toString())
        }

        const mentionsArray = mentionsToSend ? mentionsToSend.map((u) => u) : undefined
        if (mentionsArray) {
          formData.append('mentions', JSON.stringify(mentionsArray))
        }

        sendMessageMutation.mutate(formData as any, {
          onSuccess: (response) => {
            console.log("response:", response)
            queryClient.invalidateQueries({ queryKey: messagesQueryKey })
          },
          onError: (error) => {
            console.error('Failed to send message:', error)
            setMessageInput(messageContent)
            setSelectedFiles(filesToSend)
            toast.error('Failed to send message. Please try again.')
          },
        })
        } else {
        let contentToSend: string
        let isEncrypted: boolean

        if (preEncryptedContent !== null) {
          contentToSend = preEncryptedContent
          isEncrypted = preEncryptedFlag
        } else if (isE2EEnabled) {
          if (!isE2EInitialized || !hasE2EKeys) {
            setMessageInput(messageContent)
            alert('Encryption is not ready. Please wait a moment and try again.')
            return
          }

          try {
            const isBroadcast = !!selectedUser?.isBroadcast
            const groupMembers = isGroupChat
              ? data?.members
              : isBroadcast
              ? broadcastDetailsData?.broadcast?.recipients
              : undefined

            const encryptionResult = await encryptMessageIfNeeded(
              messageContent,
              isGroupChat || isBroadcast ? undefined : selectedUserId,
              isGroupChat || isBroadcast,
              isE2EEnabled,
              groupMembers,
              user?.id,
            )
            contentToSend = encryptionResult.encryptedContent
            isEncrypted = encryptionResult.isEncrypted

            if (isEncrypted && contentToSend === messageContent) {
              throw new Error('Encryption failed: content was not encrypted but isEncrypted is true')
            }

            if (!isEncrypted) {
              throw new Error('E2E is enabled but encryption returned false')
            }
          } catch (error) {
            console.error('Error during encryption process:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to encrypt message'
            setMessageInput(messageContent)
            alert(`Cannot send message: ${errorMessage}. Please ensure encryption keys are set up.`)
            return
          }
        } else {
          contentToSend = messageContent
          isEncrypted = false
        }

        sendMessageMutation.mutate(
          {
            recipientId: selectedUser?.isBroadcast || isGroupChat ? undefined : selectedUserId,
            groupId: isGroupChat && !selectedUser?.isBroadcast ? selectedUserId : undefined,
            broadcastId: selectedUser?.isBroadcast ? selectedUserId : undefined,
            content: contentToSend,
            message_type: 'text',
            parent_id: replyToId,
            mentions: mentionsToSend,
            is_encrypted: isEncrypted,
          },
          {
            onSuccess: (response) => {
              console.log("response:", response)
              queryClient.invalidateQueries({ queryKey: messagesQueryKey })
            },
            onError: (error) => {
              console.error('Failed to send message:', error)
              setMessageInput(messageContent)
              toast.error('Failed to send message. Please try again.')
            },
          }
        )
      }
    } catch (error) {
      console.error('Failed to send/edit message:', error)
      setMessageInput(messageContent)
      if (filesToSend.length > 0) {
        setSelectedFiles(filesToSend)
      }
      toast.error('Failed to send message. Please try again.')
    }
  }

  const selectedStickers = async (stickerUrl: string) => {
    const currentUserId = currentUser?.id
    const selectedUserId = getValidUserId(selectedUser)

    if (!currentUserId || !selectedUserId) {
      console.error('Current user or selected user is not defined')
      return
    }

    // Ensure E2E is ready if enabled
    if (!ensureE2EReady()) {
      return
    }

    try {
      await sendMessageMutation.mutateAsync({
        recipientId: selectedUser?.isBroadcast || isGroupChat ? undefined : selectedUserId,
        groupId: isGroupChat && !selectedUser?.isBroadcast ? selectedUserId : undefined,
        broadcastId: selectedUser?.isBroadcast ? selectedUserId : undefined,
        content: 'Sticker',
        message_type: 'sticker',
        file_url: stickerUrl,
        parent_id: replyTo?.id,
        is_encrypted: isE2EEnabled ? true : false,
      })

      stopTyping()
      dispatch(toggleVisibility('sticker'))
      if (replyTo) {
        handleCancelReply()
      }

      queryClient.invalidateQueries({ queryKey: messagesQueryKey })

      setTimeout(() => {
        const element = document.querySelector('.chatappend')
        if (element) {
          element.scrollTop = element.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Failed to send sticker:', error)
    }
  }

  const handleDirectAudioSend = useCallback(
    async (audioFile: File) => {
      const currentUserId = currentUser?.id
      const selectedUserId = getValidUserId(selectedUser)

      if (!currentUserId || !selectedUserId) {
        console.error('Current user or selected user is not defined')
        return
      }

      // Ensure E2E is ready if enabled
      if (!ensureE2EReady()) {
        return
      }

      const formData = new FormData()
      if (selectedUser?.isBroadcast) {
        formData.append('broadcastId', selectedUserId.toString())
      } else if (isGroupChat) {
        formData.append('groupId', selectedUserId.toString())
      } else {
        formData.append('recipientId', selectedUserId.toString())
      }
      formData.append('content', 'Audio message')
      formData.append('message_type', 'audio')
      formData.append('files', audioFile)

      if (isE2EEnabled) {
        formData.append('is_encrypted', 'true')
      } else {
        formData.append('is_encrypted', 'false')
      }

      if (replyTo?.id) {
        formData.append('parent_id', replyTo.id.toString())
      }

      try {
        await sendMessageMutation.mutateAsync(formData as any)

        if (replyTo) {
          handleCancelReply()
        }

        queryClient.invalidateQueries({ queryKey: messagesQueryKey })

        setTimeout(() => {
          const element = document.querySelector('.chatappend')
          if (element) {
            element.scrollTop = element.scrollHeight
          }
        }, 100)

        setShowAudioRecorder(false)
        setMessageInput('')
      } catch (error) {
        console.error('Failed to send audio:', error)
      }
    },
    [
      currentUser?.id,
      isGroupChat,
      messagesQueryKey,
      queryClient,
      selectedUser,
      sendMessageMutation,
      replyTo,
      handleCancelReply,
    ],
  )

  const handleAudioCancel = useCallback(() => {
    setShowAudioRecorder(false)
    setTimeout(() => {
      const input = document.querySelector('.setemoj') as HTMLInputElement
      if (input) {
        input.focus()
      }
    }, 100)
  }, [])

  const handleMentionSelect = useCallback(
    (member: any) => {
      if (mentionStartIndex === null) return

      const beforeMention = messageInput.slice(0, mentionStartIndex)
      const afterMention = messageInput.slice(mentionStartIndex + mentionSearchQuery.length + 1)
      const mentionText = member.id === -1 ? '@All' : `@${member.name}`
      const newValue = `${beforeMention}${mentionText} ${afterMention}`

      setMessageInput(newValue)
      setShowMentionDropdown(false)
      setMentionSearchQuery('')
      setMentionStartIndex(null)

      setMentionedUsers((prev) => {
        if (member.id === -1) {
          const allMemberIds =
            data?.members.map((m) => ({
              id: m.id,
              name: m.name,
              isAll: true,
            })) || []
          return allMemberIds
        } else {
          const exists = prev.find((u) => u.id === member.id)
          if (!exists) {
            return [...prev.filter((u) => !u.isAll), { id: member.id, name: member.name, isAll: false }]
          }
          return prev
        }
      })

      setTimeout(() => {
        inputRef.current?.focus()
        const cursorPos = beforeMention.length + mentionText.length + 1
        inputRef.current?.setSelectionRange(cursorPos, cursorPos)
      }, 0)
    },
    [messageInput, mentionStartIndex, mentionSearchQuery, data?.members],
  )

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const cursorPosition = e.target.selectionStart || 0

    setMessageInput(value)
    handleTyping()

    if (isGroupChat) {
      const textBeforeCursor = value.slice(0, cursorPosition)
      const lastAtIndex = textBeforeCursor.lastIndexOf('@')

      if (lastAtIndex !== -1) {
        const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' '
        const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)

        if ((lastAtIndex === 0 || charBeforeAt === ' ' || charBeforeAt === '\n') && !textAfterAt.includes(' ')) {
          setMentionStartIndex(lastAtIndex)
          setMentionSearchQuery(textAfterAt)
          setShowMentionDropdown(true)
          setSelectedMentionIndex(0)
        } else {
          setShowMentionDropdown(false)
        }
      } else {
        setShowMentionDropdown(false)
      }
    }
  }

  const getReplyLabel = () => {
    if (!replyTo) return ''
    const isSelf = replyTo.sender?.id === currentUser?.id
    const name = replyTo.sender?.name || t('unknown')
    return isSelf ? t('replying_to_yourself') : t('replying_to', { name })
  }

  const allMessages = selectedChatMessages.flatMap((dg: any) => dg.messages || [])
  const selectedMessagesData = getSelectedMessagesData(allMessages)

  const handleBulkStar = async () => {
    const selectedIds = Array.from(selectedMessages)
    if (selectedIds.length === 0) return

    try {
      const allStarred = selectedMessagesData.every((msg) => msg.isStarred)

      await starMessageMutation.mutateAsync({
        messageId: selectedIds.map((id) => id),
        isStarred: !allStarred,
      })

      toast.success(allStarred ? 'Messages unstarred' : 'Messages starred')
      queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES], exact: false })
      clearSelection()
    } catch (error) {
      console.error('Failed to update star status:', error)
      toast.error('Failed to update star status')
    }
  }

  const handleDelete = () => {
    const selectedIds = Array.from(selectedMessages)
    if (selectedIds.length === 0) return

    const selectedMessagesData = getSelectedMessagesData(allMessages)
    const allSentByCurrentUser = selectedMessagesData.some((msg) => msg.sender?.id === currentUser?.id)
    setIsSent(allSentByCurrentUser)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async (deleteType: 'delete-for-me' | 'delete-for-everyone') => {
    const selectedIds = Array.from(selectedMessages)
    if (!selectedIds.length || !selectedUser) return

    const queryKey = isGroupChat
      ? [KEYS.MESSAGES, 'group', selectedUser.chat_id]
      : [KEYS.MESSAGES, 'direct', selectedUser.chat_id]

    queryClient.setQueryData(queryKey, (oldData: any) => {
      if (!oldData) return oldData

      const updateMessagesRecursive = (items: any[]): any[] => {
        return items
          .map((item: any) => {
            if (selectedIds.includes(item.id) && item.sender_id !== undefined) {
              if (deleteType === 'delete-for-me') {
                return null
              } else {
                return {
                  ...item,
                  isDeleted: true,
                  isDeletedForEveryone: true,
                  content: 'This message was deleted',
                  file_url: null,
                  attachments: [],
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
        messageIds: selectedIds.map((id) => id),
        deleteType: deleteType,
        isBroadcast: selectedUser.isBroadcast ? true : undefined,
        broadcastId: selectedUser.isBroadcast ? selectedUser.chat_id : undefined,
      })

      clearSelection()
      setDeleteModalOpen(false)
      queryClient.invalidateQueries({ queryKey })

      toast.success(`Deleted ${selectedIds.length} message${selectedIds.length > 1 ? 's' : ''}`)
    } catch (error) {
      console.error('Failed to delete messages:', error)
      queryClient.invalidateQueries({ queryKey })
      toast.error('Failed to delete messages')
    }
  }

  const handleCancelDelete = () => {
    setDeleteModalOpen(false)
  }

  const handleForward = () => {
    const selectedIds = Array.from(selectedMessages)
    if (selectedIds.length === 0) return

    const selectedMessagesData = getSelectedMessagesData(allMessages)
    if (selectedMessagesData.length > 0) {
      setMessageToForward(selectedMessagesData[0])
    }
    setForwardModalOpen(true)
  }

  const handleForwardConfirm = async (recipients: Array<{ type: 'user' | 'group'; id: number | string }>) => {
    const selectedIds = Array.from(selectedMessages)
    if (selectedIds.length === 0 || !recipients.length) return

    const toastId = toast.loading(`Forwarding ${selectedIds.length} message${selectedIds.length > 1 ? 's' : ''}...`)

    try {
      let encryptedContents: Record<string, Record<string, string>> | undefined = undefined

      const allMessages = selectedChatMessages.flatMap((dg: any) => dg.messages || [])
      const selectedMessagesData = getSelectedMessagesData(allMessages)

      for (const message of selectedMessagesData) {
        const messageId = message.id
        const isEncrypted =
          message.is_encrypted === true ||
          message.is_encrypted === 1 ||
          message.is_encrypted === 'true' ||
          message.is_encrypted === '1'

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
              user?.id,
            )

            if (!encryptedContents) {
              encryptedContents = {}
            }
            encryptedContents[String(messageId)] = {}

            for (const rec of recipients) {
              if (!rec?.type || !rec.id) continue

              const isGroup = rec.type === 'group'
              const recipientId = isGroup ? undefined : rec.id

              try {
                let contentToSend = decryptedContent

                if (isE2EEnabled) {
                  if (!isE2EInitialized || !hasE2EKeys) {
                    toast.dismiss(toastId)
                    alert('Encryption is not ready. Please wait a moment and try again.')
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
                    user?.id,
                  )
                  contentToSend = encryptionResult.encryptedContent
                }
                const key = isGroup ? `group_${rec.id}` : `user_${rec.id}`
                encryptedContents[messageId][key] = contentToSend
              } catch (encryptError) {
                console.error(`Failed to process content for recipient ${rec.id}:`, encryptError)
              }
            }
          } catch (decryptError) {
            console.error(`Failed to decrypt message ${messageId}:`, decryptError)
          }
        }
      }

      const response = await forwardMessagesMutation.mutateAsync({
        messageIds: selectedIds.map((id) => id),
        recipients,
        encryptedContents,
      })

      if (response?.messages && selectedUser && currentUser?.id) {
        const currentUserId = currentUser.id
        const selectedChatId = selectedUser.chat_id
        const isGroupChat = selectedUser.chat_type === 'group'

        response.messages.forEach((message) => {
          let belongsToCurrentChat = false

          if (isGroupChat) {
            belongsToCurrentChat = !!(message.group_id && message.group_id == selectedChatId)
          } else {
            const otherUserId = message.sender_id == currentUserId ? message.recipient_id : message.sender_id
            belongsToCurrentChat = !!(otherUserId && otherUserId == selectedChatId)
          }

          if (belongsToCurrentChat) {
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

      clearSelection()
      setForwardModalOpen(false)
      setMessageToForward(null)

      // Only invalidate queries for other chats, not the current one since we've already updated it
      queryClient.invalidateQueries({ queryKey: [KEYS.MESSAGES], exact: false })
      queryClient.invalidateQueries({ queryKey: [KEYS.RECENT_CHATS] })

      toast.dismiss(toastId)
      toast.success(
        `Forwarded ${selectedIds.length} message${selectedIds.length > 1 ? 's' : ''} to ${recipients.length} recipient${
          recipients.length > 1 ? 's' : ''
        }`,
      )
    } catch (error) {
      console.error('Failed to forward messages:', error)
      toast.dismiss(toastId)
      toast.error('Failed to forward messages')
    }
  }

  const shouldShowVoiceIcon = !editTo && !messageInput && !isInputFocused && selectedFiles.length === 0

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = e.currentTarget as HTMLInputElement | HTMLTextAreaElement

      if (showMentionDropdown && filteredMembers.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedMentionIndex((prev) => (prev < filteredMembers.length - 1 ? prev + 1 : prev))
          return
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedMentionIndex((prev) => (prev > 0 ? prev - 1 : 0))
          return
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleMentionSelect(filteredMembers[selectedMentionIndex])
          return
        } else if (e.key === 'Escape') {
          setShowMentionDropdown(false)
          return
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        const form = target.closest('form')
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
          form.dispatchEvent(submitEvent)
        }
      }
    },
    [showMentionDropdown, filteredMembers, selectedMentionIndex, handleMentionSelect],
  )

  if (!selectedUser) {
    return null
  }

  if (showAudioRecorder) {
    return (
      <div className="message-input">
        <AudioRecorder
          onDirectSend={handleDirectAudioSend}
          onCancel={handleAudioCancel}
          disabled={sendMessageMutation.isPending}
          autoStart={true}
        />
      </div>
    )
  }

  return (
    <>
      {isSelectionMode ? (
        <div className="select-info">
          <MessageSelectionActions
            selectedCount={selectedMessages.size}
            onClear={clearSelection}
            onDelete={handleDelete}
            onForward={handleForward}
            onStar={handleBulkStar}
            selectedMessages={selectedMessagesData}
            allMessages={allMessages}
          />
        </div>
      ) : !isGroupMember && selectedUser?.chat_type === ChatType.group ? (
        <div className="admin-only-message-bar">
          You can't send messages to this group because you're no longer a participant.
        </div>
      ) : Boolean(selectedUser?.isBlocked) ? (
        <div className="blocked-chat-wrapper alert alert-warning text-center mb-0">
          <strong className="d-block mb-1">
            You blocked this {selectedUser?.chat_type === 'group' ? 'Group' : 'User'}
          </strong>
          <span>Unblock them from chat actions to resume messaging.</span>
        </div>
      ) : selectedUser?.isAnnouncement ? (
        <div className="admin-only-message-bar">{t('only_admin_can_send')}</div>
      ) : !canSendToGroup ? (
        <div className="admin-only-message-bar">{t('only_admin_can_send')}</div>
      ) : (
        <div className="message-input">
          {(replyTo || editTo) && (
            <div className="reply-edit-preview">
              <div className="preview-content">
                <div className="preview-header">
                  <span className="preview-label">{editTo ? t('editing_message') : getReplyLabel()}</span>
                  <div className="preview-text">
                    {editTo ? (
                      <DecryptedMessage message={editTo}>
                        {(decryptedContent) => <span className="reply-preview-text">{decryptedContent}</span>}
                      </DecryptedMessage>
                    ) : (
                      <DecryptedMessage message={replyTo!}>
                        {(decryptedContent) => <span className="reply-preview-text">{decryptedContent}</span>}
                      </DecryptedMessage>
                    )}
                  </div>
                </div>
                <button className="preview-close" onClick={editTo ? handleCancelEdit : handleCancelReply} type="button">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className="file-previews-container border-top p-2 bg-light">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-medium d-flex">
                  <Paperclip size={16} className="me-1" />
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleClearAllFiles}
                  className="btn btn-sm btn-link text-danger p-0 border-0 bg-transparent"
                  type="button"
                >
                  <X size={16} className="me-1" />
                </button>
              </div>
              <div className="file-previews-container-content d-flex flex-row gap-2 custom-scrollbar">
                {selectedFiles.map((file, index) => (
                  <FilePreview key={`${file.name}-${index}`} file={file} onRemove={() => handleRemoveFile(index)} />
                ))}
              </div>
            </div>
          )}

          <Form className="wrap emojis-main" onSubmit={handleMessagePress}>
            <ContactPoll
              isEmojisVisible={isComponentVisible}
              setIsEmojisVisible={setIsComponentVisible}
              onEmojiSelect={handleEmojiSelect}
              onEmojiPickerToggle={handleEmojiPickerToggle}
              onFilesSelected={handleFilesSelected}
              onLocationSelected={handleLocationSelected}
              innerRef={inputRef}
            />
            <Input
              className="setemoj custom-scrollbar"
              type="textarea"
              placeholder={editTo ? t('edit_your_message') : replyTo ? t('reply_placeholder') : t('write_your_message')}
              value={messageInput}
              onChange={onChangeHandler}
              onKeyDown={handleInputKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              disabled={false}
              innerRef={inputRef}
              rows={1}
            />
            {shouldShowVoiceIcon && (
              <a
                className="icon-btn btn-outline-primary button-effect"
                onClick={(e) => {
                  e.preventDefault()
                  handleRecordClick()
                }}
              >
                <SvgIcon iconId="voice" />
              </a>
            )}
            {!shouldShowVoiceIcon && (
              <Button
                type="submit"
                color="primary"
                className="icon-btn p-0"
                disabled={
                  (messageInput.trim().length === 0 && selectedFiles.length === 0) ||
                  !selectedUser
                }
                onClick={(e) => {
                  e.preventDefault()
                  const form = e.currentTarget.closest('form') as HTMLFormElement
                  if (form) {
                    form.requestSubmit()
                  }
                }}
              >
                <SvgIcon iconId="send" />
              </Button>
            )}
            <div
              ref={ref}
              className={`emojis-contain custom-scroll ${
                activeSection === 'emoji' && isComponentVisible ? 'open' : ''
              }`}
            ></div>
            <div
              ref={ref}
              className={`sticker-contain ${activeSection === 'sticker' && isComponentVisible ? 'open' : ''}`}
            >
              <div className="sticker-sub-contain custom-scroll">
                {isLoadingStickers ? (
                  <div className="text-center p-4">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading stickers...</span>
                    </div>
                  </div>
                ) : stickers.length === 0 ? (
                  <div className="text-center p-4 text-muted">
                    <p>No stickers available</p>
                  </div>
                ) : (
                  <ul>
                    {stickers.map((sticker) => {
                      if (!sticker.sticker) return
                      return (
                        <li key={sticker.id}>
                          <a
                            onClick={(e) => {
                              e.preventDefault()
                              selectedStickers(sticker.sticker)
                            }}
                            title={sticker.title}
                          >
                            <Image className="img-fluid" src={ImageBaseUrl + sticker.sticker} alt={sticker.title} />
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
            {showMentionDropdown && isGroupChat && filteredMembers.length > 0 && (
              <div className="mention-dropdown">
                <ul className="mention-list">
                  {filteredMembers.map((member, index) => (
                    <li
                      key={member.id}
                      className={`mention-item ${index === selectedMentionIndex ? 'selected' : ''}`}
                      onClick={() => handleMentionSelect(member)}
                      onMouseEnter={() => setSelectedMentionIndex(index)}
                    >
                      <div className="mention-avatar">
                        {member.id === -1 ? (
                          <div className="avatar-placeholder">@</div>
                        ) : member.avatar ? (
                          <Image src={ImageBaseUrl + member.avatar} alt={member.name} />
                        ) : (
                          <div className="avatar-placeholder">{member.name.charAt(0).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="mention-info">
                        <div className="mention-name">{member.id === -1 ? 'All' : member.name}</div>
                        <div className="mention-role">{member.id === -1 ? 'Mention everyone' : member.group_role}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Form>
        </div>
      )}
      <DeleteMessageModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        isGroupChat={isGroupChat}
        onConfirm={handleConfirmDelete}
        selectedCount={selectedMessages.size}
        canDeleteForEveryone={isSent}
      />
      <ForwardMessageModal
        isOpen={forwardModalOpen}
        message={messageToForward}
        onClose={() => {
          setForwardModalOpen(false)
          setMessageToForward(null)
        }}
        onForward={handleForwardConfirm}
        isLoading={forwardMessagesMutation.isPending}
      />
    </>
  )
}

export default MessageInput
