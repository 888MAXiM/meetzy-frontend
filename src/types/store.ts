import type { chatWallpaperData, colorPickerData, templateLayoutData, toDoAllData } from '../data/messenger'
import type { Message, SelectedUserProfile, User, UserSetting } from './api'
import type { LastMessage, RecentChat, StatusView } from './components/chat'

export interface LoaderState {
  loading: boolean
  pageLoading: Record<string, boolean>
}

export interface ChatContactSettingType {
  chatContact: boolean
  setChatContact?: () => void
}

export interface ChatMembersType {
  id: string
  user_id?: number | string
  thumb?: string
  mesg?: string
  lastSeenDate?: string
  onlineStatus?: string
  typing?: boolean
  chatStatus?: string
  profileImg: string
  email?: string
  profile_color?: string
  memberCount?: number
  description?: string | null
  members?: ChatMembersType[]
  chat_type: 'direct' | 'group' | 'broadcast'
  chat_id: number | string
  name: string
  phone: string
  avatar: string | null
  status: string | null
  lastMessage: LastMessage | null
  userSetting: UserSetting | null
  unreadCount: number
  is_unread_mentions: boolean
  isArchived: boolean
  isFavorite: boolean
  isBlocked: boolean
  isMuted: boolean
  isPinned: boolean
  pinned_at: string | null
  isGroup: boolean
  country: string | null
  country_code: string | null
  role: string | null
  bio?: string | null
  disappearing?: {
    enabled: number
    duration: string
    expire_after_seconds: number
  }
  isLocked?: boolean
  isAnnouncement?: boolean
  isBroadcast?: boolean
  is_verified?: boolean
  recipients?: {
    id: number | string
    name: string
    avatar: string
  }[]
}

export interface MessageTypes {
  name?: string
  sender: number
  class?: string
  time: string
  text: string
  status?: boolean
  font_class?: string
  liked?: boolean
  document?: boolean
  seen?: boolean
  photos?: boolean
  stickers?: string
}

export interface ChatsTypes {
  id?: number
  users: number[]
  lastMessageTime: string
  messages: MessageTypes[]
  time?: string
}

export interface ActiveCallUserTypes {
  userName: string
  userId: number | string
  userImage: string
}

export interface ChatSliceType {
  allMembers: ChatMembersType[]
  chatMembers: ChatMembersType[]
  chats: ChatsTypes[]
  currentUser: ChatMembersType | null
  selectedUser: ChatMembersType | null
  isTyping: boolean
  activeCallUser: ActiveCallUserTypes | null
  replyMessage: Message | null
  editMessage: Message | null
  selectedChatMessages: Message[]
  currentCallStatus: string
  openReportModal?: boolean
  callParticipants: {
    participants: any[]
    channelId: string | null
    chatType: string
  }
  selectedChat: SelectedChat | null
  targetMessageId: string | null
  highlightedMessageId: string | number | null
  highlightedMessageTimestamp?: string | null
  recentChats: RecentChat[]
  recentChatsLoading: boolean
  selectedUserProfile: SelectedUserProfile | null
  isBlocked?: boolean
  isFavorite?: boolean
}

export interface SelectedChat {
  id: number | string | undefined
  type: 'direct' | 'group' | string | undefined
  pinned?: boolean
  isArchived?: boolean
}

export interface SendMessagePayload {
  currentUserId: number
  selectedUserId: number
  time: string
  stickers?: string
  messageInput?: string
}

export interface ReplyMessagePayload {
  currentUserId: number
  selectedUserId: number
  time: string
  replyMessage: string
}

export interface LoginPayload {
  token: string
  user: User
}

export interface RememberedCredentials {
  email: string
  password: string
  phone: string
  countryCode: string
  rememberMe: boolean
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  forgotPasswordEmail: string | null
  identifier: string
  rememberedCredentials: RememberedCredentials
}

export interface ContactUser {
  id: number
  name: string
  userName?: string
  email: string
  avatar?: string
  status?: string
  onlineStatus?: string
  number?: string
  active: boolean
  lastMessage?: string
  lastMessageTime?: string
  messageStatus?: 'sent' | 'delivered' | 'read' | 'sending' | 'failed' | 'seen'
  unreadCount?: number
  isSentByCurrentUser?: boolean
  chat_type?: 'direct' | 'group'
  isPinned?: boolean
  isMuted?: boolean
}

export interface MessengerState {
  newModal: boolean[]
  messengerActiveTab: string
  subChatActiveTab: string
  subRecentActiveTab: string
  mobileMenu: boolean
  toggleSmallSide: boolean
  activeSection: string | null
  videoCall: boolean
  audioCall: boolean
  activeContactUser: ContactUser[]
  selectedContact: ContactUser | null
  profileToggle: boolean
  sidebarToggle: boolean
  profileSidebarWidth: number
  globalSearchTerm: string
}

export interface TemplateCustomizerState {
  layoutType: boolean
  colorPicker: typeof colorPickerData
  templateLayout: typeof templateLayoutData
  chatWallpaper: typeof chatWallpaperData
}

export interface AppSidebarState {
  mediaOpen: boolean[]
  dropdownStates: boolean[]
  dropdownData: typeof toDoAllData
  appSidebarActiveTab: string
  appSidebarWidth: number
}

export interface StatusSliceState {
  statuses: any
  myStatuses: any
}

export interface AddStatusPayload {
  status: any
  user: any
}

export interface AddViewPayload {
  status_id: string
  viewer_id: number | string
  viewer_name: string
  viewed_at: string
  view_count?: number
  current_user_id?: number | string
}

export interface StatusItem {
  id: string
  type: 'text' | 'image' | 'video'
  file_url: string | null
  caption: string | null
  created_at: string
  expires_at: string
  view_count: number
  views: StatusView[]
  is_sponsored?: boolean
}

export interface UserStatusGroup {
  user: any
  statuses: StatusItem[]
  is_viewed?: boolean
}

export interface MyStatusesGroup {
  statuses?: StatusItem[]
}
