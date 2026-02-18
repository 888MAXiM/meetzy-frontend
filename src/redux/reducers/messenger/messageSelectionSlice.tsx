import { createSlice } from '@reduxjs/toolkit'

interface MessageSelectionState {
  selectedMessages: string[]
  isSelectionMode: boolean
}

const initialState: MessageSelectionState = {
  selectedMessages: [],
  isSelectionMode: false,
}

const messageSelectionSlice = createSlice({
  name: 'messageSelection',
  initialState,
  reducers: {
    toggleMessageSelection: (state, action) => {
      const messageId = action.payload
      const index = state.selectedMessages.indexOf(messageId)

      if (index > -1) {
        state.selectedMessages.splice(index, 1)
        if (state.selectedMessages.length === 0) {
          state.isSelectionMode = false
        }
      } else {
        state.selectedMessages.push(messageId)
        state.isSelectionMode = true
      }
    },

    selectMessage: (state, action) => {
      const messageId = action.payload
      if (!state.selectedMessages.includes(messageId)) {
        state.selectedMessages.push(messageId)
        state.isSelectionMode = true
      }
    },

    enterSelectionMode: (state, action) => {
      state.isSelectionMode = true
      state.selectedMessages = [action.payload]
    },

    clearSelection: (state) => {
      state.selectedMessages = []
      state.isSelectionMode = false
    },

    exitSelectionMode: (state) => {
      state.isSelectionMode = false
      state.selectedMessages = []
    },
    resetMessageSelection: () => initialState,
    enterEmptySelectionModes: (state) => {
      state.isSelectionMode = true
      state.selectedMessages = []
    },
    selectAllMessages: (state, action) => {
      const messageIds = action.payload
      state.selectedMessages = messageIds.map((id: string | number) => String(id))
      state.isSelectionMode = messageIds.length > 0
    },
  },
})

export const {
  toggleMessageSelection,
  selectMessage,
  enterSelectionMode,
  clearSelection,
  exitSelectionMode,
  resetMessageSelection,
  enterEmptySelectionModes,
  selectAllMessages,
} = messageSelectionSlice.actions

export default messageSelectionSlice.reducer
