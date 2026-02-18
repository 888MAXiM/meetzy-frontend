import { ChatType } from '../constants'
import { KEYS } from '../constants/keys'
import { URL_KEYS } from '../constants/url'
import type {
  AccountPayload,
  AddMembersPayload,
  CreateGroupResponse,
  CreateBroadcastPayload,
  CreateBroadcastResponse,
  CreateStatusResponse,
  DeleteMessagePayload,
  DeleteMessageResponse,
  DeleteStatusPayload,
  DeleteStatusResponse,
  ReplyStatusPayload,
  ReplyStatusResponse,
  EditMessagePayload,
  EditMessageResponse,
  ForwardMessagePayload,
  ForwardMessageResponse,
  GroupInfo,
  GroupSettings,
  ID,
  LeaveGroupPayload,
  Message,
  PinConversationPayload,
  PinMessagePayload,
  RemoveMembersPayload,
  ResetPasswordPayload,
  RespondToRequestPayload,
  StarMessagePayload,
  StarMessageResponse,
  ToggleArchiveConversationPayload,
  UpdateGroupPayload,
  UpdateGroupSettingsPayload,
  UpdateMemberRolePayload,
  UpdateProfileResponse,
  User,
  ViewStatusPayload,
  ViewStatusResponse,
} from '../types/api'
import { LoginCredentials, RegisterCredentials } from '../types/auth'
import del from './delete'
import { useApiPost } from './hooks'
import post from './post'
import put from './put'

const mutations = {
  useRegister: () =>
    useApiPost<RegisterCredentials, void>([KEYS.REGISTER], (input) => post(URL_KEYS.Auth.Register, input)),

  useLogin: () =>
    useApiPost<LoginCredentials, { token: string; user: User }>([KEYS.LOGIN], (input) =>
      post(URL_KEYS.Auth.Login, input),
    ),

  useLoginInit: () =>
    useApiPost<{ identifier: string }, { type: string; message: string; user_exists?: boolean }>(
      [KEYS.LOGIN_INIT],
      (input) => post(URL_KEYS.Auth.LoginInit, input),
    ),

  useVerifyLoginOtp: () =>
    useApiPost<{ identifier: string; otp: string }, { message: string; token: string; user: User }>(
      [KEYS.VERIFY_LOGIN_OTP],
      (input) => post(URL_KEYS.Auth.VerifyLoginOtp, input),
    ),

  useLinkIdentifier: () =>
    useApiPost<{ identifier: string }, { type: string; message: string; user_exists?: boolean }>(
      [KEYS.LINK_IDENTIFIER],
      (input) => post(URL_KEYS.Auth.LinkIdentifier, input),
    ),

  useVerifyLinkOtp: () =>
    useApiPost<{ identifier: string; otp: string }, { message: string; token: string; user: User }>(
      [KEYS.VERIFY_LINK_OTP],
      (input) => post(URL_KEYS.Auth.VerifyLinkOtp, input),
    ),

  useLinkPassword: () =>
    useApiPost<{ identifier: string; new_password: string }, { type: string; message: string; user_exists?: boolean }>(
      [KEYS.LINK_PASSWORD],
      (input) => post(URL_KEYS.Auth.LinkPassword, input),
    ),

  useVerifyLinkPassword: () =>
    useApiPost<
      { identifier: string; otp: string; new_password: string },
      { message: string; token: string; user: User }
    >([KEYS.VERIFY_LINK_PASSWORD], (input) => post(URL_KEYS.Auth.VerifyLinkPassword, input)),

  useVerifyOtp: () =>
    useApiPost<{ identifier: string; otp: string }, { success: boolean }>([KEYS.VERIFY_OTP], (input) =>
      post(URL_KEYS.Auth.VerifyOtp, input),
    ),

  useResendOtp: () =>
    useApiPost<{ identifier: string }, void>([KEYS.RESEND_OTP], (input) => post(URL_KEYS.Auth.ResendOtp, input)),

  useForgotPassword: () =>
    useApiPost<{ identifier: string }, void>([KEYS.FORGOT_PASSWORD], (input) =>
      post(URL_KEYS.Auth.ForgotPassword, input),
    ),

  useResetPassword: () =>
    useApiPost<ResetPasswordPayload, void>([KEYS.RESET_PASSWORD], (input) => post(URL_KEYS.Auth.ResetPassword, input)),

  useLogout: () => useApiPost<void, void>([KEYS.LOGOUT], () => post(URL_KEYS.Auth.Logout, {})),

  useSendFriendRequest: () =>
    useApiPost<{ friendId: number | string }, { message: string }>([KEYS.SEND_FRIEND_REQUEST], (input) =>
      post(URL_KEYS.Friends.SendRequest, input),
    ),

  useRespondToFriendRequest: () =>
    useApiPost<RespondToRequestPayload, { message: string }>([KEYS.RESPOND_FRIEND_REQUEST], (input) =>
      post(URL_KEYS.Friends.Respond, input),
    ),

  useDeleteNotification: () =>
    useApiPost<{ notificationId: number | string }, { message: string }>(
      [KEYS.DELETE_NOTIFICATION, KEYS.NOTIFICATION_UNREAD_COUNT, KEYS.NOTIFICATIONS],
      (input) => del(`${URL_KEYS.Notifications.Delete}/${input.notificationId}`),
    ),

  useMarkAllNotificationsAsRead: () =>
    useApiPost<void, { message: string }>(
      [KEYS.MARK_ALL_NOTIFICATIONS_READ, KEYS.NOTIFICATION_UNREAD_COUNT, KEYS.NOTIFICATIONS],
      () => post(URL_KEYS.Notifications.MarkAllAsRead, {}),
    ),

  useToggleBlock: () =>
    useApiPost<
      { targetId: number | string | undefined; block_type: string },
      { action: 'block' | 'unblock'; message: string }
    >([KEYS.TOGGLE_BLOCK, KEYS.BLOCKED_USERS], async (data) => post(URL_KEYS.Chat.ToggleBlock, data)),

  useUnblockUser: () =>
    useApiPost<{ targetId: number | string }, { message: string }>([KEYS.UNBLOCK_USER], async (data) =>
      post(URL_KEYS.Chat.Unblock, data),
    ),

  useToggleFavorite: () =>
    useApiPost<
      { targetId: string | number | undefined; targetType: string | undefined },
      { isFavorite: boolean; message: string }
    >([URL_KEYS.Chat.ToggleFavorite], async (data) => post(URL_KEYS.Chat.ToggleFavorite, data)),

  useSendMessage: () =>
    useApiPost<
      {
        recipientId?: number
        groupId?: number
        broadcastId?: number
        content?: string
        message_type?: string
        metadata?: any
        parent_id?: number | string
        file_type?: string | null
        file_url?: string | null
        mentions?: string[]
        is_encrypted?: boolean
      },
      { messages: Message[] }
    >([KEYS.SEND_MESSAGE], (input) => post(URL_KEYS.Messages.SendMessage, input)),

  useEditMessage: () =>
    useApiPost<EditMessagePayload, EditMessageResponse>([KEYS.EDIT_MESSAGE], (input) =>
      post(`${URL_KEYS.Messages.EditMessage}/${input.messageId}`, {
        content: input.content,
        is_encrypted: input.is_encrypted,
      }),
    ),

  useDeleteMessage: () =>
    useApiPost<DeleteMessagePayload, DeleteMessageResponse>([KEYS.DELETE_MESSAGE], (input) =>
      post(`${URL_KEYS.Messages.DeleteMessage}`, input),
    ),

  useStarMessage: () =>
    useApiPost<StarMessagePayload, StarMessageResponse>([KEYS.MESSAGES], (input) =>
      post(`${URL_KEYS.Messages.StarMessage}`, {
        messageIds: input.messageId,
        isStarred: input.isStarred,
      }),
    ),

  useMarkMessagesAsRead: () =>
    useApiPost<{ chat_id: number | string; chat_type: 'direct' | 'group' }, { message: string }>(
      [KEYS.MARK_MESSAGES_AS_READ],
      (input) => post(URL_KEYS.Messages.MarkAsRead, input),
    ),

  useTogglePinMessage: () =>
    useApiPost<PinMessagePayload, string>([KEYS.MESSAGES], (input) =>
      post(`${URL_KEYS.Messages.PinMessage}`, {
        messageId: input.messageId,
        duration: input.duration,
      }),
    ),

  useForwardMessage: () =>
    useApiPost<ForwardMessagePayload, ForwardMessageResponse>([KEYS.MESSAGES], (input) =>
      post(URL_KEYS.Messages.ForwardMessage, {
        messageIds: input.messageIds,
        recipients: input.recipients,
        encryptedContents: input.encryptedContents,
      }),
    ),

  useUpdateProfile: () =>
    useApiPost<AccountPayload | FormData, UpdateProfileResponse>([KEYS.USER_UPDATE, KEYS.USER], (input) =>
      put(URL_KEYS.Profile.UpdateDetails, input),
    ),

  useCreateGroup: () =>
    useApiPost<FormData, CreateGroupResponse>(
      [KEYS.CREATE_GROUP, KEYS.GROUPS, KEYS.USER_GROUPS, KEYS.RECENT_CHATS],
      (input) => post(URL_KEYS.Group.Create, input),
    ),

  useCreateBroadcast: () =>
    useApiPost<CreateBroadcastPayload, CreateBroadcastResponse>(
      [KEYS.CREATE_BROADCAST, KEYS.MY_BROADCASTS, KEYS.RECENT_CHATS],
      (input) => post(URL_KEYS.Broadcast.Create, input),
    ),

  useAddBroadcastRecipients: () =>
    useApiPost<{ broadcast_id: number | string; recipient_ids: (string | number)[] }, { message: string }>(
      [KEYS.MY_BROADCASTS],
      (input) =>
        post(URL_KEYS.Broadcast.AddRecipients.replace(':broadcast_id', String(input.broadcast_id)), {
          recipient_ids: input.recipient_ids,
        }),
    ),

  useRemoveBroadcastRecipients: () =>
    useApiPost<{ broadcast_id: number | string; recipient_ids: (string | number)[] }, { message: string }>(
      [KEYS.MY_BROADCASTS],
      (input) =>
        del(URL_KEYS.Broadcast.RemoveRecipients.replace(':broadcast_id', String(input.broadcast_id)), {
          recipient_ids: input.recipient_ids,
        }),
    ),

  useDeleteBroadcast: () =>
    useApiPost<{ broadcast_id: number | undefined | string }, { message: string }>(
      [KEYS.MY_BROADCASTS, KEYS.RECENT_CHATS],
      (input) => del(URL_KEYS.Broadcast.Delete.replace(':broadcast_id', String(input.broadcast_id))),
    ),

  useCreateStatus: () =>
    useApiPost<FormData, CreateStatusResponse>([KEYS.CREATE_STATUS], (input) => post(URL_KEYS.Status.Create, input)),

  useViewStatus: () =>
    useApiPost<ViewStatusPayload, ViewStatusResponse>([KEYS.VIEW_STATUS], (input) => post(URL_KEYS.Status.View, input)),

  useDeleteStatus: () =>
    useApiPost<DeleteStatusPayload, DeleteStatusResponse>([KEYS.DELETE_STATUS], (input) =>
      del(URL_KEYS.Status.Delete, input),
    ),

  useReplyStatus: () =>
    useApiPost<ReplyStatusPayload, ReplyStatusResponse>([KEYS.REPLY_STATUS], (input) =>
      post(URL_KEYS.Status.Reply, input),
    ),

  useUpdateGroup: () =>
    useApiPost<UpdateGroupPayload, { message: string; data: GroupInfo }>(
      [KEYS.UPDATE_GROUP, KEYS.GROUP_INFO, KEYS.GROUPS],
      (input) => {
        const formData = new FormData()
        formData.append('group_id', String(input.group_id))
        if (input.name) formData.append('name', input.name)
        if (input.description) formData.append('description', input.description)
        if (input.remove_avatar) formData.append('remove_avatar', String(input.remove_avatar))
        if (input.avatar) formData.append('avatar', input.avatar)
        return put(URL_KEYS.Group.Update, formData as any)
      },
    ),

  useAddGroupMembers: () =>
    useApiPost<
      AddMembersPayload,
      {
        message: string
        added: Array<{ user_id: number; role: string }>
        skipped: number[]
        failed: Array<{ user_id: number; reason: string }>
      }
    >([KEYS.ADD_GROUP_MEMBERS, KEYS.GROUP_MEMBERS, KEYS.GROUP_INFO], (input) => post(URL_KEYS.Group.AddMember, input)),

  useRemoveGroupMembers: () =>
    useApiPost<RemoveMembersPayload, { message: string; removed: number[] }>(
      [KEYS.REMOVE_GROUP_MEMBERS, KEYS.GROUP_MEMBERS, KEYS.GROUP_INFO],
      (input) => post(URL_KEYS.Group.RemoveMember, input),
    ),

  useUpdateMemberRole: () =>
    useApiPost<
      UpdateMemberRolePayload,
      { message: string; data: { user_id: number; group_id: number; new_role: string } }
    >([KEYS.UPDATE_MEMBER_ROLE, KEYS.GROUP_MEMBERS], (input) => post(URL_KEYS.Group.UpdateMemberRole, input)),

  useLeaveGroup: () =>
    useApiPost<LeaveGroupPayload, { message: string }>([KEYS.LEAVE_GROUP, KEYS.GROUPS, KEYS.USER_GROUPS], (input) =>
      post(URL_KEYS.Group.Leave, input),
    ),

  useUpdateGroupSettings: () =>
    useApiPost<UpdateGroupSettingsPayload, { message: string; data: GroupSettings }>(
      [KEYS.UPDATE_GROUP_SETTINGS, KEYS.GROUP_INFO],
      (input) => put(URL_KEYS.Group.UpdateSettings, input),
    ),

  useTogglePinConversation: () =>
    useApiPost<PinConversationPayload, { message: string; pinned: boolean; pinned_at?: string }>(
      [KEYS.TOGGLE_PIN_CONVERSATION],
      (input) => post(URL_KEYS.Chat.TogglePinChat, input),
    ),

  useToggleArchiveConversation: () =>
    useApiPost<ToggleArchiveConversationPayload, { message: string }>([KEYS.ARCHIVE_CONVERSATION], (input) =>
      post(URL_KEYS.Chat.ArchiveChat, input),
    ),
  useUnArchiveUser: () =>
    useApiPost<
      { targetId: number | string | undefined; targetType: string | undefined },
      { message: string; action: string }
    >([KEYS.UNARCHIVE_USER, KEYS.ARCHIVE_USER], async (data) => post(URL_KEYS.Chat.Unarchive, data)),
  useToogleReaction: () =>
    useApiPost<{ messageId: ID; emoji: { emoji: string } }, void>([KEYS.ADD_REACTION], (input) =>
      post(URL_KEYS.Messages.MessageReaction, { messageId: input.messageId, emoji: input.emoji.emoji }),
    ),
  useClearChat: () =>
    useApiPost<{ id: number | undefined; type: string | undefined; broadcastId: number | string | undefined }, void>(
      [KEYS.ADD_REACTION, KEYS.MESSAGES],
      (input) => {
        const params = {
          recipientId: input.type === ChatType.DM ? input.id : null,
          groupId: input.type === ChatType.group ? input.id : null,
          broadcastId: input.type === 'broadcast' ? input.broadcastId : null,
        }
        return post(URL_KEYS.Chat.Clear, params)
      },
    ),
  useCreateReport: () =>
    useApiPost<FormData, void>([KEYS.CREATE_REPORT], (input) =>
      post(URL_KEYS.ReportedAccounts.GetCreateReportedAccounts, input),
    ),
  useUpdateUserSetting: () =>
    useApiPost([KEYS.UPDATE_USER_SETTING, KEYS.ALL_USER_SETTINGS], (input) =>
      put(URL_KEYS.UserSetting.UpdateUserSetting, input),
    ),
  useDeleteAccount: () => useApiPost([KEYS.DELETE_ACCOUNT], (input) => del(URL_KEYS.Profile.Delete, input)),
  useArchiveAllChats: () =>
    useApiPost([KEYS.ARCHIVE_ALL_CHATS, KEYS.RECENT_CHATS, KEYS.ARCHIVE_USER], () => post(URL_KEYS.Chat.ArchiveAll)),
  useClearAllChats: () => useApiPost([KEYS.CLEAR_ALL_CHAT], () => post(URL_KEYS.Chat.ClearAll)),
  useDeleteAllChats: () => useApiPost([KEYS.DELETE_ALL_CHATS, KEYS.RECENT_CHATS], () => post(URL_KEYS.Chat.DeleteAll)),
  // useDeleteChats: () =>
  //   useApiPost<{ targetId: number | undefined; targetType: string }, { message: string }>(
  //     [KEYS.DELETE_CHATS, KEYS.RECENT_CHATS],
  //     (input) => post(URL_KEYS.Chat.Delete, input),
  //   ),
  useDeleteChat: () =>
    useApiPost<
      {
        targetId: string | number | undefined
        targetType: 'user' | 'group'
        deleteType?: 'hide_chat' | 'delete_messages'
      },
      { message: string }
    >([KEYS.RECENT_CHATS], (input) => post(URL_KEYS.Chat.Delete, input)),
  useMuteChat: () =>
    useApiPost<
      { target_id: number | string; target_type: string; duration: '1h' | '8h' | '1w' | 'forever' },
      { message: string }
    >([KEYS.RECENT_CHATS], (input) => post(URL_KEYS.Chat.MuteChat, input)),
  useUnmuteChat: () =>
    useApiPost<{ target_id: number | string; target_type: string }, { message: string }>([KEYS.RECENT_CHATS], (input) =>
      post(URL_KEYS.Chat.UnmuteChat, input),
    ),
  useCreateInquiry: () => useApiPost([KEYS.CONTACT_INQUIRIES], (input) => post(URL_KEYS.Contact.Create, input)),

  useLoginWithPassword: () =>
    useApiPost<LoginCredentials, { token: string; user: User }>([KEYS.LOGIN], (input) =>
      post(URL_KEYS.Auth.LoginWithPassword, input),
    ),
  useToggleMuteStatus: () =>
    useApiPost<{ target_id: number | string | undefined }, { message: string }>([KEYS.MUTE_STATUS], (input) =>
      post(URL_KEYS.Status.Mute, input),
    ),
  useToggleDisappearingMessages: () =>
    useApiPost<{ recipientId: number; groupId: number; duration: string; enabled: boolean }, { message: string }>(
      [KEYS.DISAPPEARING_MESSAGES],
      (input) => post(URL_KEYS.Messages.DisappearingMessages, input),
    ),
  useSavePublicKey: () =>
    useApiPost<{ public_key: string; private_key?: string }, { message: string }>([KEYS.E2E_SAVE_KEY], (input) =>
      post(URL_KEYS.E2E.SavePublicKey, input),
    ),
  useDeletePublicKey: () =>
    useApiPost<void, { message: string }>([KEYS.E2E_DELETE_KEY], () => post(URL_KEYS.E2E.DeletePublicKey, {})),
  useForgetChatLockPin: () =>
    useApiPost<{ identifier: string }, { message: string }>([KEYS.FORGET_CHAT_LOCK_PIN], (input) =>
      post(URL_KEYS.UserSetting.ForgetChatLockPin, input),
    ),
  useVerifyChatLockPinOtp: () =>
    useApiPost<{ identifier: string; otp: number }, { message: string }>([KEYS.VERIFY_CHAT_LOCK_PIN_OTP], (input) =>
      post(URL_KEYS.UserSetting.VerifyChatLockPinOtp, input),
    ),
  useResetChatLockPin: () =>
    useApiPost<{ identifier: string; digit: number; new_pin: number }, { message: string }>(
      [KEYS.RESET_CHAT_LOCK_PIN],
      (input) => post(URL_KEYS.UserSetting.ResetChatLockPin, input),
    ),
  useInitiateVerification: () =>
    useApiPost<
      {
        full_name: string
        category: string
        currency?: string
        payment_gateway: 'stripe' | 'paypal'
        plan_slug?: string
        billing_cycle?: 'monthly' | 'yearly'
        amount?: number
      },
      {
        message: string
        data: {
          payment_id: number
          request_id: string
          subscription_id?: number | null
          payment_status: string
          payment_gateway: string
          amount: number
          currency: string
          approval_url?: string
          client_secret?: string
          subscriptionId?: string
          gateway_order_id?: string
          publishable_key?: string
        }
      }
    >([KEYS.INITIATE_VERIFICATION], (input) => post(URL_KEYS.Verification.InitiateVerification, input)),
  useConfirmPayment: () =>
    useApiPost<
      {
        payment_id: number
        gateway_response?: any
      },
      {
        message: string
        data: {
          payment_id: number
          request_id: string
          payment_status: string
          verification_status: string
        }
      }
    >([KEYS.CONFIRM_PAYMENT], (input) => post(URL_KEYS.Verification.ConfirmPayment, input)),
  useSyncStripeSubscription: () =>
    useApiPost<
      {
        session_id: string
      },
      {
        success: boolean
        message: string
        data: {
          subscription_id: number
          stripe_subscription_id: string | null
          status: string
          payment_status: string
        }
      }
    >([KEYS.SYNC_STRIPE_SUBSCRIPTION], (input) => post(URL_KEYS.Verification.SyncStripeSubscription, input)),
  useUploadDocuments: () =>
    useApiPost<
      FormData,
      {
        message: string
        data: {
          request_id: string
          document_type: string
          verification_status: string
        }
      }
    >([KEYS.UPLOAD_DOCUMENTS, KEYS.GET_MY_VERIFICATION_STATUS], (input) =>
      post(URL_KEYS.Verification.UploadDocuments, input),
    ),
  useStopImpersonation: () =>
    useApiPost<void, { message: string; token: string; originalUser: any }>([KEYS.STOP_IMPERSONATION], () =>
      post(URL_KEYS.Impersonation.Stop, {}),
    ),
}

export default mutations
