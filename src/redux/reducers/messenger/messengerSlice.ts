import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { chatContactSettingListData } from '../../../data/messenger'
import type { ContactUser, MessengerState } from '../../../types/store'
import Config from '../../../utils/config'

const initialState: MessengerState = {
  newModal: Array(chatContactSettingListData.length).fill(false),
  messengerActiveTab: 'chat',
  subChatActiveTab: 'direct',
  subRecentActiveTab: 'all',
  mobileMenu: false,
  toggleSmallSide: false,
  activeSection: null,
  videoCall: false,
  audioCall: false,
  activeContactUser: [],
  selectedContact: null,
  profileToggle: false,
  sidebarToggle: true,
  profileSidebarWidth: 0,
  globalSearchTerm: '',
}

const MessengerSlice = createSlice({
  name: 'MessengerSlice',
  initialState,
  reducers: {
    setNewModal: (state, action: PayloadAction<number>) => {
      state.newModal = state.newModal.map((item, i) => (i === action.payload ? !item : item))
    },
    setMessengerActiveTab: (state, action: PayloadAction<string>) => {
      state.messengerActiveTab = action.payload
    },
    setSubChatActiveTab: (state, action: PayloadAction<string>) => {
      state.subChatActiveTab = action.payload
    },
    setSubRecentActiveTab: (state, action: PayloadAction<string>) => {
      state.subRecentActiveTab = action.payload
    },
    toggleVisibility: (state, action: PayloadAction<string>) => {
      state.activeSection = state.activeSection === action.payload ? null : action.payload
    },
    setMobileMenu: (state, action: PayloadAction<boolean | undefined>) => {
      state.mobileMenu = typeof action.payload === 'boolean' ? action.payload : !state.mobileMenu
    },
    setToggleSmallSide: (state, action: PayloadAction<boolean>) => {
      state.toggleSmallSide = action.payload
    },
    setVideoCall: (state) => {
      state.videoCall = !state.videoCall
    },
    setAudioCall: (state) => {
      state.audioCall = !state.audioCall
    },
    setActiveContactUser: (state, action: PayloadAction<number>) => {
      state.activeContactUser = state.activeContactUser.map((item) =>
        item.id === action.payload ? { ...item, active: true } : { ...item, active: false },
      )
      const selected = state.activeContactUser.find((item) => item.id === action.payload)
      state.selectedContact = selected || null
    },
    setContactUsers: (state, action: PayloadAction<ContactUser[]>) => {
      state.activeContactUser = action.payload.map((contact, index) => ({
        ...contact,
        active: index === 0,
      }))
      if (action.payload.length > 0) {
        state.selectedContact = { ...action.payload[0], active: true }
      }
    },
    addContactUser: (state, action: PayloadAction<ContactUser>) => {
      const exists = state.activeContactUser.find((c) => c.id === action.payload.id)
      if (!exists) {
        state.activeContactUser.push({ ...action.payload, active: false })
      }
    },
    updateContactUser: (state, action: PayloadAction<ContactUser>) => {
      const index = state.activeContactUser.findIndex((c) => c.id === action.payload.id)
      if (index !== -1) {
        state.activeContactUser[index] = {
          ...state.activeContactUser[index],
          ...action.payload,
        }
        if (state.selectedContact?.id === action.payload.id) {
          state.selectedContact = { ...state.selectedContact, ...action.payload }
        }
      }
    },
    removeContactUser: (state, action: PayloadAction<number>) => {
      state.activeContactUser = state.activeContactUser.filter((c) => c.id !== action.payload)
      if (state.selectedContact?.id === action.payload) {
        state.selectedContact = null
      }
    },
    setSelectedContact: (state, action: PayloadAction<ContactUser | null>) => {
      state.selectedContact = action.payload
      if (action.payload) {
        state.activeContactUser = state.activeContactUser.map((item) =>
          item.id === action?.payload?.id ? { ...item, active: true } : { ...item, active: false },
        )
      }
    },
    setProfileToggle: (state, action: PayloadAction<boolean>) => {
      state.profileToggle = action.payload
    },
    setSidebarToggle: (state, action: PayloadAction<boolean>) => {
      state.sidebarToggle = action.payload
      Config.sidebar_setting = action.payload ? '' : 'no'
    },
    setProfileSidebarWidth: (state, action: PayloadAction<number>) => {
      state.profileSidebarWidth = action.payload
    },
    openCloseSidebar: (state, action: PayloadAction<boolean | undefined>) => {
      state.sidebarToggle = typeof action.payload === 'boolean' ? action.payload : !state.sidebarToggle
      Config.sidebar_setting = state.sidebarToggle ? 'no' : ''
    },
    profileSideBarToggle: (state) => {
      if (state.profileToggle) {
        document.body.classList.remove('menu-active')
        document.querySelector('.meetzy-main')?.classList.add('small-sidebar')
        document.querySelector('.app-sidebar')?.classList.add('active')
      } else {
        document.body.classList.add('menu-active')
        document.querySelector('.meetzy-main')?.classList.remove('small-sidebar')
        document.querySelector('.app-sidebar')?.classList.remove('active')
      }
      if (state.profileSidebarWidth <= 800) {
        if (!state.profileToggle)
          document.querySelector('.sidebar-toggle')?.classList.add('mobile-menu', 'sidebar-overlap')
        else document.querySelector('.sidebar-toggle')?.classList.remove('mobile-menu', 'sidebar-overlap')
      }
      state.profileToggle = !state.profileToggle
    },
    setGlobalSearchTerm: (state, action: PayloadAction<string>) => {
      state.globalSearchTerm = action.payload
    },
  },
})

export const {
  setNewModal,
  setMessengerActiveTab,
  setSubChatActiveTab,
  toggleVisibility,
  setMobileMenu,
  setToggleSmallSide,
  setVideoCall,
  setAudioCall,
  setActiveContactUser,
  setContactUsers,
  addContactUser,
  updateContactUser,
  removeContactUser,
  setSelectedContact,
  setProfileToggle,
  setSidebarToggle,
  setProfileSidebarWidth,
  openCloseSidebar,
  profileSideBarToggle,
  setGlobalSearchTerm,
  setSubRecentActiveTab,
} = MessengerSlice.actions

export default MessengerSlice.reducer
