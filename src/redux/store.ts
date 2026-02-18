import { configureStore } from '@reduxjs/toolkit'
import authSlice from './reducers/authSlice'
import loaderSlice from './reducers/loaderSlice'
import mainSidebarSlice from './reducers/messenger/mainSidebarSlice'
import messengerSlice from './reducers/messenger/messengerSlice'
import templateCustomizerSlice from './reducers/templateCustomizerSlice'
import chatSlice from './reducers/messenger/chatSlice'
import screenSlice from './reducers/messenger/screenSlice'
import userStatusSlice from './reducers/messenger/userStatusSlice'
import statusSlice from './reducers/messenger/statusSlice'
import settingSlice from './reducers/settingSlice'
import userSettingSlice from './reducers/userSettingSlice'
import messageSelectionSlice from './reducers/messenger/messageSelectionSlice'

const Store = configureStore({
  reducer: {
    auth: authSlice,
    loader: loaderSlice,
    mainSidebar: mainSidebarSlice,
    messenger: messengerSlice,
    templateCustomizer: templateCustomizerSlice,
    chat: chatSlice,
    screen: screenSlice,
    userStatus: userStatusSlice,
    status: statusSlice,
    settings: settingSlice,
    userSettings: userSettingSlice,
    messageSelection: messageSelectionSlice,
  },
})

export default Store

export type RootState = ReturnType<typeof Store.getState>
export type AppDispatch = typeof Store.dispatch
