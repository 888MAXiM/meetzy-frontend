import { Screen, SidebarTab } from '../types/components/chat'

export const fileTypes = {
  image: {
    mime: ['image/'],
    extensions: 'image/*',
  },
  video: {
    mime: ['video/'],
    extensions: 'video/*',
  },
  audio: {
    mime: ['audio/'],
    extensions: 'audio/*',
  },
  pdf: {
    mime: ['application/pdf', 'application/x-pdf'],
    extensions: '.pdf',
  },
  document: {
    mime: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    extensions: '.doc,.docx,.txt',
  },
  spreadsheet: {
    mime: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    extensions: '.xls,.xlsx,.csv',
  },
  presentation: {
    mime: [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    extensions: '.ppt,.pptx',
  },
  json: {
    mime: ['application/json'],
    extensions: '.json',
  },
  archive: {
    mime: [
      'application/zip',
      'application/x-zip-compressed',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
    ],
    extensions: '.zip,.rar,.7z',
  },

  '.png': { mime: ['image/png'], extensions: '.png' },
  '.jpg': { mime: ['image/jpeg'], extensions: '.jpg' },
  '.jpeg': { mime: ['image/jpeg'], extensions: '.jpeg' },
  '.gif': { mime: ['image/gif'], extensions: '.gif' },
  '.svg': { mime: ['image/svg+xml'], extensions: '.svg' },
  '.webp': { mime: ['image/webp'], extensions: '.webp' },
  '.bmp': { mime: ['image/bmp'], extensions: '.bmp' },
  '.csv': { mime: ['text/csv'], extensions: '.csv' },

  '.zip': { mime: ['application/zip', 'application/x-zip-compressed'], extensions: '.zip' },
  '.rar': { mime: ['application/x-rar-compressed'], extensions: '.rar' },
  '.7z': { mime: ['application/x-7z-compressed'], extensions: '.7z' },

  '.mp4': { mime: ['video/mp4'], extensions: '.mp4' },
  '.webm': { mime: ['video/webm', 'audio/webm'], extensions: '.webm' },
  '.avi': { mime: ['video/avi'], extensions: '.avi' },
  '.mov': { mime: ['video/mov'], extensions: '.mov' },
  '.wmv': { mime: ['video/wmv'], extensions: '.wmv' },
  '.mkv': { mime: ['video/mkv'], extensions: '.mkv' },

  '.mp3': { mime: ['audio/mpeg', 'audio/mp3'], extensions: '.mp3' },
  '.wav': { mime: ['audio/wav'], extensions: '.wav' },
  '.ogg': { mime: ['audio/ogg'], extensions: '.ogg' },
  '.m4a': { mime: ['audio/m4a'], extensions: '.m4a' },
}

export const TAB_TO_SCREEN_MAP: Partial<Record<SidebarTab, Screen>> = {
  [SidebarTab.CALL]: Screen.CALL,
  [SidebarTab.STATUS]: Screen.STATUS,
  [SidebarTab.ARCHIVE]: Screen.ARCHIVE,
  [SidebarTab.NOTIFICATION]: Screen.NOTIFICATIONS,
  [SidebarTab.DOCUMENT]: Screen.DOCUMENTS,
  [SidebarTab.FRIEND_SUGGESTIONS]: Screen.FRIENDS,
  [SidebarTab.BLOCK_ICON]: Screen.BLOCKED_USERS,
  [SidebarTab.FAVORITE]: Screen.FAVORITES,
  [SidebarTab.SETTINGS]: Screen.SETTINGS,
}
