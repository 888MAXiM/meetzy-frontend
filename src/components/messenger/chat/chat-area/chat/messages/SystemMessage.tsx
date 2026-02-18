import { FC, memo, useEffect, useMemo, useState } from 'react'
import { queries } from '../../../../../../api'
import { SystemMessageProps } from '../../../../../../types/components/chat'

const systemMessageGroupStates = new Map<string, boolean>()

const SystemMessage: FC<SystemMessageProps> = memo(
  ({ message, consecutiveSystemMessages, isGrouped = false, currentMessageIndex = 0 }) => {
    const [showAll, setShowAll] = useState(false)
    const { data: currentUserData } = queries.useGetUserDetails()
    const currentUser = currentUserData?.user
    const displayContent = useMemo(() => {
      if (!message.content || !currentUser?.id) {
        return message.content
      }

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
          
          if (systemAction === 'member_left' && metadata.user_id === currentUser.id) {
            return 'You left the group'
          }
          else if (systemAction === 'group_created' && metadata.creator_user_id === currentUser.id) {
            return 'You created this group.'
          }
        }
      }

      const senderId = message.sender_id || message.sender?.id
      if (senderId === currentUser.id) {
        const userName = message.sender?.name || currentUser.name || ''
        if (userName) {
          return message.content.replace(new RegExp(userName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), 'You')
        }
      }

      return message.content
    }, [message.content, message.message_type, message.metadata, message.sender_id, message.sender?.id, message.sender?.name, currentUser?.id, currentUser?.name])

    const groupId =
      consecutiveSystemMessages && consecutiveSystemMessages.length > 0
        ? `group-${consecutiveSystemMessages[0].id}`
        : `single-${message.id}`

    useEffect(() => {
      if (isGrouped && consecutiveSystemMessages) {
        const currentState = systemMessageGroupStates.get(groupId) ?? false
        setShowAll(currentState)
      }
    }, [groupId, isGrouped, consecutiveSystemMessages])

    const handleToggle = () => {
      const newShowAll = !showAll
      setShowAll(newShowAll)
      systemMessageGroupStates.set(groupId, newShowAll)

      window.dispatchEvent(
        new CustomEvent(`systemMessageToggle-${groupId}`, {
          detail: { showAll: newShowAll },
        }),
      )
    }

    useEffect(() => {
      if (isGrouped && consecutiveSystemMessages && consecutiveSystemMessages.length > 1) {
        const handleGroupToggle = (event: CustomEvent) => {
          setShowAll(event.detail.showAll)
        }

        window.addEventListener(`systemMessageToggle-${groupId}`, handleGroupToggle as EventListener)
        return () => {
          window.removeEventListener(`systemMessageToggle-${groupId}`, handleGroupToggle as EventListener)
        }
      }
    }, [groupId, isGrouped, consecutiveSystemMessages])

    if (isGrouped && consecutiveSystemMessages && consecutiveSystemMessages.length > 1) {
      const isLastMessage = currentMessageIndex === consecutiveSystemMessages.length - 1
      const shouldShowMessage = showAll || isLastMessage

      if (!shouldShowMessage) {
        return null
      }

      return (
        <div className="system-message-group text-center">
          <div className="system-message">{displayContent}</div>

          {isLastMessage && (
            <button className="system-message-toggle-btn" onClick={handleToggle}>
              {showAll ? 'Hide All' : `View All (${consecutiveSystemMessages.length})`}
            </button>
          )}
        </div>
      )
    }

    return <div className="system-message text-center">{displayContent}</div>
  },
)

SystemMessage.displayName = 'SystemMessage'

export default SystemMessage
