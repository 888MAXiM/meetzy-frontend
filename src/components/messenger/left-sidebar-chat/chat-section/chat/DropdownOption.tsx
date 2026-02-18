type DropdownHandler = (e: React.MouseEvent) => void

export const getDropdownOptions = (
  selectedUser: any,
  isMuted: boolean,
  allow_archive_chat: boolean,
  isPinned: boolean,
  t: (key: string) => string,
  handlers: {
    handleFavourite?: DropdownHandler
    handlePinClick?: DropdownHandler
    handleMuteClick?: DropdownHandler
    handleArchive?: DropdownHandler
    handleClearClick?: DropdownHandler
    handleToggleSelectionMode?: DropdownHandler
    handleBlockUser?: DropdownHandler
  } = {},
) =>
  [
    {
      id: 'favourite',
      label: selectedUser?.isFavorite ? t('remove_from_favorites') : t('favorite'),
      iconId: selectedUser?.isFavorite ? 'stroke-star' : 'stroke-star',
      onClick: handlers.handleFavourite,
      isVisible: !selectedUser?.isBroadcast,
    },
    {
      id: 'pin',
      label: isPinned ? t('unpin') : t('pin'),
      iconId: 'stroke-pin',
      onClick: handlers.handlePinClick,
      isVisible: true,
    },
    {
      id: 'mute',
      label: isMuted ? t('chat_unmuted') : t('mute_chat'),
      iconId: isMuted ? 'stroke-mute' : 'stroke-mute',
      onClick: handlers.handleMuteClick,
      isVisible: !selectedUser?.isBroadcast,
    },
    {
      id: 'archive',
      label: t('archive'),
      iconId: 'archive',
      onClick: handlers.handleArchive,
      isVisible: !!allow_archive_chat,
    },
    {
      id: 'block',
      label: selectedUser?.isBlocked ? t('unblock') : t('block'),
      iconId: 'block',
      onClick: handlers.handleBlockUser,
      isVisible: selectedUser?.chat_type !== 'group' && !selectedUser?.isBroadcast,
    },
  ].filter((item) => item.isVisible && typeof item.onClick === 'function')
