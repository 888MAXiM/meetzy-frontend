import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { STORAGE_KEYS } from '../../../constants/storageKeys'
import { getStorage } from '../../../utils'
import { UserStatusss } from './userStatusSlice'

export type Screen =
  | 'chat'
  | 'call'
  | 'favorites'
  | 'documents'
  | 'friends'
  | 'archive'
  | 'blocked-users'
  | 'status'
  | 'notifications'
  | 'settings'

interface ScreenState {
  screen: Screen | null
  userStatus: Record<string, UserStatusss>
}

const storage = getStorage()
const savedScreen = storage.getItem(STORAGE_KEYS.CURRENT_SCREEN) as Screen | null

const initialState: ScreenState = {
  screen: savedScreen || null,
  userStatus: {},
}

const screenSlice = createSlice({
  name: 'screen',
  initialState,
  reducers: {
    updateUserStatus: (state, action: PayloadAction<{ userId: string; status: string; lastSeen?: string }>) => {
      const { userId, status, lastSeen } = action.payload
      state.userStatus[userId] = { status, lastSeen }
    },
    setScreen: (state, action: PayloadAction<Screen>) => {
      state.screen = action.payload
      storage.setItem(STORAGE_KEYS.CURRENT_SCREEN, action.payload)
    },
    clearScreen: (state) => {
      state.screen = 'chat'
      storage.removeItem(STORAGE_KEYS.CURRENT_SCREEN)
    },
  },
})

export const { updateUserStatus, setScreen, clearScreen } = screenSlice.actions
export default screenSlice.reducer
