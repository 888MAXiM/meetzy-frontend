import { CallsType, ChatType } from '../constants'
import { RecentChat, SidebarTab } from './components/chat'
import { StatusItem } from './store'

export type ResponseParserWrapper<T> = {
  data: T
  status: number
}

export type DefaultErrorResponse = ResponseParserWrapper<Message[]>

export type FormErrorResponse = ResponseParserWrapper<Record<string, { code: string; values: string[] }[]>>

export type CombinedErrorResponse = DefaultErrorResponse | FormErrorResponse

export interface Params {
  [key: string]: unknown
}

export interface ErrorResponseData {
  error?: string
  message?: string
  isSessionExpired?: boolean
}

export interface User {
  id: number | string
  chat_id?: number | string
  user_id?: number | string
  name: string | null
  email?: string | null
  avatar?: string
  onlineStatus?: string | null
  phone?: string | null
  country?: string | null
  status?: string | null
  country_code?: string | null
  bio?: string | null
  type?: string
  profile_color?: string
  latest_message_at?: string | null
  pinned?: boolean
}

export interface EmailPayload {
  email: string
  phone: string
  countryCode: string
}

export interface OtpPayload {
  otp: string
}

export interface ResetPasswordPayload {
  new_password: string
  identifier: string
  otp: string
}

export type ID = string | number

export interface AccountResponse {
  user: {
    id: number | string
    name: string
    avatar: string
    phone: string | null
    country: string | null
    country_code: string | null
    email: string | null
    role: string | null
    bio?: string | null
    is_verified?: boolean
  }
}

export interface PendingFriendRequest {
  id: number | string
  user_id: number | string
  friend_id: number | string
  status: 'pending' | 'accepted' | 'rejected' | 'blocked'
  requested_by: number | string
  created_at: string
  updated_at: string
  requested: {
    id: number | string
    name: string
    avatar: string
    email: string
  }
}

export interface PendingRequestsResponse {
  requests: PendingFriendRequest[]
}

export interface FriendSuggestion {
  id: number | string
  name: string
  avatar: string | null
  email: string
  phone?: string
}

export interface FriendSuggestionsResponse {
  suggestions: FriendSuggestion[]
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

export interface ContactListType {
  filteredItems: User[]
}

export interface NotificationUser {
  id: number | string
  name: string
  avatar: string
  is_friend: boolean
}

export interface Notification {
  id: number | string
  user_id: number | string
  from_user_id: {
    id: string
  }
  type: 'friend_request' | 'friend_accepted' | 'friend_rejected'
  title: string
  message: string
  is_read: boolean
  read_at: string | null
  created_at: string
  from_user: NotificationUser
  data?: {
    friend_id: number | string
    friend_name: string
    friend_avatar: string
  }
}

export interface NotificationsResponse {
  notifications: Notification[]
  currentPage: number
  totalPages: number
  totalCount: number
  hasMore: boolean
}

export interface UnreadCountResponse {
  message: string
  count: number
}

export interface RespondToRequestPayload {
  requestId: string
  action: 'accept' | 'reject'
}

export interface AcceptedFriend {
  id: number | string
  user_id: number | string
  friend_id: number | string
  status: 'accepted'
  created_at: string
  updated_at: string
  friend: User
}

export interface AcceptedFriendsResponse {
  friends: AcceptedFriend[]
}

export interface FavoritesResponse {
  favorites: FavoriteUser[]
  hasMore: boolean
  currentPage: number
  totalPages: number
  totalCount: number
}

export interface FavoriteUser {
  id: number | string
  target_id: number | string
  target_type: 'user' | 'group'
  chat_id: string
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

export interface ChatParams extends Params {
  id: string | number
  type: string
  recipientId?: number
  groupId?: number
}

export interface MessagesResponse {
  messages: Message[]
  count?: number
  nextOffset: number | null
  hasMore: boolean
  isFirstPage: boolean
  offset: number
  totalCount: number
  chat_type: string | 'group' | 'dm'
  chat_id: string | number
  filter: string
}

export interface Status {
  user_id: number | string
  status: 'sent' | 'delivered' | 'read' | 'seen' | 'blocked'
  updated_at: string
}

export interface Message {
  id: string
  sender_id: number | string
  recipient_id: number | string
  group_id?: string | number | null
  parent_id?: string | number | null
  content: string
  default_content?: string
  file_name?: string
  message_type:
    | 'text'
    | 'image'
    | 'file'
    | 'sticker'
    | 'call'
    | 'audio'
    | 'system'
    | 'document'
    | 'video'
    | 'location'
    | 'announcement'
  file_url?: any
  file_type?: string | null
  metadata?: {
    file_size?: number
    mime_type?: string
    file_index?: number
    is_multiple?: boolean
    default_content?: string | null
    original_filename?: string
    call_type?: 'audio' | 'video'
    duration?: number
    action?: 'missed' | 'declined' | 'ended' | 'ongoing' | 'accepted' | 'initiated'
    system_action?: string
    user_id?: number | string
    creator_user_id?: number | string
    latitude?: string
    longitude?: string
    address?: string
    announcement_type?: string
    title?: string
    action_link?: string
    redirect_url?: SidebarTab
    is_status_reply?: boolean
    status_type?: string
    status_file_url?: string
    status_caption?: string
    is_broadcast?: boolean
    call_id?: number | string
    call_mode?: 'direct' | 'group'
    joined_count?: number
    accepted_time?: Date | string
  }
  created_at: string
  updated_at: string
  deleted_at?: string | null
  is_read?: boolean
  is_encrypted?: boolean | number | string
  sender?: User
  recipient?: User
  group?: any
  statuses?: Status[]
  reactions?: Array<{
    id: number | string
    message_id: number | string
    user_id: number | string
    emoji: string
    createdAt: string
    updatedAt: string
    count: number
    users: { id: number | string; name: string; avatar?: string }[]
  }>
  actions?: Array<{
    id?: number | string
    message_id?: number | string
    user_id: number | string
    action_type: 'star' | 'edit' | 'forward' | 'delete'
    details?: any
    created_at?: string
  }>
  parent?: Message | null
  parentMessage?: Message | null
  isDeleted?: boolean
  isDeletedForEveryone?: boolean
  deletedBy?: { id: number; name: string } | null
  isEdited?: boolean
  isForwarded?: boolean
  replyTo?: Message | null
  isStarred?: boolean
  mentions?: number[]
  has_unread_mentions?: boolean
  isPinned?: boolean
  isAnnouncement?: boolean
}

export interface GroupSummary {
  id: number | string
  name: string
  description?: string | null
  avatar?: string | null
  created_by?: number | null | string
  created_at: string
  updated_at?: string | null
  member_count?: number
  creator?: {
    id: number | string
    name: string
    email?: string | null
    avatar?: string | null
  }
}

export interface CreateGroupResponse {
  message: string
  group: GroupSummary
}

export interface CreateBroadcastPayload {
  name: string
  recipient_ids: (string | number)[]
}

export interface CreateBroadcastResponse {
  message: string
  broadcast: {
    id: number | string
    name: string
    recipient_count: number
    recipients: User[]
    created_at: string
  }
}

export interface GetMyBroadcastsResponse {
  message: string
  data: Array<{
    id: number | string
    name: string
    recipient_count: number
    recipients: User[]
    created_at: string
    updated_at?: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

export interface RecentChatsResponse {
  success: boolean
  chats: RecentChat[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasMore: boolean
  }
}

export interface AccountPayload {
  name?: string
  avatar?: string
  phone?: string
  country?: string
  country_code?: string
  email?: string
  bio?: string
}

export interface UpdateProfileResponse {
  message?: string
  user?: User
}

export interface StatusView {
  id: number | string
  name: string
  avatar: string | null
  viewed_at: string
  viewed_ago: string
}

export interface UserStatusFeed {
  user: {
    id: number | string
    name: string
    avatar: string | null
  }
  statuses: StatusItem[]
  is_viewed?: boolean
  expires_at?: string
  is_sponsored?: boolean
  is_muted_section?: boolean
}

export interface StatusFeedResponse {
  message: string
  data: UserStatusFeed[]
}

export interface CreateStatusPayload {
  type: 'text' | 'image' | 'video'
  caption?: string
  file?: File
}

export interface CreateStatusResponse {
  message: string
  status: StatusItem
}

export interface ViewStatusPayload {
  status_id: string | number
}

export interface ViewStatusResponse {
  message: string
  data?: {
    status_id: number | string
    viewer_id: number | string
    viewer_at: string
  }
  viewed_at?: string
}

export interface DeleteStatusPayload {
  status_ids: number[]
}

export interface DeleteStatusResponse {
  message: string
}

export interface ReplyStatusPayload {
  status_id: string
  message: string
}

export interface ReplyStatusResponse {
  message: string
  fullMessage: Message
}

export interface Document {
  id: number | string
  file_name: string
  file_url: string
  file_type: string
  message_type: string
  created_at: string
  sender?: { id: number | string; name: string }
  recipient?: { id: number | string; name: string }
  group?: { id: number | string; name: string }
}

export interface DocumentsGroup {
  dateLabel: string
  documents: Document[]
}

export interface DocumentsResponse {
  documents: DocumentsGroup[]
  currentPage: number
  totalPages: number
  totalCount: number
  hasMore: boolean
}

export interface SearchDocumentsResponse {
  documents: Document[]
}

interface DocumentItem {
  id: number | string
  file_name: string
  file_url: string
  file_type: string
  message_type: string
  created_at: string
  sender: {
    id: number | string
    name: string
  } | null
  recipient: {
    id: number | string
    name: string
  } | null
  group: {
    id: number | string
    name: string
  } | null
  documents: DocumentItem[]
  dateLabel: string
}

export interface DocumentGroup {
  dateLabel: string
  documents: DocumentItem[]
}

export interface DocumentsSearchResponse {
  documents: DocumentItem[]
  dateLabel: string
  currentPage: number
  totalPages: number
  totalCount: number
  hasMore: boolean
}

export interface Sticker {
  id: number | string
  title: string
  sticker: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export interface GetStickersResponse {
  total: number
  totalPages: number
  page: number
  limit: number
  stickers: Sticker[]
}

export interface EditMessagePayload {
  messageId: number | string
  content: string
  is_encrypted?: boolean
}

export interface EditMessageResponse {
  message: string
  updatedMessage?: Message
}

export interface DeleteMessagePayload {
  messageIds: string | string[] | undefined
  deleteType?: 'delete-for-me' | 'delete-for-everyone'
  isBroadcast?: boolean
  broadcastId?: number | string | number[] | undefined
}

export interface DeleteMessageResponse {
  message: string
}

export interface StarMessagePayload {
  messageId: string | string[]
  isStarred: boolean
}

export interface PinMessagePayload {
  messageId: string | number | number[]
  duration?: string
}

export interface StarMessageResponse {
  action: 'starred' | 'unstarred' | 'already_starred' | 'already_unstarred'
  message: string
}

export interface ForwardMessagePayload {
  messageIds: string | string[]
  recipients: Array<{ type: 'user' | 'group'; id: number | string }>
  encryptedContents?: Record<number, Record<string, string>>
}

export interface ForwardMessageResponse {
  messages: Message[]
}

export interface GroupInfo {
  id: number | string
  name: string
  description?: string | null
  avatar?: string | null
  avatar_url?: string
  created_by?: number | null
  created_at: string
  updated_at?: string | null
  creator?: {
    id: number | string
    name: string
    avatar?: string | null
  }
  chat_id?: number | string
  chat_type?: string
  isPinned?: boolean
  setting?: GroupSettings
  myRole?: 'admin' | 'member' | null
}

export interface GroupMember {
  id: number | string
  name: string
  email: string
  avatar?: string | null
  group_role: 'admin' | 'member'
  joined_at: string | undefined
  updated_at?: string | null
  is_created_by?: boolean
}

export interface GetGroupMembersResponse {
  group_id: number | string
  group_name: string
  group_avatar?: string | null
  members: GroupMember[]
  page: number
  limit: number
  total_pages: number
  total_members: number
}

export interface UpdateGroupPayload {
  group_id: string | number
  name?: string
  description?: string
  remove_avatar?: boolean
  avatar?: File
}

export interface AddMembersPayload {
  group_id: string | number
  members: Array<{ user_id: string | number; role?: 'admin' | 'member' }>
}

export interface RemoveMembersPayload {
  group_id: string | number
  user_ids: (number | string)[]
}

export interface UpdateMemberRolePayload {
  group_id: string | number
  user_id: number | string
  new_role: 'admin' | 'member'
}

export interface LeaveGroupPayload {
  group_id: string | number
}
export interface PinConversationPayload {
  type: string
  targetId: ID
}
export interface ToggleArchiveConversationPayload {
  type: ChatType.DM | ChatType.group
  target_id: ID
}

export interface UpdateGroupSettingsPayload {
  group_id: string | number
  allow_edit_info?: 'admin' | 'everyone'
  allow_send_message?: 'admin' | 'everyone'
  allow_add_member?: 'admin' | 'everyone'
}

export interface GroupSettings {
  group_id: number | string
  allow_edit_info: 'admin' | 'everyone'
  allow_send_message: 'admin' | 'everyone'
  allow_add_member: 'admin' | 'everyone'
}

export interface SingleChatWallPaper {
  id: ID
  name: string
  wallpaper: string
  status: boolean
  metadata: string
  created_at: string
  updated_at: string
  is_default: boolean
}

export interface ChatWallpaperResponse {
  message: string
  wallpapers: SingleChatWallPaper[]
}

export interface SingleFAQ {
  id: number | string
  title: string
  description: string
  status: boolean
  created_at: string
  updated_at: string
}

export interface FAQListResponse {
  message: string
  faqs: SingleFAQ[]
  total: number
  page: number
  limit: number
}

export interface SinglePage {
  id: number | string
  title: string
  slug: string
  content: string
  status: boolean
  created_at: string
  updated_at: string
  created_by: number | string
}

export interface PageListResponse {
  message: string
  data: {
    total: number
    page: number
    limit: number
    pages: SinglePage[]
  }
}

export interface SettingsResponse {
  settings: {
    id: number | string
    app_name: string
    app_description: string
    app_email: string
    support_email: string
    favicon_url: string | null
    logo_light_url: string
    logo_dark_url: string
    sidebar_logo_url: string
    mobile_logo_url: string
    landing_logo_url: string
    favicon_notification_logo_url: string
    onboarding_logo_url: string
    maintenance_mode: boolean
    maintenance_title: string
    maintenance_message: string
    maintenance_image_url: string
    page_404_title: string
    page_404_content: string
    page_404_image_url: string
    no_internet_title: string
    no_internet_content: string
    no_internet_image_url: string
    smtp_host: string
    smtp_port: number
    smtp_user: string
    smtp_pass: string
    mail_from_name: string
    mail_from_email: string
    default_theme_mode: 'light' | 'dark'
    display_customizer: boolean
    audio_calls_enabled: boolean
    video_calls_enabled: boolean
    allow_archive_chat: boolean
    allow_media_send: boolean
    allow_user_block: boolean
    allow_user_signup: boolean
    call_timeout_seconds: number
    document_file_limit: number
    audio_file_limit: number
    video_file_limit: number
    image_file_limit: number
    multiple_file_share_limit: number
    maximum_message_length: number
    allowed_file_upload_types: string[]
    created_at: string
    updated_at: string
    login_method: 'email' | 'phone' | 'both'
    e2e_encryption_enabled?: boolean | number | string
    default_language?: string
  }
}

export interface SettingsState {
  settings: SettingsState | null
  sidebar_logo_url: string
  logo_light_url: string
  logo_dark_url: string
  favicon_notification_logo: string
  favicon_url: string
  app_name: string
  app_description: string
  no_internet_title: string
  no_internet_content: string
  page_404_content: string
  page_404_title: string
  maintenance_mode: string
  maintenance_image_url: string
  maintenance_title: string
  maintenance_message: string
  display_customizer: string
  audio_calls_enabled: string
  video_calls_enabled: string
  allow_archive_chat: boolean
  allow_media_send: string
  allow_status: string
  allow_screen_share: string
  auth_method: 'email' | 'phone' | 'both'
  time_format: '12h' | '24h'
  login_method: 'otp' | 'password' | 'both'
  allow_user_signup: string
  svg_color: string
  default_language?: string
  e2e_encryption_enabled?: boolean
  maximum_message_length?: number
}

export interface SharedDocument {
  id: number | string
  name: string
  url: string
  uploaded_at: string
}

export interface SharedImage {
  id: number | string
  url: string
  date: string
}

export interface SharedLink {
  id: number | string
  url: string
  title: string
}

export interface CommonGroup {
  id: number | string
  name: string
  description: null
  avatar: null
  created_at: string
  member_count: number
  members: {
    id: number | string
    name: string
    avatar: string
  }[]
}

export interface StarredMessage {
  id: number | string
  message_id: number | string
  content: string
  date: string
  sender: {
    id: number | string
    name: string
    avatar: string
  }
}

export interface SelectedUserProfile {
  id: number | string
  name: string
  bio: string
  avatar: string
  phone: string
  email: string
  country_code: string
  userSetting?: {
    last_seen?: boolean
    profile_pic?: boolean
    display_bio?: boolean
    hide_phone?: boolean
  } | null
  shared_documents: SharedDocument[]
  shared_images: SharedImage[]
  shared_links: SharedLink[]
  common_groups: CommonGroup[]
  starred_messages: StarredMessage[]
  user_setting: UserSetting
  isAnnouncement?: string
  is_verified?: boolean
}

export interface SingleReportReason {
  id: number | string
  title: string
  created_at: string
  updated_at: string
}

export interface ReportReasonResponse {
  message: string
  total: number
  page: number
  limit: number
  reports: SingleReportReason[]
}

export interface CallHistoryItem {
  id: number | string
  callType: CallsType
  callMode: ChatType
  duration: string | null
  timestamp: string
  date: string
  status: 'ended' | 'missed'
  direction: 'incoming' | 'outgoing'
  isGroupCall: boolean
  participantNames: string[]
  participants: any[]
  initiator: {
    id: number | string
    name: string
    avatar: string | null
  }
  group?: {
    id: number | string
    name: string
    avatar: string | null
  }
  receiver?: {
    id: number | string
    name: string
    avatar: string | null
  }
  acceptedTime: string | null
  endedAt: string | null
}

export interface CallHistoryResponse {
  calls: {
    [dateLabel: string]: CallHistoryItem[]
  }
  sectionCounts: {
    all: number
    incoming: number
    outgoing: number
    missed: number
  }
  pagination: {
    currentPage: number
    totalPages: number
    totalCalls: number
    hasNext: boolean
    hasPrev: boolean
  }
}
export interface UserSetting {
  id?: number | string
  user_id?: number | string
  last_seen?: boolean
  profile_pic?: boolean
  display_bio?: boolean
  user_status?: boolean
  read_receipts?: boolean
  typing_indicator?: boolean
  chat_wallpaper?: string
  mode?: string
  color?: string
  layout?: string
  sidebar?: string
  direction?: string
  auto_backup?: boolean
  doc_backup?: boolean
  video_backup?: boolean
  created_at?: string
  updated_at?: string
  status_privacy?: string
  shared_with?: string[] | null
  userSetting?: UserSetting | null
  hide_phone?: boolean
  pin_hash?: string
  locked_chat_ids?: number
  chat_lock_digit?: number
}

export interface UserSettingResponse {
  userSetting: UserSetting
}

export type RedirectResponse = {
  message: string
  redirectUrl: string
}

export interface MutedUsersResponse {
  message: string
  data: MutedUserData[]
  pagination: Pagination
}

export interface MutedUserData {
  muted_user: MutedUser
  muted_at: string
  latest_status: StatusItem[]
  statuses: StatusItem[]
}

export interface MutedUser {
  id: number | string
  name: string
  avatar: string
}

export interface LatestStatus {
  id: number | string
  type: 'text' | 'image' | 'video'
  file_url: string
  caption: string | null
  created_at: string
  expires_at: string
}

export interface Pagination {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

export type PlanStatus = 'active' | 'inactive'
export type BillingCycle = 'monthly' | 'yearly' | 'both'

export interface SinglePlan {
  id: number | string
  name: string
  slug: string
  description: string | null
  price_per_user_per_month: number
  price_per_user_per_year: number | null
  billing_cycle: BillingCycle
  max_members_per_group: number
  max_storage_per_user_mb?: number
  max_broadcasts_list: number
  max_members_per_broadcasts_list: number
  max_status: number
  max_groups: number
  allows_file_sharing: boolean
  video_calls_enabled: boolean
  features: Record<string, any>
  display_order: number
  is_default: boolean
  trial_period_days: number
  status: PlanStatus
  created_at: string
  updated_at: string
}

export interface PlanListResponse {
  message?: string
  data?:
    | SinglePlan[]
    | {
        plans: SinglePlan[]
        total: number
        page: number
        limit: number
        totalPages: number
      }
  plans?: SinglePlan[]
}

export interface Subscription {
  id: number | string
  user_id: number | string
  plan_id: number | string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
  billing_cycle: 'monthly' | 'yearly'
  amount: number
  currency: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  payment_gateway: string | null
  stripe_subscription_id: string | null
  paypal_subscription_id: string | null
  plan?: SinglePlan
  created_at: string
  updated_at: string
}

export interface MySubscriptionResponse {
  success: boolean
  data: {
    user: {
      is_verified: boolean
      verified_at: string | null
      stripe_customer_id: string | null
    }
    subscription: Subscription | null
  }
}

export interface UserLimitsResponse {
  success: boolean
  data: {
    max_groups_per_user: number
    max_group_members: number
    max_broadcasts_list: number
    max_members_per_broadcasts_list: number
    status_limit_per_day: number
    max_storage_per_user_mb: number
    allow_media_send: boolean
    video_calls_enabled: boolean
  }
}

export interface TranslationResponse {
  translation: {
    id: number | string
    name: string
    locale: string
    is_active: boolean
    translation_json: Record<string, any>
    created_at: string
    updated_at: string
  }
}
