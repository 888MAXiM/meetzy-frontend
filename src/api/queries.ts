import { UserSettingResponse } from './../types/api'
import { useInfiniteQuery, type UseQueryOptions } from '@tanstack/react-query'
import { KEYS } from '../constants/keys'
import { URL_KEYS } from '../constants/url'
import type {
  ArchiveUsersResponse,
  BlockedUsersResponse,
  GetContactsResponse,
  GetGroupsResponse,
  GroupResponse,
  ResponseSearchMessage,
  SearchParams,
} from '../types/components/chat'
import get from './get'
import { useApiGet } from './hooks'
import type {
  AcceptedFriendsResponse,
  AccountResponse,
  CallHistoryResponse,
  ChatWallpaperResponse,
  CombinedErrorResponse,
  DocumentsResponse,
  DocumentsSearchResponse,
  FAQListResponse,
  FavoritesResponse,
  FriendSuggestionsResponse,
  GetGroupMembersResponse,
  GetStickersResponse,
  GroupInfo,
  MessagesResponse,
  MutedUsersResponse,
  MySubscriptionResponse,
  UserLimitsResponse,
  NotificationsResponse,
  UnreadCountResponse,
  PageListResponse,
  Params,
  PendingRequestsResponse,
  PlanListResponse,
  RecentChatsResponse,
  GetMyBroadcastsResponse,
  RedirectResponse,
  ReportReasonResponse,
  SelectedUserProfile,
  SettingsResponse,
  SinglePlan,
  StatusFeedResponse,
  TranslationResponse,
} from '../types/api'
import { ChatType } from '../constants'
import { ChatMembersType } from '../types/store'
import { decryptMessageIfNeeded } from '../utils/e2e-helpers'
import { isContentEncrypted } from '../utils'

const queries = {
  useGetContactList: (
    page: number = 1,
    limit: number = 20,
    options?: Omit<
      UseQueryOptions<GetContactsResponse, CombinedErrorResponse, GetContactsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<GetContactsResponse>(
      [KEYS.GET_CHAT, page, limit],
      () => get(`${URL_KEYS.Chat.GetContacts}?page=${page}&limit=${limit}`),
      options,
    ),
  useSearchContact: (search: string = '') =>
    useApiGet<GetContactsResponse>(
      [KEYS.SEARCH_CONTACT, search],
      () => get(`${URL_KEYS.Chat.SearchContacts}?search=${search}`),
      {
        enabled: !!search,
      },
    ),

  useGetUserDetails: (
    options?: Omit<
      UseQueryOptions<AccountResponse, CombinedErrorResponse, AccountResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) => useApiGet<AccountResponse>([KEYS.USER], () => get(URL_KEYS.Profile.Details), options),

  useGetPendingFriendRequests: (
    options?: Omit<
      UseQueryOptions<PendingRequestsResponse, CombinedErrorResponse, PendingRequestsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<PendingRequestsResponse>(
      [KEYS.PENDING_FRIEND_REQUESTS],
      () => get(URL_KEYS.Friends.PendingRequests),
      options,
    ),

  useGetFriendSuggestions: (
    limit: number = 20,
    options?: Omit<
      UseQueryOptions<FriendSuggestionsResponse, CombinedErrorResponse, FriendSuggestionsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<FriendSuggestionsResponse>(
      [KEYS.FRIEND_SUGGESTIONS, limit],
      () => get(`${URL_KEYS.Friends.Suggestions}?limit=${limit}`),
      options,
    ),
  useSearchFriend: (search: string = '') =>
    useApiGet<FriendSuggestionsResponse>(
      [KEYS.SEARCH_FRIEND, search],
      () => get(`${URL_KEYS.Friends.SearchFriends}?search=${search}`),
      {
        enabled: !!search,
      },
    ),

  useGetAcceptedFriends: (
    options?: Omit<
      UseQueryOptions<AcceptedFriendsResponse, CombinedErrorResponse, AcceptedFriendsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<AcceptedFriendsResponse>([KEYS.ACCEPTED_FRIENDS], () => get(URL_KEYS.Friends.AcceptedFriends), options),

  useGetNotifications: (
    page: number = 1,
    limit: number = 20,
    options?: Omit<
      UseQueryOptions<NotificationsResponse, CombinedErrorResponse, NotificationsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<NotificationsResponse>(
      [KEYS.NOTIFICATIONS, page, limit],
      () => get(`${URL_KEYS.Notifications.List}?page=${page}&limit=${limit}`),
      options,
    ),

  useGetNotificationUnreadCount: (
    options?: Omit<
      UseQueryOptions<UnreadCountResponse, CombinedErrorResponse, UnreadCountResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<UnreadCountResponse>([KEYS.NOTIFICATION_UNREAD_COUNT], () => get(URL_KEYS.Notifications.UnreadCount), {
      refetchInterval: 30000,
      ...options,
    }),

  useGetBlockedUsers: (
    page: number = 1,
    limit: number = 20,
    options?: Omit<
      UseQueryOptions<BlockedUsersResponse, CombinedErrorResponse, BlockedUsersResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<BlockedUsersResponse>(
      [KEYS.BLOCKED_USERS, page, limit],
      () => get(`${URL_KEYS.Chat.GetBlock}?page=${page}&limit=${limit}`),
      options,
    ),
  useSearchBlock: (search: string = '') =>
    useApiGet<BlockedUsersResponse>(
      [KEYS.SEARCH_BLOCK, search],
      () => get(`${URL_KEYS.Chat.SearchBlock}?search=${search}`),
      {
        enabled: !!search,
      },
    ),

  useGetFavorites: (
    page: number = 1,
    limit: number = 20,
    options?: Omit<
      UseQueryOptions<FavoritesResponse, CombinedErrorResponse, FavoritesResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<FavoritesResponse>(
      [KEYS.FAVORITES, page, limit],
      () => get(`${URL_KEYS.Chat.GetFavorite}?page=${page}&limit=${limit}`),
      options,
    ),
  useSearchFavorites: (search: string = '') =>
    useApiGet<FavoritesResponse>(
      [KEYS.SEARCH_FAVORITE, search],
      () => get(`${URL_KEYS.Chat.SearchFavorite}?search=${search}`),
      {
        enabled: !!search,
      },
    ),

  useGetMessages: (
    params?: { recipientId?: number; groupId?: number },
    options?: Omit<
      UseQueryOptions<MessagesResponse, CombinedErrorResponse, MessagesResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) => {
    const queryKey = params?.groupId
      ? [KEYS.MESSAGES, 'group', params.groupId]
      : [KEYS.MESSAGES, 'direct', params?.recipientId]

    return useApiGet<MessagesResponse>(
      queryKey,
      () => {
        const searchParams = new URLSearchParams()
        if (params?.recipientId) {
          searchParams.append('recipientId', params.recipientId.toString())
        }
        if (params?.groupId) {
          searchParams.append('groupId', params.groupId.toString())
        }
        const queryString = searchParams.toString()
        const url = queryString ? `${URL_KEYS.Messages.GetMessages}?${queryString}` : URL_KEYS.Messages.GetMessages
        return get(url)
      },
      {
        ...options,
        enabled: !!(params?.recipientId || params?.groupId),
      },
    )
  },

  useGetMessagesInfinite: (chatParams: ChatMembersType | null, pin: string | null) => {
    return useInfiniteQuery<MessagesResponse, Error>({
      queryKey: [KEYS.GET_MESSAGES, chatParams?.chat_id, chatParams?.chat_type],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await get<MessagesResponse>(URL_KEYS.Messages.GetMessages, {
          recipientId:
            chatParams?.chat_type === ChatType.DM && !chatParams?.isAnnouncement ? chatParams?.chat_id : null,
          groupId: chatParams?.chat_type === ChatType.group ? chatParams?.chat_id : null,
          limit: 50,
          offset: pageParam as number,
          pin: pin || null,
          isAnnouncement: chatParams?.isAnnouncement,
          isBroadcast: chatParams?.isBroadcast || false,
          broadcastId: chatParams?.isBroadcast ? chatParams?.chat_id : null,
          is_verified: chatParams?.is_verified || false,
          announcementId: chatParams?.isAnnouncement ? chatParams?.chat_id : undefined,
        })
        return {
          messages: response?.messages || [],
          nextOffset: response.nextOffset,
          hasMore: response.hasMore,
          isFirstPage: pageParam === 0,
          offset: pageParam as number,
          totalCount: response.totalCount,
          chat_type: response.chat_type,
          chat_id: response.chat_id,
          filter: response.filter,
        }
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        return lastPage.hasMore ? lastPage.nextOffset : undefined
      },
      enabled: !!chatParams?.chat_id && !(chatParams?.isLocked && !pin),
      staleTime: 0,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
  },

  useGetGroups: (
    {
      page = 1,
      limit = 10,
      search,
      sort_by = 'created_at',
      sort_order = 'DESC',
    }: {
      page?: number
      limit?: number
      search?: string
      sort_by?: string
      sort_order?: 'ASC' | 'DESC'
    } = {},
    options?: Omit<
      UseQueryOptions<GetGroupsResponse, CombinedErrorResponse, GetGroupsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<GetGroupsResponse>(
      [KEYS.GROUPS, page, limit, search, sort_by, sort_order],
      () => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          sort_by,
          sort_order,
        })
        if (search) {
          params.append('search', search)
        }
        return get(`${URL_KEYS.Group.List}?${params.toString()}`)
      },
      options,
    ),

  useGetUserGroups: (
    options?: Omit<
      UseQueryOptions<GroupResponse, CombinedErrorResponse, GroupResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) => useApiGet<GroupResponse>([KEYS.USER_GROUPS], () => get(URL_KEYS.Group.UserGroups), options),

  useSearchGroup: (search: string = '', subChatActiveTab: string) =>
    useApiGet<GroupResponse>([KEYS.SEARCH_GROUP, search], () => get(`${URL_KEYS.Group.UserGroups}?search=${search}`), {
      enabled: !!search && !!(subChatActiveTab === 'group'),
    }),

  useGetRecentChats: (
    page: number = 1,
    limit: number = 20,
    options?: Omit<
      UseQueryOptions<RecentChatsResponse, CombinedErrorResponse, RecentChatsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<RecentChatsResponse>(
      [KEYS.RECENT_CHATS, page, limit],
      () => get(`${URL_KEYS.Chat.GetRecentChats}?page=${page}&limit=${limit}`),
      {
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        ...options,
      },
    ),
  useSearchRecent: (search: string, subChatActiveTab: string) =>
    useApiGet<RecentChatsResponse>(
      [KEYS.SEARCH_RECENT, search],
      () => get(`${URL_KEYS.Chat.GetSearchRecent}?search=${search}`),
      {
        enabled: !!search && !!(subChatActiveTab === 'direct'),
      },
    ),

  useGetStatusFeed: (
    options?: Omit<
      UseQueryOptions<StatusFeedResponse, CombinedErrorResponse, StatusFeedResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) => useApiGet<StatusFeedResponse>([KEYS.STATUS_FEED], () => get(URL_KEYS.Status.Feed), options),

  useGetDocuments: (
    page: number = 1,
    limit: number = 20,
    options?: Omit<
      UseQueryOptions<DocumentsResponse, CombinedErrorResponse, DocumentsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<DocumentsResponse>(
      [KEYS.DOCUMENTS, page, limit],
      () => get(`${URL_KEYS.Messages.GetDocuments}?page=${page}&limit=${limit}`),
      options,
    ),

  useSearchDocuments: (
    search: string = '',
    options?: Omit<
      UseQueryOptions<DocumentsSearchResponse, CombinedErrorResponse, DocumentsSearchResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<DocumentsSearchResponse>(
      [KEYS.SEARCH_DOCUMENTS, search],
      () => get(`${URL_KEYS.Messages.SearchDocument}?search=${search}`),
      {
        ...options,
        enabled: !!search,
      },
    ),
  useGetStickers: ({
    page = 1,
    limit = 20,
  }: {
    page?: number
    limit?: number
  } = {}) =>
    useApiGet<GetStickersResponse>([KEYS.STICKERS, page, limit], () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      return get(`${URL_KEYS.Sticker.GetAll}?${params.toString()}`)
    }),

  useGetGroupInfo: (
    groupId: number | string | undefined,
    options?: Omit<
      UseQueryOptions<{ group: GroupInfo }, CombinedErrorResponse, { group: GroupInfo }, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<{ group: GroupInfo }>(
      [KEYS.GROUP_INFO, groupId],
      () => get(URL_KEYS.Group.Info.replace(':id', String(groupId))),
      {
        ...options,
        enabled: !!groupId,
      },
    ),

  useGetGroupMembers: (
    groupId: number | string | undefined,
    {
      page = 1,
      limit = 100,
      search,
      sort_by,
      sort_order = 'DESC',
    }: {
      page?: number
      limit?: number
      search?: string
      sort_by?: string
      sort_order?: 'ASC' | 'DESC'
    } = {},
    options?: Omit<
      UseQueryOptions<GetGroupMembersResponse, CombinedErrorResponse, GetGroupMembersResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) => {
    const params = new URLSearchParams({
      group_id: String(groupId || ''),
      page: String(page),
      limit: String(limit),
      sort_order,
    })
    if (search) params.append('search', search)
    if (sort_by) params.append('sort_by', sort_by)

    return useApiGet<GetGroupMembersResponse>(
      [KEYS.GROUP_MEMBERS, groupId, page, limit, search, sort_by, sort_order],
      () => get(`${URL_KEYS.Group.Members}?${params.toString()}`),
      {
        ...options,
      },
    )
  },
  useSearchMessages: (searchParams: SearchParams | null, currentUserId?: string | number) => {
    return useInfiniteQuery({
      queryKey: [
        KEYS.SEARCH_MESSAGES,
        searchParams?.query,
        searchParams?.scope,
        searchParams?.sender_id,
        searchParams?.groupId,
        searchParams?.recipientId,
        currentUserId,
      ],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await get<ResponseSearchMessage>(URL_KEYS.Messages.SearchMessages, {
          recipientId: searchParams?.scope === ChatType.DM ? searchParams.recipientId : null,
          groupId: searchParams?.scope === ChatType.group ? searchParams.groupId : null,
          isAnnouncement: searchParams?.isAnnouncement,
          sender_id: searchParams?.sender_id || null,
          limit: 100,
          page: pageParam,
        })

        const pagination = response?.pagination || {}
        const currentPage = pagination?.currentPage || (pageParam as number)

        // Decrypt and filter messages client-side
        const filteredMessages = []
        const searchLower = searchParams?.query?.toLowerCase().trim() || ''

        for (const msg of response?.messages || []) {
          let decryptedContent = msg.content
          const needsDecryption = msg.is_encrypted || isContentEncrypted(msg.content)

          if (needsDecryption && currentUserId) {
            const isSent = msg.sender_id?.toString() === currentUserId?.toString()
            const shouldDecrypt = msg.is_encrypted || isContentEncrypted(msg.content)
            
            try {
              decryptedContent = await decryptMessageIfNeeded(
                msg.content,
                shouldDecrypt,
                isSent,
                msg.sender_id,
                false,
                currentUserId,
                false
              )
              
              // Validate decrypted content
              if (!decryptedContent || !decryptedContent.trim() || 
                  decryptedContent.startsWith('[') || 
                  decryptedContent.includes('Encrypted message')) {
                throw new Error('Decryption returned invalid content')
              }
            } catch (err) {
              console.error('Failed to decrypt message during search, retrying...', err)
              
              // Retry once after delay
              try {
                await new Promise(resolve => setTimeout(resolve, 300))
                decryptedContent = await decryptMessageIfNeeded(
                  msg.content,
                  shouldDecrypt,
                  isSent,
                  msg.sender_id,
                  false,
                  currentUserId,
                  false
                )
                
                if (!decryptedContent || !decryptedContent.trim() || 
                    decryptedContent.startsWith('[') || 
                    decryptedContent.includes('Encrypted message')) {
                  throw new Error('Retry also returned invalid content')
                }
              } catch (retryErr) {
                console.error('Failed to decrypt message after retry:', retryErr)
                continue
              }
            }
          }

          if (decryptedContent.toLowerCase().includes(searchLower)) {
            filteredMessages.push({
              ...msg,
              content: decryptedContent,
              _originalContent: msg.content,
            })
          }

          if (filteredMessages.length >= (searchParams?.limit || 5)) {
            break
          }
        }

        return {
          messages: filteredMessages,
          nextPage: currentPage + 1,
          hasMore: pagination.hasMore || false,
          isFirstPage: pageParam === 0,
          total: pagination.totalPages || 0,
        }
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        return lastPage.hasMore ? lastPage.nextPage : undefined
      },
      enabled: !!searchParams?.query && searchParams?.query.length >= 1,
      staleTime: 5 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    })
  },
  useArchiveUser: (
    page: number = 1,
    limit: number = 20,
    options?: Omit<
      UseQueryOptions<ArchiveUsersResponse, CombinedErrorResponse, ArchiveUsersResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<ArchiveUsersResponse>(
      [KEYS.ARCHIVE_USER, page, limit],
      () => get(`${URL_KEYS.Chat.Archive}?page=${page}&limit=${limit}`),
      options,
    ),
  useSearchArchive: (search: string = '') =>
    useApiGet<ArchiveUsersResponse>(
      [KEYS.SEARCH_ARCHIVE, search],
      () => get(`${URL_KEYS.Chat.SearchArchive}?search=${search}`),
      {
        enabled: !!search,
      },
    ),

  useGetChatWallpapers: (
    options?: Omit<
      UseQueryOptions<ChatWallpaperResponse, CombinedErrorResponse, ChatWallpaperResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) => useApiGet<ChatWallpaperResponse>([KEYS.CHAT_WALLPAPERS], () => get(URL_KEYS.ChatWallpaper.GetAll), options),
  useGetFaqs: (params: Params) =>
    useApiGet<FAQListResponse>([KEYS.ALL_FAQS, params], () => get(URL_KEYS.FAQ.GetAllFaqs, params)),
  useGetPages: (params: Params) =>
    useApiGet<PageListResponse>([KEYS.ALL_PAGES, params], () => get(URL_KEYS.Page.GetAllPages, params)),
  useGetSettings: (token?: string | null) =>
    useApiGet<SettingsResponse>([KEYS.SETTINGS], () => get(URL_KEYS.Settings.GetSettings), {
      enabled: !!token,
      staleTime: 1000 * 60 * 60,
    }),
  useGetPublicSettings: () =>
    useApiGet<SettingsResponse>([KEYS.PUBLIC_SETTINGS], () => get(URL_KEYS.Settings.GetPublicSettings), {
      enabled: true,
      staleTime: 1000 * 60 * 60,
    }),
  useGetUserProfile: (
    userId: number | undefined,
    options?: Omit<
      UseQueryOptions<SelectedUserProfile, CombinedErrorResponse, SelectedUserProfile, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<SelectedUserProfile>(
      [KEYS.PROFILE_INFO, userId],
      () => get(URL_KEYS.Profile.UserProfile.replace(':id', String(userId))),
      {
        ...options,
      },
    ),
  useGetChatExport: (id: number | undefined, type: string | undefined) => {
    const params = {
      recipientId: type === ChatType.DM ? id : null,
      groupId: type === ChatType.group ? id : null,
    }

    return useApiGet<string>([KEYS.CHAT_EXPORT, id], () => get(URL_KEYS.Chat.Export, params), {
      enabled: false,
      refetchOnWindowFocus: false,
    })
  },
  useGetReportSettings: () =>
    useApiGet<ReportReasonResponse>([KEYS.ALL_REPORT_SETTINGS], () =>
      get(URL_KEYS.ReportSettings.GetAllReportSettings),
    ),

  useGetCallHistory: (
    page: number = 1,
    limit: number = 20,
    filter: 'all' | 'incoming' | 'outgoing' | 'missed' = 'all',
    search: string = '',
    options?: Omit<
      UseQueryOptions<CallHistoryResponse, CombinedErrorResponse, CallHistoryResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<CallHistoryResponse>(
      [KEYS.CALL_HISTORY, page, limit, filter, search],
      () => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          filter,
        })
        if (search) params.append('search', search)
        return get(`${URL_KEYS.Call.History}?${params.toString()}`)
      },
      options,
    ),
  useGetUserSettings: (id: number | String | undefined) =>
    useApiGet<UserSettingResponse>([KEYS.ALL_USER_SETTINGS], () =>
      get(URL_KEYS.UserSetting.GetSetting.replace(':id', String(id))),
    ),
  useGetConnectToDrive: (enabled: boolean) =>
    useApiGet<RedirectResponse>([KEYS.CONNECT_TO_DRIVE], () => get(URL_KEYS.Auth.ConnectToDrive), { enabled }),
  useGetDemoStatus: (
    options?: Omit<
      UseQueryOptions<{ demo: boolean }, CombinedErrorResponse, { demo: boolean }, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<{ demo: boolean }>([KEYS.DEMO_STATUS], () => get('/demo'), {
      staleTime: 1000 * 60 * 60,
      ...options,
    }),
  useGetMutedStatuses: () =>
    useApiGet<MutedUsersResponse>([KEYS.MUTED_STATUSES], () => get(URL_KEYS.Status.GetMutedStatuses)),
  useGetPublicKey: (userId: number | string | undefined) => {
    return useApiGet<{
      id: number | string
      name: string
      email: string
      avatar: string | null
      public_key: string | null
      private_key: string | null
      has_encryption: boolean
      e2e_enabled: boolean
    }>([KEYS.E2E_PUBLIC_KEY, userId], () => get(URL_KEYS.E2E.GetPublicKey.replace(':user_id', String(userId))), {
      enabled: !!userId,
    });
  },
  useGetActivePlans: (
    options?: Omit<
      UseQueryOptions<PlanListResponse, CombinedErrorResponse, PlanListResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) => useApiGet<PlanListResponse>([KEYS.ACTIVE_PLANS], () => get(URL_KEYS.Plan.GetActivePlans), options),
  useGetPlanById: (
    planId: number | undefined,
    options?: Omit<
      UseQueryOptions<
        { message: string; data: SinglePlan },
        CombinedErrorResponse,
        { message: string; data: SinglePlan },
        unknown[]
      >,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<{ message: string; data: SinglePlan }>(
      [KEYS.PLAN_DETAILS, planId],
      () => get(URL_KEYS.Plan.GetPlanById.replace(':id', String(planId))),
      {
        ...options,
        enabled: !!planId,
      },
    ),
  useGetMySubscription: (
    options?: Omit<
      UseQueryOptions<MySubscriptionResponse, CombinedErrorResponse, MySubscriptionResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<MySubscriptionResponse>(
      [KEYS.MY_SUBSCRIPTION],
      () => get(URL_KEYS.Subscription.GetMySubscription),
      options,
    ),
  useGetUserLimits: (
    options?: Omit<
      UseQueryOptions<UserLimitsResponse, CombinedErrorResponse, UserLimitsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) => useApiGet<UserLimitsResponse>([KEYS.USER_LIMITS], () => get(URL_KEYS.Subscription.GetUserLimits), options),
  useGetMyVerificationStatus: (
    options?: Omit<
      UseQueryOptions<
        {
          data: {
            id: number
            is_verified: boolean
            verified_at: string | null
            has_pending_request: boolean
            current_request: {
              id: number
              request_id: string
              full_name: string
              category: string
              document_type: string | null
              document_front: string | null
              document_back: string | null
              selfie: string | null
              status: 'pending' | 'payment_failed' | 'approved' | 'rejected'
              rejection_reason: string | null
              payment: {
                id: number
                status: string
                amount: number
                currency: string
                payment_gateway: string
                completed_at: string | null
              } | null
            } | null
          }
        },
        CombinedErrorResponse,
        {
          data: {
            id: number
            is_verified: boolean
            verified_at: string | null
            has_pending_request: boolean
            current_request: {
              id: number
              request_id: string
              full_name: string
              category: string
              document_type: string | null
              document_front: string | null
              document_back: string | null
              selfie: string | null
              status: 'pending' | 'payment_failed' | 'approved' | 'rejected'
              rejection_reason: string | null
              payment: {
                id: number
                status: string
                amount: number
                currency: string
                payment_gateway: string
                completed_at: string | null
              } | null
            } | null
          }
        },
        unknown[]
      >,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<{
      data: {
        id: number
        is_verified: boolean
        verified_at: string | null
        has_pending_request: boolean
        current_request: {
          id: number
          request_id: string
          full_name: string
          category: string
          document_type: string | null
          document_front: string | null
          document_back: string | null
          selfie: string | null
          status: 'pending' | 'payment_failed' | 'approved' | 'rejected'
          rejection_reason: string | null
          payment: {
            id: number
            status: string
            amount: number
            currency: string
            payment_gateway: string
            completed_at: string | null
          } | null
        } | null
      }
    }>([KEYS.GET_MY_VERIFICATION_STATUS], () => get(URL_KEYS.Verification.GetMyStatus), options),

  useGetMyBroadcasts: (
    page: number = 1,
    limit: number = 100,
    options?: Omit<
      UseQueryOptions<GetMyBroadcastsResponse, CombinedErrorResponse, GetMyBroadcastsResponse, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<GetMyBroadcastsResponse>(
      [KEYS.MY_BROADCASTS, page, limit],
      () => get(`${URL_KEYS.Broadcast.MyBroadcasts}?page=${page}&limit=${limit}`),
      options,
    ),
  useGetBroadcastDetails: (
    broadcastId: number | string | undefined,
    options?: Omit<
      UseQueryOptions<{ message: string; broadcast: any }, CombinedErrorResponse, { message: string; broadcast: any }, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<{ message: string; broadcast: any }>(
      [KEYS.MY_BROADCASTS, 'details', broadcastId],
      () => get(URL_KEYS.Broadcast.Details.replace(':broadcast_id', String(broadcastId))),
      {
        ...options,
        enabled: (options?.enabled ?? true) && !!broadcastId,
      },
    ),
  useGetTranslation: (locale: string, enabled: boolean = true) =>
    useApiGet<TranslationResponse>(
      [KEYS.GET_TRANSLATION, locale],
      () => get(URL_KEYS.Language.GetTranslation.replace(':locale', locale)),
      {
        enabled: enabled && !!locale,
        staleTime: 1000 * 60 * 60,
      },
    ),
  useGetImpersonationStatus: (
    options?: Omit<
      UseQueryOptions<{ isImpersonating: boolean; impersonator: any }, CombinedErrorResponse, { isImpersonating: boolean; impersonator: any }, unknown[]>,
      'queryKey' | 'queryFn'
    >,
  ) =>
    useApiGet<{ isImpersonating: boolean; impersonator: any }>(
      [KEYS.IMPERSONATION_STATUS],
      () => get(URL_KEYS.Impersonation.Status),
      options,
    ),

}


export default queries
