import { SidebarTab } from '../types/components/chat'

export const SIDEBAR_TOOLTIP_LABELS: Record<SidebarTab | string, string> = {
  [SidebarTab.CHATS]: 'chats',
  [SidebarTab.CALL]: 'call',
  [SidebarTab.STATUS]: 'status',
  [SidebarTab.ARCHIVE]: 'archive',
  [SidebarTab.NOTIFICATION]: 'notifications',
  [SidebarTab.DOCUMENT]: 'documents',
  [SidebarTab.FRIEND_SUGGESTIONS]: 'friend_suggestions',
  [SidebarTab.BLOCK_ICON]: 'blocked_users',
  [SidebarTab.FAVORITE]: 'favorites_hint',
  [SidebarTab.SETTINGS]: 'settings',
  mode: 'toggle_theme',
  logout: 'logout_hint',
  help: 'help_support',
} as const

export type SidebarTooltipKey = keyof typeof SIDEBAR_TOOLTIP_LABELS
