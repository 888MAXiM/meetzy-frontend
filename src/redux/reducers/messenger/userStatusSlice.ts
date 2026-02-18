import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { UserAvailabilityStatus } from '../../../constants'

export interface UserStatus {
  userId: number
  status: 'online' | 'offline' | string
  lastSeen: string | null | undefined
}

export interface UserStatusss {
  status: UserAvailabilityStatus.Online | UserAvailabilityStatus.Offline | UserAvailabilityStatus.Away | string
  lastSeen?: string | null
}

interface UserStatusState {
  userStatuses: Record<number | string, UserStatus>
}

const initialState: UserStatusState = {
  userStatuses: {},
}

const userStatusSlice = createSlice({
  name: 'userStatus',
  initialState,
  reducers: {
    updateUserStatus: (state, action: PayloadAction<UserStatus>) => {
      const { userId, status, lastSeen } = action.payload
      state.userStatuses[userId] = {
        userId,
        status,
        lastSeen,
      }
    },
    updateBulkUserStatuses: (state, action: PayloadAction<UserStatus[]>) => {
      action.payload.forEach((userStatus) => {
        const { userId, status, lastSeen } = userStatus
        state.userStatuses[userId] = {
          userId,
          status,
          lastSeen,
        }
      })
    },
    clearUserStatuses: (state) => {
      state.userStatuses = {}
    },
  },
})

export const { updateUserStatus, updateBulkUserStatuses, clearUserStatuses } = userStatusSlice.actions
export default userStatusSlice.reducer
