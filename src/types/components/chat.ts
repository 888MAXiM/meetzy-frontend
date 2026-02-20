import type { ChangeEvent, ReactNode, RefObject } from 'react'
import { CallFilter } from '../../constants'
import type {
  FavoriteUser,
  FriendSuggestion,
  GroupMember,
  GroupSummary,
  Message,
  Notification,
  User,
  UserSetting,
  UserStatusFeed,
} from '../api'
import { CallState } from '../webrtc'
import { StatusItem } from '../store'

export interface AllCallType {
  startValue: number
  endValue: number
}

export interface LastSeenMessage {
  isSeen?: boolean
  content?: string
  createdAt?: string
}

export interface Contact {
  id: number | string
  name: string
  avatar: string
  email: string | null
  profile_color?: string
  thumb?: string
  onlineStatus?: string
  status?: string
  mesg?: string
  lastSeenDate?: string
  typing?: boolean
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
  isSentByCurrentUser?: boolean
  messageStatus?: string
  isPinned?: boolean
  isMuted?: boolean
  chatType?: 'direct' | 'group'
  isOnline?: boolean
  lastSeen?: string | null
  chat_type?: 'direct' | 'group'
  chat_id: number | string
  phone?: string
  userSetting?: UserSetting | null
  is_unread_mentions?: boolean
  is_verified?: boolean
  isArchived?: boolean
  isFavorite?: boolean
  isBlocked?: boolean
  pinned_at?: string | null
  isGroup?: boolean
  bio?: string
}

export interface GetGroupsResponse {
  total: number
  totalPages: number
  page: number
  limit: number
  groups: GroupSummary[]
}

export interface GetUserGroupsResponse {
  groups: GroupSummary[]
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasMore: boolean
}

export interface GetContactsResponse {
  success: boolean
  contacts: Contact[]
  pagination: Pagination
  hasMore?: boolean
}

export interface ContactType {
  search: boolean
  setSearch: (value: boolean) => void
}

export interface SearchNotFoundClassType {
  word: string
}

export interface ContactListType {
  filteredItems: User[] | FriendSuggestion[]
  searchTerm?: string
}

export interface CommonLeftHeadingType {
  title?: string
  subTitle?: string
  search?: boolean
  searchTerm?: string
  onSearchChange?: (value: string) => void
  modalToggle?: () => void
  showArrow?: boolean
  onArrowClick?: () => void
  customContent?: React.ReactNode
  customActions?: React.ReactNode
  hideDefaultClose?: boolean
}

export interface CommonMediaHeadingType {
  title: string
  text?: string
  type?: string
  onClick?: (e: React.MouseEvent) => void
}

export interface NotesModalType {
  modal: boolean
  toggle: () => void
}

export interface StatusType {
  id: string
  image: string
  title: string
  time: string
  status: boolean
  active: boolean
}

export interface UserStatusType {
  item: StatusType
}

export interface CommonHeadingType {
  title: string
  subTitle?: string
}

export interface SettingSidebarType {
  setCustomizer: () => void
}

export interface BlockedUser {
  id: number | string
  user: {
    id: number | string
    name: string
    avatar: string
    email: string
  }
  created_at: string
  type: string
  group: {
    id: number | string
    name: string
    avatar: string
  }
}

export interface BlockedUsersResponse {
  blocked: BlockedUser[]
  blockedUsers?: BlockedUser[]
  hasMore: boolean
  currentPage: number
  totalPages: number
  totalCount: number
}

export interface NotificationListProps {
  notifications: Notification[]
  refetch: () => void
}

export interface FavoriteListProps {
  favorites: FavoriteUser[]
}

export interface FavoriteModalProps {
  toggle: () => void
  modal: boolean
  refetch: () => void
}

export interface FavoriteItem {
  id: number | string
  target_id: number | string
  target_type: 'user' | 'group'
  created_at: string
  chat_type: string
  email: string
  name: string
  avatar: string
  description: string
  user?: {
    id: number | string
    name: string
    avatar: string
    email: string
  }
  group?: {
    id: number | string
    name: string
    avatar: string
    description: string
  }
}

export interface BlockedUsersListProps {
  blockedUsers: BlockedUser[]
  searchTerm?: string
  refetch: () => void
}

export interface ArchiveUsersListProps {
  archiveUsers: ChatItem[]
  searchTerm?: string
  refetch: () => void
}

export interface ContactWithChat {
  id: number | string
  name: string
  email: string
  avatar?: string
  status?: string
  lastMessage?: string
  lastMessageTime?: string
  messageStatus?: 'sent' | 'delivered' | 'read' | 'sending' | 'failed' | 'seen'
  unreadCount?: number
  isSentByCurrentUser?: boolean
  chat_type?: 'direct' | 'group'
  isPinned?: boolean
  isMuted?: boolean
}

export interface AudioRecorderProps {
  onDirectSend: (audioFile: File) => Promise<void>
  onCancel: () => void
  disabled?: boolean
}

export interface RecentChat {
  chat_type: 'direct' | 'group'
  chat_id: number | string
  name: string
  lastMessage: LastMessage | null
  unreadCount: number
  isMuted: boolean
  isPinned: boolean
  pinned_at?: string | null
  isArchived?: boolean
  isBlocked?: boolean
  isFavorite?: boolean
  isAnnouncement?: boolean
  latest_message_at?: string
  status?: string
  avatar?: string
  is_unread_mentions?: boolean
  isLocked?: boolean
  isBroadcast?: boolean
  is_verified?: boolean
  sender?: {
    id: number | string
    name: string
    avatar: string | null
    is_verified?: boolean
  }
}

export interface LastMessage {
  id: string
  sender_id: number | string
  group_id: number | null
  recipient_id: number | string
  parent_id: number | null
  content: string
  message_type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'call' | 'sticker' | 'system'
  file_url: string | null | undefined
  file_type: string | null
  created_at: any
  updated_at: string
  deleted_at: string | null
  isDeleted?: boolean
  isDeletedForEveryone?: boolean
  is_encrypted?: boolean | number | string
  statuses?: Array<{
    user_id: number | string
    status: 'sent' | 'delivered' | 'seen' | 'read'
    updated_at: string
  }>
  isForwarded?: boolean
  group?: {
    id: number | string
    name: string
    avatar: string | null
  }
  sender?: {
    id: number | string
    name: string
    avatar: string | null
  }
  recipient?: {
    id: number | string
    name: string
    avatar: string | null
  }

  metadata: {
    file_size?: number
    mime_type?: string
    file_index?: number
    is_multiple?: boolean
    default_content?: string
    original_filename?: string
  }
}

export interface UserStatusProps {
  feed: UserStatusFeed
  mutedUserIds?: Set<number | string>
  isViewed: boolean
}

export interface ContactStatusProps {
  statusFeed?: UserStatusFeed[]
  currentUserId?: string | number | undefined
}

export interface CreateStatusModalProps {
  isOpen: boolean
  toggle: () => void
  onSuccess: () => void
  userAvatar?: string
}

export interface StatusUploadModalProps {
  isOpen: boolean
  onClose: () => void
  selectedFile: File | null
  caption: string
  onCaptionChange: (caption: string) => void
  onUpload: () => void
  uploading: boolean
}

export interface StatusView {
  id: number | string
  name: string
  avatar: string | null
  viewed_at: string
  viewed_ago: string
  viewer_id: number | string
  viewer_name: string
}

export interface ViewersModalProps {
  isOpen: boolean
  onClose: () => void
  viewers: StatusView[]
}

export interface Status {
  id: number | string
  type: 'text' | 'image' | 'video'
  file_url: string | null
  caption: string | null
  created_at: string
  view_count: number
  views: StatusView[]
  is_sponsored?: boolean
}

export interface MyStatusListProps {
  statuses: Status[]
  onDelete: (statusId: number) => void
  isDeleting: boolean
  formatTimeAgo: (date: string) => string
  onStatusClick: (status: Status) => void
}

export interface StatusViewerModalProps {
  isOpen: boolean
  onClose: () => void
  statuses: StatusItem[]
  initialIndex: number
  userName: string
  userAvatar?: string | null
  isSponsored?: boolean
  formatTimeAgo: (date: string) => string
}

export interface EmojiWrapperProps {
  children: ReactNode
  hint?: string
  onEmojiSelect: (emoji: any) => void
  id: string
  onPickerStateChange?: (isOpen: boolean) => void
  onParentHoverChange?: any
  position?: 'top' | 'bottom' | 'right' | 'left'
  disabled?: boolean
  className?: string
  theme?: string
}

export interface EmojiMartPicker {
  el: HTMLElement
}

export enum SidebarTab {
  CHATS = 'chat',
  CALL = 'call',
  STATUS = 'status',
  ARCHIVE = 'archive',
  NOTIFICATION = 'notification',
  DOCUMENT = 'document',
  FRIEND_SUGGESTIONS = 'friend-suggestions',
  BLOCK_ICON = 'blockicon',
  FAVORITE = 'favorite',
  SETTINGS = 'settings',
  MODE = 'mode',
}

export enum Screen {
  CHATS = 'chat',
  CALL = 'call',
  STATUS = 'status',
  ARCHIVE = 'archive',
  NOTIFICATIONS = 'notifications',
  DOCUMENTS = 'documents',
  FRIENDS = 'friends',
  BLOCKED_USERS = 'blocked-users',
  FAVORITES = 'favorites',
  SETTINGS = 'settings',
}

export interface SidebarItem {
  class?: string
  type: SidebarTab
  icon: string
}

export type GroupWithMeta = GroupSummary & {
  lastMessage: string
  lastMessageTime?: string
  unreadCount: number
  isSentByCurrentUser: boolean
  messageStatus?: string
  hasUnread: boolean
  chat_type: 'direct' | 'group'
  isPinned: boolean
}

export interface TypingEventData {
  userId: number | string
  userName: string
  isTyping: boolean
  groupId?: number | string
  senderId?: number | string
  recipientId?: number | string
}

export interface DeleteMessageModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (deleteType: 'delete-for-me' | 'delete-for-everyone') => void
  isLoading?: boolean
  isGroupChat?: boolean
  canDeleteForEveryone?: boolean
}

export interface ForwardMessageModalProps {
  isOpen: boolean
  message: Message | null
  onClose: () => void
  onForward: (recipients: Array<{ type: 'user' | 'group'; id: number | string }>) => void
  isLoading?: boolean
}

export interface Section {
  label: string
}

export interface DateLabelProps {
  section: Section
  containerRef?: RefObject<HTMLElement | null>
  forceScrollToBottom?: () => void
}

export interface DateJumpModalProps {
  isOpen: boolean
  onClose: () => void
  forceScrollToBottom: () => void
}

export interface JumpToMenuProps {
  sectionLabel: string
  chatContainerRef: any
  onOpenDateModal: () => void
  scrollToBottom: () => void
  onClose?: () => void
}

export interface CallNotificationProps {
  onAccept: () => void
  onDecline: () => void
  onEndAndAccept?: () => void
  isVisible: boolean
}

export interface CallModalProps {
  isOpen: boolean
  onClose: () => void
  isMinimized: boolean
  onMinimize: () => void
  onMaximize: () => void
}
export interface SearchParams {
  query?: string
  groupId?: string | number | null
  recipientId?: string | number | null
  date_from?: string
  date_to?: string
  sender_id?: string | number | null
  scope?: string
  isAnnouncement?: boolean
  limit?: number
  offset?: number
  page?: number
  _timestamp?: string | number
}

export interface SearchMessage {
  id: string | number
  content: string
  message_type: string
  file_url?: string
  created_at: string
  group?: Group | null
  sender: { id: string; name: string; avatar?: string }
  sender_id?: string
  is_encrypted?: boolean
  decryptedContent?: string
}

export interface Sender {
  id: number | string
  name: string
  avatar: string | null
}

export type Group = null

export interface PageSearchMessage {
  messages: SearchMessage[]
  isFirstPage: boolean
}

export interface ResponseSearchMessage {
  messages: SearchMessage[]
  isFirstPage: boolean
  pagination: PaginationData
  e2e_enabled?: boolean
}

export interface PaginationData {
  currentPage?: number
  limit?: number
  totalMessages?: number
  totalPages?: number
  hasMore?: boolean
}

interface ScrollMessage {
  id: string | number
  sender_id: string | number
  content: string
  created_at: string
}

export interface ScrollMessageSection {
  label: string
  messages: ScrollMessage[]
}

export interface ScrollTypingUser {
  userId: string
  name: string
}

export interface UseScrollManagerReturn {
  containerRef: any
  isUserScrolledUp: boolean
  shouldAutoScroll: boolean
  handleScroll: () => void
  scrollToBottom: () => void
  forceScrollToBottom: () => void
  saveScrollPosition: () => void
  restoreScrollPosition: () => void
  scrollToMessage: (messageId: string) => void
  prepareForOlderMessages?: () => void
  globalRedirectToMessage?: (messageId: string, targetChat?: Contact) => void
}

export interface ArchiveUserTarget {
  id: number | string
  name: string
  avatar: string | null
  email: string
}

export interface ArchiveUser {
  id: number | string
  target_type: 'user' | string
  target_id: number | string
  created_at: string
  target: ArchiveUserTarget
  last_message: string
}

export interface ChatItem {
  chat_type: 'direct' | 'group'
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
  archived_at: string | null
  isBroadcast?: boolean
  is_verified?: boolean
  isAnnouncement?: boolean
}

export interface ArchiveUsersResponse {
  archived: ChatItem[]
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}
export interface MessageReactionProps {
  message: Message
  findMessageById?: (messageId: string | number) => Message | null
}

export interface SingleGroup {
  id: number | string
  name: string
  description: string
  avatar: string
  created_by: number | string
  created_at: string
  updated_at: string
  creator: { id: number | string; name: string; email: string }
}

export interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

export interface GroupResponse {
  groups: SingleGroup[]
  pagination: Pagination
}

export interface SelectOption {
  value: number | string
  label: string
}

export interface ReportFormValues {
  reason: SelectOption | null
  message: string
  exitGroup: boolean
}

export interface ContactPollProps {
  isEmojisVisible: boolean
  setIsEmojisVisible: (value: boolean) => void
  onEmojiSelect: (emoji: any) => void
  onEmojiPickerToggle?: (isOpen: boolean) => void
  onFilesSelected: (files: File[]) => void
  innerRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement>
}

export interface FilePreviewProps {
  file: File
  onRemove: () => void
}

export interface AllCallProps {
  filter: CallFilter
  searchTerm?: string
}

export interface CallControlsProps {
  callState: CallState
  onClose: () => void
}

export type RecentChatsProps = {
  onChatSelect?: () => void
  localSearch?: string
}

export interface GroupInfoModalProps {
  isOpen: boolean
  groupId: string | undefined | number
  onClose: () => void
}

export interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  filteredContacts: Contact[]
  addMemberSearch: string
  onSetAddMemberSearch: (search: string) => void
  onAddMembers: (userIds: (number | string)[]) => void
}

export interface AboutTabProps {
  group: any
  isAdmin: boolean
  isMember: boolean
  isEditing: boolean
  isLoadingGroup: boolean
  editName: string
  editDescription: string
  currentAvatarUrl: string | null
  onSetEditing: (editing: boolean) => void
  onSetEditName: (name: string) => void
  onSetEditDescription: (desc: string) => void
  onAvatarChange: (file: File) => void
  onRemoveAvatar: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onLeaveGroup: () => void
  onDeleteGroupForMe: () => void
  updateGroupMutation: any
  leaveGroupMutation: any
  deleteChatLoading: boolean
}

export interface MembersTabProps {
  members: GroupMember[]
  totalMembers: number
  memberSearch: string
  isLoadingMembers: boolean
  user: any
  isAdmin: boolean
  openDropdownId: number | string | null
  onSetMemberSearch: (search: string) => void
  onToggleDropdown: (id: number | string | null) => void
  onUpdateMemberRole: (userId: number | string, newRole: 'admin' | 'member') => void
  onRemoveMember: (userId: number | string) => void
  refetchMembers: () => void
}
export interface SystemMessageProps {
  message: Message
  consecutiveSystemMessages?: Message[]
  isGrouped?: boolean
  isFirstInGroup?: boolean
  currentMessageIndex?: number
}

export interface StatusAvatarProps {
  avatar?: string
  name?: string
  hasStatus: boolean
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void
  userData?: {
    name?: string
    first_name?: string
  }
  fileInputRef: RefObject<HTMLInputElement | null>
}

export interface MessageSelectionActionsProps {
  selectedCount: number
  onClear: () => void
  onDelete: () => void
  onForward: () => void
  onStar: () => void
  selectedMessages: Message[]
  allMessages?: Message[]
}

export interface DropdownOption {
  id: string
  label: string
  iconId: string
  onClick: (e: React.MouseEvent, contact: RecentChat) => void | Promise<void>
  isVisible?: boolean
  dynamicLabel?: (contact: RecentChat, isMuted?: boolean, isPinned?: boolean) => string
  dynamicIcon?: (contact: RecentChat, isMuted?: boolean, isPinned?: boolean) => string
  className?: string
}

export interface ShareLocationProps {
  onLocationSelected: (location: { latitude: number; longitude: number; address: string }) => void
  disabled?: boolean
}
