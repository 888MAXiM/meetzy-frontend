export type ChatType = 'direct' | 'group'

export interface CallParticipant {
  userId: number | string
  socketId: string
  name?: string
  avatar?: string | null
  profile_color?: string | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing?: boolean
  stream: MediaStream | null
  joinedAt?: Date
}

export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'

export interface CallState {
  callId: string | null
  isInCall: boolean
  isInitiator: boolean
  callType: 'audio' | 'video'
  chatType: ChatType
  chatId: number | string | null
  chatName: string | null
  participants: Map<string, CallParticipant>
  localStream: MediaStream | null
  screenShareStream: MediaStream | null
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
  audioOutputMode: 'speaker' | 'microphone'
  callStartTime: Date | null
  individualJoinTime?: Date
  callStatus: CallStatus
  targetBusy: boolean
  currentUserId: string | null
  waitingIncoming: null | {
    callId: string
    chatId: number | string
    chatType: ChatType
    callType: 'audio' | 'video'
    chatName?: string
    initiator: {
      userId: number | string
      name?: string
      avatar?: string | null
      profile_color?: string | null
    }
  }
}



