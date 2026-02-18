import { useCallback } from 'react'
import {
  toggleMessageSelection as toggleMessageSelectionAction,
  selectMessage as selectMessageAction,
  enterSelectionMode as enterSelectionModeAction,
  clearSelection as clearSelectionAction,
  exitSelectionMode as exitSelectionModeAction,
  enterEmptySelectionModes as enterEmptySelectionModesAction, // Fixed import name
  selectAllMessages as selectAllMessagesAction,
} from '../../../../../../redux/reducers/messenger/messageSelectionSlice'
import { useAppDispatch, useAppSelector } from '../../../../../../redux/hooks'
import { Message } from '../../../../../../types/api'

export const useMessageSelection = () => {
  const dispatch = useAppDispatch()
  const { selectedMessages, isSelectionMode } = useAppSelector((state) => state.messageSelection)

  const toggleMessageSelection = useCallback(
    (messageId: string) => {
      dispatch(toggleMessageSelectionAction(messageId))
    },
    [dispatch],
  )

  const selectMessage = useCallback(
    (messageId: string) => {
      dispatch(selectMessageAction(messageId))
    },
    [dispatch],
  )

  const enterSelectionMode = useCallback(
    (messageId: string) => {
      dispatch(enterSelectionModeAction(messageId))
    },
    [dispatch],
  )

  const clearSelection = useCallback(() => {
    dispatch(clearSelectionAction())
  }, [dispatch])

  const exitSelectionMode = useCallback(() => {
    dispatch(exitSelectionModeAction())
  }, [dispatch])

  const enterEmptySelectionMode = useCallback(() => {
    dispatch(enterEmptySelectionModesAction()) // Fixed: using the action
  }, [dispatch])

  const getSelectedMessagesData = useCallback(
    (allMessages: Message[]) => {
      return allMessages.filter((msg) => selectedMessages.includes(String(msg.id)))
    },
    [selectedMessages],
  )

  const selectAllMessages = useCallback(
    (messageIds: (string | number)[]) => {
      dispatch(selectAllMessagesAction(messageIds))
    },
    [dispatch],
  )

  return {
    selectedMessages: new Set(selectedMessages),
    isSelectionMode,
    toggleMessageSelection,
    selectMessage,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    enterEmptySelectionMode,
    getSelectedMessagesData,
    selectAllMessages,
  }
}
