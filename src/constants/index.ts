export const ImagePath: string = '/assets/images'
export const ImageBaseUrl = import.meta.env.VITE_STORAGE_URL
export const PRIVATE_KEY_STORAGE_KEY = 'e2e_private_key'
export const PUBLIC_KEY_STORAGE_KEY = 'e2e_public_key'

export enum ChatType {
  group = 'group',
  DM = 'direct',
}

export enum CallFilter {
  All = 'all',
  Incoming = 'incoming',
  Outgoing = 'outgoing',
  Missed = 'missed',
}

export enum CallStatus {
  Missed = 'missed',
  Completed = 'completed',
  Rejected = 'rejected',
}

export enum CallDirection {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

export enum CallsType {
  Audio = 'audio',
  Video = 'video',
}

export enum UserAvailabilityStatus {
  Online = 'online',
  Offline = 'offline',
  Away = 'away',
}

export const ICON_SIZE = {
  SMALL: 14,
  MEDIUM: 18,
} as const

export const ITEMS_PER_PAGE = 20
