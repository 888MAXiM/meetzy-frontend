import { createSlice } from '@reduxjs/toolkit'
import { UserSetting } from '../../types/api'

interface UserSettingState {
  userSetting: UserSetting | null
  chatPinVerified: string | null
}

const initialState: UserSettingState = {
  userSetting: null,
  chatPinVerified: null,
}

const userSettingSlice = createSlice({
  name: 'userSetting',
  initialState,
  reducers: {
    setUserSetting: (state, action) => {
      state.userSetting = action.payload
    },
    setChatPinVerified: (state, action) => {
      state.chatPinVerified = action.payload
    },
  },
})

export const { setUserSetting, setChatPinVerified } = userSettingSlice.actions

export default userSettingSlice.reducer
